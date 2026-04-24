<?php

namespace App\Http\Controllers\Customer;

use App\Helpers\NotificationHelper;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\StoreOrderRequest;
use App\Http\Requests\Customer\UpdateOrderRequest;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Cart;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Services\ShippingCalculationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerOrderController extends Controller
{
    /**
     * GET /api/customer/orders
     * Fetch all orders for authenticated customer with filtering.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $status = $request->query('status');
        
        $query = Order::query()
            ->where('user_id', $user->id)
            ->with(['location', 'shipments', 'items' => function ($q) {
                $q->with(['product' => function ($p) {
                    $p->with(['images', 'store']);
                }, 'variant']);
            }])
            ->orderByDesc('created_at');

        if ($status) {
            $query->where('status', $status);
        }

        $orders = $query->paginate(15);

        return response()->json([
            'message' => 'Orders retrieved successfully.',
            'data' => collect($orders->items())->map(fn ($order) => $this->decorateOrder($order))->values(),
            'pagination' => [
                'total' => $orders->total(),
                'per_page' => $orders->perPage(),
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
            ],
        ]);
    }

    /**
     * GET /api/customer/orders/{id}
     * Fetch a specific order with all details.
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();
        
        $order = Order::query()
            ->where('user_id', $user->id)
            ->where('id', $id)
            ->with(['location', 'user', 'shipments', 'items' => function ($q) {
                $q->with(['product' => function ($p) {
                    $p->with(['images', 'store']);
                }, 'variant']);
            }])
            ->firstOrFail();

        return response()->json([
            'message' => 'Order retrieved successfully.',
            'data' => $this->decorateOrder($order),
        ]);
    }

    /**
     * POST /api/customer/orders
     * Create a new order from cart items (checkout).
     */
    public function store(StoreOrderRequest $request)
    {
        $user = $request->user();
        $data = $request->validated();

        // Verify location belongs to user
        $location = $user->locations()->findOrFail($data['location_id']);

        // Get items to order
        $items = $data['items'];
        
        // Calculate total price and validate stock
        $totalPrice = 0;
        foreach ($items as $item) {
            $product = Product::find($item['product_id']);
            
            if (!$product) {
                return response()->json([
                    'message' => 'Validation failed.',
                    'error' => 'One or more products not found.',
                ], 422);
            }

            // Get variant if specified
            if ($item['product_variant_id'] ?? null) {
                $variant = ProductVariant::find($item['product_variant_id']);
                if (!$variant) {
                    return response()->json([
                        'message' => 'Validation failed.',
                        'error' => 'One or more product variants not found.',
                    ], 422);
                }

                // Check stock
                if ($variant->stock < $item['quantity']) {
                    return response()->json([
                        'message' => 'Insufficient stock.',
                        'error' => "Only {$variant->stock} items available for variant.",
                    ], 422);
                }

                $totalPrice += $variant->price * $item['quantity'];
            }
        }

        try {
            // Calculate shipping fees
            $shippingService = new ShippingCalculationService();
            $shippingResult = $shippingService->calculateShipping($items);
            $shippingCost = $shippingResult['total_shipping_fee'];

            // Create order
            $order = Order::create([
                'user_id' => $user->id,
                'location_id' => $data['location_id'],
                'price' => $totalPrice,
                'shipping_cost' => $shippingCost,
                'total_price' => $totalPrice + $shippingCost,
                'status' => 'pending',
                'address_extra' => $data['address_extra'] ?? null,
                'message' => $data['message'] ?? null,
            ]);

            // Create order items and reduce stock
            foreach ($items as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'product_variant_id' => $item['product_variant_id'] ?? null,
                    'quantity' => $item['quantity'],
                    'price' => $item['product_variant_id'] ?? null
                        ? ProductVariant::find($item['product_variant_id'])->price
                        : 0,
                    'status' => 'pending',
                ]);

                // Reduce variant stock
                if ($item['product_variant_id'] ?? null) {
                    $variant = ProductVariant::find($item['product_variant_id']);
                    $variant->decrement('stock', $item['quantity']);
                }

                // Remove from cart
                if (!empty($item['cart_id'])) {
                    Cart::where('user_id', $user->id)
                        ->where('id', $item['cart_id'])
                        ->delete();
                } else {
                    Cart::where('user_id', $user->id)
                        ->where('product_id', $item['product_id'])
                        ->when(
                            $item['product_variant_id'] ?? null,
                            fn ($query, $variantId) => $query->where('product_variant_id', $variantId),
                            fn ($query) => $query->whereNull('product_variant_id')
                        )
                        ->delete();
                }
            }

            $order->load(['location', 'shipments', 'items' => function ($q) {
                $q->with(['product' => function ($p) {
                    $p->with(['images', 'store']);
                }, 'variant']);
            }]);

            $this->notifyOrderPlaced($order);

            return response()->json([
                'message' => 'Order created successfully.',
                'data' => $this->decorateOrder($order),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create order.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * PUT /api/customer/orders/{id}
     * Update order status or cancel order.
     */
    public function update(UpdateOrderRequest $request, $id)
    {
        $user = $request->user();
        $data = $request->validated();

        $order = Order::query()
            ->where('user_id', $user->id)
            ->where('id', $id)
            ->firstOrFail();

        // Validate status transition
        $currentStatus = $order->status;
        $newStatus = $data['status'] ?? $currentStatus;

        // Prevent transitioning from delivered or cancelled
        if (in_array($currentStatus, ['delivered', 'cancelled'])) {
            return response()->json([
                'message' => 'Cannot update order.',
                'error' => "Order is already {$currentStatus}.",
            ], 422);
        }

        if ($newStatus === 'cancelled' && !in_array($currentStatus, ['pending', 'processing'])) {
            return response()->json([
                'message' => 'Cannot cancel order.',
                'error' => "Order cannot be cancelled once it is {$currentStatus}.",
            ], 422);
        }

        if ($newStatus === 'delivered' && $currentStatus !== 'shipped') {
            return response()->json([
                'message' => 'Cannot mark order delivered.',
                'error' => 'Only shipped orders can be marked as delivered.',
            ], 422);
        }

        DB::transaction(function () use ($order, $data, $newStatus, $currentStatus) {
            $order->load('items');

            if ($newStatus === 'cancelled' && $currentStatus !== 'cancelled') {
                foreach ($order->items->where('status', '!=', 'cancelled') as $item) {
                    $this->restoreItemStock($item);
                    $item->update([
                        'status' => 'cancelled',
                        'cancelled_by' => $data['cancelled_by'] ?? 'customer',
                        'cancellation_reason' => $data['cancellation_reason'] ?? null,
                        'cancelled_at' => now(),
                    ]);
                }
            } elseif ($newStatus === 'delivered' && $currentStatus !== 'delivered') {
                foreach ($order->items->where('status', '!=', 'cancelled') as $item) {
                    $item->update(['status' => 'delivered']);
                }
            }

            $order->update([
                'status' => $newStatus,
                'cancelled_by' => $newStatus === 'cancelled' ? ($data['cancelled_by'] ?? 'customer') : $order->cancelled_by,
                'cancellation_reason' => $newStatus === 'cancelled' ? ($data['cancellation_reason'] ?? null) : $order->cancellation_reason,
            ]);

            $this->recalculateOrderTotals($order, [
                'cancelled_by' => $data['cancelled_by'] ?? 'customer',
                'cancellation_reason' => $data['cancellation_reason'] ?? null,
            ]);
        });

        $order->load(['location', 'shipments', 'items' => function ($q) {
            $q->with(['product' => function ($p) {
                $p->with(['images', 'store']);
            }, 'variant']);
        }]);

        if ($newStatus === 'cancelled' && $currentStatus !== 'cancelled') {
            $this->notifyOrderCancelled($order, $data['cancellation_reason'] ?? null);
        } elseif ($newStatus === 'delivered' && $currentStatus !== 'delivered') {
            $this->notifyOrderDelivered($order);
        }

        return response()->json([
            'message' => 'Order updated successfully.',
            'data' => $this->decorateOrder($order),
        ]);
    }

    /**
     * PUT /api/customer/orders/{order}/items/{item}/cancel
     * Cancel a single item inside an order and recalculate totals.
     */
    public function cancelItem(Request $request, $orderId, $itemId)
    {
        $validated = $request->validate([
            'cancellation_reason' => 'required|string|max:1000',
        ]);

        $user = $request->user();

        $order = Order::query()
            ->where('user_id', $user->id)
            ->where('id', $orderId)
            ->with('items')
            ->firstOrFail();

        if (!in_array($order->status, ['pending', 'processing'])) {
            return response()->json([
                'message' => 'Cannot cancel item.',
                'error' => "Items cannot be cancelled once an order is {$order->status}.",
            ], 422);
        }

        $item = $order->items->firstWhere('id', (int) $itemId);

        if (!$item) {
            return response()->json([
                'message' => 'Order item not found.',
            ], 404);
        }

        if ($item->status === 'cancelled') {
            return response()->json([
                'message' => 'Cannot cancel item.',
                'error' => 'This item is already cancelled.',
            ], 422);
        }

        DB::transaction(function () use ($order, $item, $validated) {
            $this->restoreItemStock($item);

            $item->update([
                'status' => 'cancelled',
                'cancelled_by' => 'customer',
                'cancellation_reason' => $validated['cancellation_reason'],
                'cancelled_at' => now(),
            ]);

            $this->recalculateOrderTotals($order, [
                'cancelled_by' => 'customer',
                'cancellation_reason' => $validated['cancellation_reason'],
            ]);
        });

        $order->load(['location', 'shipments', 'items' => function ($q) {
            $q->with(['product' => function ($p) {
                $p->with(['images', 'store']);
            }, 'variant']);
        }]);

        $this->notifyItemCancelled($order, $item, $validated['cancellation_reason']);

        return response()->json([
            'message' => 'Order item cancelled successfully.',
            'data' => $this->decorateOrder($order),
        ]);
    }

    /**
     * DELETE /api/customer/orders/{id}
     * Soft delete order (only for pending orders).
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        
        $order = Order::query()
            ->where('user_id', $user->id)
            ->where('id', $id)
            ->firstOrFail();

        // Only allow deletion of pending orders
        if ($order->status !== 'pending') {
            return response()->json([
                'message' => 'Cannot delete order.',
                'error' => 'Only pending orders can be deleted.',
            ], 422);
        }

        $order->delete();

        return response()->json([
            'message' => 'Order deleted successfully.',
        ]);
    }

    /**
     * POST /api/customer/orders/calculate-shipping
     * Calculate shipping fees for given items
     */
    public function calculateShipping(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.product_variant_id' => 'nullable|integer|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        try {
            $shippingService = new ShippingCalculationService();
            $result = $shippingService->calculateShipping($validated['items']);

            return response()->json([
                'message' => 'Shipping calculated successfully.',
                'data' => $result,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to calculate shipping.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    private function restoreItemStock(OrderItem $item): void
    {
        if ($item->product_variant_id) {
            ProductVariant::find($item->product_variant_id)?->increment('stock', $item->quantity);
        }
    }

    private function recalculateOrderTotals(Order $order, array $cancellationData = []): void
    {
        $order->load(['items.product']);

        $activeItems = $order->items
            ->where('status', '!=', 'cancelled')
            ->values();

        $subtotal = $activeItems->sum(fn ($item) => (float) $item->price * $item->quantity);
        $shippingCost = 0;
        $status = $order->status;

        if ($activeItems->isNotEmpty()) {
            $shippingItems = $activeItems->map(fn ($item) => [
                'product_id' => $item->product_id,
                'product_variant_id' => $item->product_variant_id,
                'quantity' => $item->quantity,
            ])->all();

            $shippingCost = (new ShippingCalculationService())->calculateShipping($shippingItems)['total_shipping_fee'];

            if ($status === 'cancelled') {
                $status = 'pending';
            }
        } else {
            $status = 'cancelled';
        }

        $order->update([
            'price' => $subtotal,
            'shipping_cost' => $shippingCost,
            'total_price' => $subtotal + $shippingCost,
            'status' => $status,
            'cancelled_by' => $activeItems->isEmpty()
                ? ($cancellationData['cancelled_by'] ?? $order->cancelled_by ?? 'customer')
                : $order->cancelled_by,
            'cancellation_reason' => $activeItems->isEmpty()
                ? ($cancellationData['cancellation_reason'] ?? $order->cancellation_reason)
                : $order->cancellation_reason,
        ]);
    }

    private function decorateOrder(Order $order): array
    {
        $orderArray = $order->toArray();
        $items = $order->items ?? collect();
        $shipments = $order->shipments ?? collect();

        $orderArray['active_items_count'] = $items->where('status', '!=', 'cancelled')->count();
        $orderArray['cancelled_items_count'] = $items->where('status', 'cancelled')->count();
        $orderArray['item_groups'] = $items
            ->groupBy(fn ($item) => $item->product?->store?->id ?? 'unknown')
            ->values()
            ->map(function ($items) use ($shipments) {
                $storeId = $items->first()?->product?->store?->id;
                $store = $items->first()?->product?->store;

                return [
                    'store' => $store ? [
                        'id' => $store->id,
                        'uuid' => $store->uuid,
                        'store_name' => $store->store_name,
                        'description' => $store->description,
                        'banner' => $store->banner,
                    ] : null,
                    'shipment' => $storeId ? $shipments->firstWhere('store_id', $storeId)?->toArray() : null,
                    'items' => $items->values()->toArray(),
                    'subtotal' => $items
                        ->where('status', '!=', 'cancelled')
                        ->sum(fn ($item) => (float) $item->price * $item->quantity),
                    'status' => $this->groupStatus($items),
                ];
            })
            ->toArray();

        return $orderArray;
    }

    private function groupStatus($items): string
    {
        $active = $items->where('status', '!=', 'cancelled');

        if ($active->isEmpty()) {
            return 'cancelled';
        }

        $statuses = $active->pluck('status');

        if ($statuses->contains('pending')) {
            return 'pending';
        }

        if ($statuses->contains('processing')) {
            return 'processing';
        }

        if ($statuses->contains('shipped')) {
            return 'shipped';
        }

        return $active->first()?->status ?? 'pending';
    }

    private function notifyOrderPlaced(Order $order): void
    {
        NotificationHelper::send(
            userId: $order->user_id,
            type: 'order',
            title: 'Order Placed',
            message: "Your Order #{$order->id} has been placed.",
            data: [
                'order_id' => $order->id,
                'status' => 'pending',
                'url' => "/customer/orders/{$order->id}",
            ],
        );

        foreach ($this->storesForOrder($order) as $store) {
            NotificationHelper::send(
                userId: $store->user_id,
                type: 'order',
                title: 'New Order Received',
                message: "A customer placed Order #{$order->id} for {$store->store_name}.",
                data: [
                    'order_id' => $order->id,
                    'store_id' => $store->id,
                    'status' => 'pending',
                    'url' => "/seller/orders/{$order->id}",
                ],
            );
        }
    }

    private function notifyOrderCancelled(Order $order, ?string $reason): void
    {
        NotificationHelper::send(
            userId: $order->user_id,
            type: 'order',
            title: 'Order Cancelled',
            message: "Your Order #{$order->id} was cancelled.",
            data: [
                'order_id' => $order->id,
                'status' => 'cancelled',
                'url' => "/customer/orders/{$order->id}",
            ],
        );

        foreach ($this->storesForOrder($order) as $store) {
            NotificationHelper::send(
                userId: $store->user_id,
                type: 'order',
                title: 'Order Cancelled',
                message: "Order #{$order->id} was cancelled by the customer" . ($reason ? ". Reason: {$reason}" : "."),
                data: [
                    'order_id' => $order->id,
                    'store_id' => $store->id,
                    'status' => 'cancelled',
                    'url' => "/seller/orders/{$order->id}",
                ],
            );
        }
    }

    private function notifyItemCancelled(Order $order, OrderItem $item, string $reason): void
    {
        $store = $item->product?->store;

        NotificationHelper::send(
            userId: $order->user_id,
            type: 'order',
            title: 'Order Item Cancelled',
            message: "{$item->product?->name} was cancelled from Order #{$order->id}.",
            data: [
                'order_id' => $order->id,
                'order_item_id' => $item->id,
                'status' => 'cancelled',
                'url' => "/customer/orders/{$order->id}",
            ],
        );

        if ($store) {
            NotificationHelper::send(
                userId: $store->user_id,
                type: 'order',
                title: 'Order Item Cancelled',
                message: "The customer cancelled {$item->product?->name} from Order #{$order->id}. Reason: {$reason}",
                data: [
                    'order_id' => $order->id,
                    'order_item_id' => $item->id,
                    'store_id' => $store->id,
                    'status' => 'cancelled',
                    'url' => "/seller/orders/{$order->id}",
                ],
            );
        }
    }

    private function notifyOrderDelivered(Order $order): void
    {
        NotificationHelper::send(
            userId: $order->user_id,
            type: 'order',
            title: 'Order Delivered',
            message: "Order #{$order->id} has been marked as delivered.",
            data: [
                'order_id' => $order->id,
                'status' => 'delivered',
                'url' => "/customer/orders/{$order->id}",
            ],
        );

        foreach ($this->storesForOrder($order) as $store) {
            NotificationHelper::send(
                userId: $store->user_id,
                type: 'order',
                title: 'Order Delivered',
                message: "The customer confirmed delivery for Order #{$order->id}.",
                data: [
                    'order_id' => $order->id,
                    'store_id' => $store->id,
                    'status' => 'delivered',
                    'url' => "/seller/orders/{$order->id}",
                ],
            );
        }
    }

    private function storesForOrder(Order $order)
    {
        return $order->items
            ->map(fn ($item) => $item->product?->store)
            ->filter()
            ->unique('id')
            ->values();
    }
}
