<?php

namespace App\Http\Controllers\Customer;

use App\Helpers\NotificationHelper;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\StoreOrderRequest;
use App\Http\Requests\Customer\UpdateOrderRequest;
use App\Models\Cart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use App\Services\ShippingCalculationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerOrderController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $status = $request->query('status');
        $perPage = min((int) $request->query('per_page', 15), 50);

        $query = Order::query()
            ->where('user_id', $user->id)
            ->whereHas('items', fn ($q) => $status ? $q->where('status', $status) : $q)
            ->with(['location', 'items' => function ($q) use ($status) {
                $q->when($status, fn ($itemQuery) => $itemQuery->where('status', $status))
                    ->with(['product.images', 'product.store', 'variant']);
            }])
            ->orderByDesc('created_at');

        $orders = $query->paginate($perPage);

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

    public function show(Request $request, $id)
    {
        $order = Order::query()
            ->where('user_id', $request->user()->id)
            ->where('id', $id)
            ->with(['location', 'user', 'items' => fn ($q) => $q->with(['product.images', 'product.store', 'variant'])])
            ->firstOrFail();

        return response()->json([
            'message' => 'Order retrieved successfully.',
            'data' => $this->decorateOrder($order),
        ]);
    }

    public function store(StoreOrderRequest $request)
    {
        $user = $request->user();
        $data = $request->validated();
        $user->locations()->findOrFail($data['location_id']);

        $items = $data['items'];
        $shippingResult = (new ShippingCalculationService())->calculateShipping($items);
        $shippingByIndex = collect($shippingResult['breakdown'])->keyBy('index');

        try {
            $order = DB::transaction(function () use ($user, $data, $items, $shippingResult, $shippingByIndex) {
                $totalPrice = 0;

                foreach ($items as $item) {
                    $variant = ProductVariant::find($item['product_variant_id']);

                    if (!$variant) {
                        throw new \Exception('One or more product variants were not found.');
                    }

                    if ($variant->stock < $item['quantity']) {
                        throw new \Exception("Only {$variant->stock} items available for {$variant->name}.");
                    }

                    $totalPrice += (float) $variant->price * (int) $item['quantity'];
                }

                $order = Order::create([
                    'user_id' => $user->id,
                    'location_id' => $data['location_id'],
                    'price' => $totalPrice,
                    'shipping_cost' => $shippingResult['total_shipping_fee'],
                    'total_price' => $totalPrice + $shippingResult['total_shipping_fee'],
                    'status' => 'pending',
                    'address_extra' => $data['address_extra'] ?? null,
                    'message' => $data['message'] ?? null,
                ]);

                foreach ($items as $index => $item) {
                    $variant = ProductVariant::find($item['product_variant_id']);

                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_id' => $item['product_id'],
                        'product_variant_id' => $item['product_variant_id'],
                        'quantity' => $item['quantity'],
                        'price' => $variant->price,
                        'shipping_cost' => $shippingByIndex->get($index)['shipping_fee'] ?? 0,
                        'status' => 'pending',
                    ]);

                    $variant->decrement('stock', $item['quantity']);

                    if (!empty($item['cart_id'])) {
                        Cart::where('user_id', $user->id)->where('id', $item['cart_id'])->delete();
                    } else {
                        Cart::where('user_id', $user->id)
                            ->where('product_id', $item['product_id'])
                            ->where('product_variant_id', $item['product_variant_id'])
                            ->delete();
                    }
                }

                return $order;
            });

            $order->load(['location', 'items' => fn ($q) => $q->with(['product.images', 'product.store', 'variant'])]);
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

    public function update(UpdateOrderRequest $request, $id)
    {
        return response()->json([
            'message' => 'Order-level status updates are disabled.',
            'error' => 'Please update or cancel an individual order item.',
        ], 422);
    }

    public function cancelItem(Request $request, $orderId, $itemId)
    {
        $validated = $request->validate([
            'cancellation_reason' => 'required|string|max:1000',
        ]);

        $order = $this->customerOrder($request, $orderId);
        $item = $order->items->firstWhere('id', (int) $itemId);

        if (!$item) {
            return response()->json(['message' => 'Order item not found.'], 404);
        }

        if (!in_array($item->status, ['pending', 'processing'])) {
            return response()->json([
                'message' => 'Cannot cancel item.',
                'error' => "This item cannot be cancelled once it is {$item->status}.",
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

            $this->recalculateOrderTotals($order);
        });

        $order->load(['location', 'items' => fn ($q) => $q->with(['product.images', 'product.store', 'variant'])]);
        $this->notifyItemCancelled($order, $item->fresh(['product.store']), $validated['cancellation_reason']);

        return response()->json([
            'message' => 'Order item cancelled successfully.',
            'data' => $this->decorateOrder($order),
        ]);
    }

    public function deliverItem(Request $request, $orderId, $itemId)
    {
        $order = $this->customerOrder($request, $orderId);
        $item = $order->items->firstWhere('id', (int) $itemId);

        if (!$item) {
            return response()->json(['message' => 'Order item not found.'], 404);
        }

        if ($item->status !== 'shipped') {
            return response()->json([
                'message' => 'Cannot mark item delivered.',
                'error' => 'Only shipped items can be marked as delivered.',
            ], 422);
        }

        $item->update(['status' => 'delivered']);
        $this->recalculateOrderTotals($order);

        $order->load(['location', 'items' => fn ($q) => $q->with(['product.images', 'product.store', 'variant'])]);
        $this->notifyItemDelivered($order, $item->fresh(['product.store']));

        return response()->json([
            'message' => 'Order item marked as delivered.',
            'data' => $this->decorateOrder($order),
        ]);
    }

    public function destroy(Request $request, $id)
    {
        return response()->json([
            'message' => 'Order deletion is disabled.',
            'error' => 'Please cancel individual order items instead.',
        ], 422);
    }

    public function calculateShipping(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.cart_id' => 'nullable|integer',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.product_variant_id' => 'required|integer|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        try {
            return response()->json([
                'message' => 'Shipping calculated successfully.',
                'data' => (new ShippingCalculationService())->calculateShipping($validated['items']),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to calculate shipping.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    private function customerOrder(Request $request, int $orderId): Order
    {
        return Order::query()
            ->where('user_id', $request->user()->id)
            ->where('id', $orderId)
            ->with('items')
            ->firstOrFail();
    }

    private function restoreItemStock(OrderItem $item): void
    {
        ProductVariant::find($item->product_variant_id)?->increment('stock', $item->quantity);
    }

    private function recalculateOrderTotals(Order $order): void
    {
        $order->load('items');
        $activeItems = $order->items->where('status', '!=', 'cancelled')->values();
        $statuses = $activeItems->pluck('status');

        $status = match (true) {
            $activeItems->isEmpty() => 'cancelled',
            $statuses->contains('pending') => 'pending',
            $statuses->contains('processing') => 'processing',
            $statuses->contains('shipped') => 'shipped',
            default => 'delivered',
        };

        $subtotal = $activeItems->sum(fn ($item) => (float) $item->price * $item->quantity);
        $shippingCost = $activeItems->sum(fn ($item) => (float) $item->shipping_cost);

        $order->update([
            'price' => $subtotal,
            'shipping_cost' => $shippingCost,
            'total_price' => $subtotal + $shippingCost,
            'status' => $status,
        ]);
    }

    private function decorateOrder(Order $order): array
    {
        $items = $order->items ?? collect();
        $orderArray = $order->toArray();

        $orderArray['active_items_count'] = $items->where('status', '!=', 'cancelled')->count();
        $orderArray['cancelled_items_count'] = $items->where('status', 'cancelled')->count();
        $orderArray['order_items'] = $items->values()->map(fn ($item) => $this->decorateItem($item))->toArray();
        $orderArray['item_groups'] = $items->values()->map(fn ($item) => [
            'store' => $this->storePayload($item->product?->store),
            'status' => $item->status,
            'shipment' => $item->courier_name ? [
                'courier_name' => $item->courier_name,
                'tracking_number' => $item->tracking_number,
            ] : null,
            'items' => [$this->decorateItem($item)],
            'subtotal' => $item->status === 'cancelled' ? 0 : (float) $item->price * $item->quantity,
        ])->toArray();

        return $orderArray;
    }

    private function decorateItem(OrderItem $item): array
    {
        $payload = $item->toArray();
        $payload['line_total'] = (float) $item->price * $item->quantity;
        $payload['item_total'] = $item->status === 'cancelled' ? 0 : $payload['line_total'] + (float) $item->shipping_cost;
        $payload['store'] = $this->storePayload($item->product?->store);

        return $payload;
    }

    private function storePayload($store): ?array
    {
        return $store ? [
            'id' => $store->id,
            'uuid' => $store->uuid,
            'store_name' => $store->store_name,
            'description' => $store->description,
            'banner' => $store->banner,
        ] : null;
    }

    private function notifyOrderPlaced(Order $order): void
    {
        foreach ($order->items as $item) {
            NotificationHelper::send(
                userId: $order->user_id,
                type: 'order',
                title: 'Order Placed',
                message: "{$item->product?->name} has been ordered.",
                data: [
                    'order_id' => $order->id,
                    'order_item_id' => $item->id,
                    'status' => 'pending',
                    'url' => "/customer/orders/{$order->id}?item={$item->id}",
                ],
            );

            $store = $item->product?->store;
            if ($store) {
                NotificationHelper::send(
                    userId: $store->user_id,
                    type: 'order',
                    title: 'New Product Order',
                    message: "{$item->product?->name} was ordered by a customer.",
                    data: [
                        'order_id' => $order->id,
                        'order_item_id' => $item->id,
                        'status' => 'pending',
                        'url' => "/seller/orders/{$order->id}?item={$item->id}",
                    ],
                );
            }
        }
    }

    private function notifyItemCancelled(Order $order, OrderItem $item, string $reason): void
    {
        NotificationHelper::send(
            userId: $order->user_id,
            type: 'order',
            title: 'Product Order Cancelled',
            message: "{$item->product?->name} was cancelled.",
            data: [
                'order_id' => $order->id,
                'order_item_id' => $item->id,
                'status' => 'cancelled',
                'url' => "/customer/orders/{$order->id}?item={$item->id}",
            ],
        );

        $store = $item->product?->store;
        if ($store) {
            NotificationHelper::send(
                userId: $store->user_id,
                type: 'order',
                title: 'Product Order Cancelled',
                message: "The customer cancelled {$item->product?->name}. Reason: {$reason}",
                data: [
                    'order_id' => $order->id,
                    'order_item_id' => $item->id,
                    'status' => 'cancelled',
                    'url' => "/seller/orders/{$order->id}?item={$item->id}",
                ],
            );
        }
    }

    private function notifyItemDelivered(Order $order, OrderItem $item): void
    {
        $store = $item->product?->store;

        if ($store) {
            NotificationHelper::send(
                userId: $store->user_id,
                type: 'order',
                title: 'Product Delivered',
                message: "The customer confirmed delivery for {$item->product?->name}.",
                data: [
                    'order_id' => $order->id,
                    'order_item_id' => $item->id,
                    'status' => 'delivered',
                    'url' => "/seller/orders/{$order->id}?item={$item->id}",
                ],
            );
        }
    }
}
