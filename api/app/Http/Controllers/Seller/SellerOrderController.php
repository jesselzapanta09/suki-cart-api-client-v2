<?php

namespace App\Http\Controllers\Seller;

use App\Helpers\NotificationHelper;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderShipment;
use App\Models\ProductVariant;
use App\Services\ShippingCalculationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SellerOrderController extends Controller
{
    public function index(Request $request)
    {
        $store = $this->sellerStore($request);
        $status = $request->query('status');
        $perPage = min((int) $request->query('per_page', 10), 50);

        $query = Order::query()
            ->whereHas('items.product', fn ($q) => $q->where('store_id', $store->id))
            ->with([
                'user',
                'location',
                'shipments' => fn ($q) => $q->where('store_id', $store->id),
                'items' => fn ($q) => $q
                    ->whereHas('product', fn ($p) => $p->where('store_id', $store->id))
                    ->with(['product.images', 'product.store', 'variant']),
            ])
            ->orderByDesc('created_at');

        if ($status) {
            $query->whereHas('items', fn ($q) => $q
                ->where('status', $status)
                ->whereHas('product', fn ($p) => $p->where('store_id', $store->id)));
        }

        $orders = $query->paginate($perPage);

        return response()->json([
            'message' => 'Seller orders retrieved successfully.',
            'data' => collect($orders->items())->map(fn ($order) => $this->decorateSellerOrder($order, $store->id))->values(),
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
        $store = $this->sellerStore($request);

        $order = Order::query()
            ->where('id', $id)
            ->whereHas('items.product', fn ($q) => $q->where('store_id', $store->id))
            ->with([
                'user',
                'location',
                'shipments' => fn ($q) => $q->where('store_id', $store->id),
                'items' => fn ($q) => $q
                    ->whereHas('product', fn ($p) => $p->where('store_id', $store->id))
                    ->with(['product.images', 'product.store', 'variant']),
            ])
            ->firstOrFail();

        return response()->json([
            'message' => 'Seller order retrieved successfully.',
            'data' => $this->decorateSellerOrder($order, $store->id),
        ]);
    }

    public function updateStatus(Request $request, $orderId)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,processing,shipped,cancelled',
            'courier_name' => 'nullable|required_if:status,shipped|string|max:255',
            'tracking_number' => 'nullable|required_if:status,shipped|string|max:255',
            'cancellation_reason' => 'nullable|required_if:status,cancelled|string|max:1000',
        ]);

        $store = $this->sellerStore($request);
        $order = $this->sellerOrder($orderId, $store->id);
        $previousStatus = $this->sellerStatus($order->items);

        if (in_array($order->status, ['delivered', 'cancelled'])) {
            return response()->json([
                'message' => 'Cannot update order.',
                'error' => "Order is already {$order->status}.",
            ], 422);
        }

        $activeItems = $order->items->where('status', '!=', 'cancelled');
        if ($validated['status'] === 'cancelled' && $activeItems->contains(fn ($item) => in_array($item->status, ['shipped', 'delivered']))) {
            return response()->json([
                'message' => 'Cannot cancel order.',
                'error' => 'Shipped or delivered items cannot be cancelled.',
            ], 422);
        }

        DB::transaction(function () use ($order, $store, $validated) {
            $items = $order->items->where('status', '!=', 'cancelled');

            foreach ($items as $item) {
                if ($validated['status'] === 'cancelled') {
                    $this->restoreItemStock($item);
                    $item->update([
                        'status' => 'cancelled',
                        'cancelled_by' => 'seller',
                        'cancellation_reason' => $validated['cancellation_reason'],
                        'cancelled_at' => now(),
                    ]);
                } else {
                    $item->update(['status' => $validated['status']]);
                }
            }

            if (($validated['status'] ?? null) === 'shipped') {
                OrderShipment::updateOrCreate(
                    ['order_id' => $order->id, 'store_id' => $store->id],
                    [
                        'courier_name' => $validated['courier_name'],
                        'tracking_number' => $validated['tracking_number'],
                    ]
                );
            }

            $this->recalculateOrderTotalsAndStatus($order, [
                'cancelled_by' => 'seller',
                'cancellation_reason' => $validated['cancellation_reason'] ?? null,
            ]);
        });

        if ($validated['status'] !== $previousStatus) {
            $this->notifyCustomerStatusChanged($order, $store, $validated);
        }

        return $this->freshSellerOrderResponse($order->id, $store->id, 'Seller order updated successfully.');
    }

    public function updateShipment(Request $request, $orderId)
    {
        $validated = $request->validate([
            'courier_name' => 'required|string|max:255',
            'tracking_number' => 'required|string|max:255',
        ]);

        $store = $this->sellerStore($request);
        $order = $this->sellerOrder($orderId, $store->id);

        OrderShipment::updateOrCreate(
            ['order_id' => $order->id, 'store_id' => $store->id],
            $validated
        );

        NotificationHelper::send(
            userId: $order->user_id,
            type: 'order',
            title: 'Courier Details Updated',
            message: "{$store->store_name} updated the courier details for Order #{$order->id}.",
            data: [
                'order_id' => $order->id,
                'store_id' => $store->id,
                'status' => $this->sellerStatus($order->items),
                'url' => "/customer/orders/{$order->id}",
            ],
        );

        return $this->freshSellerOrderResponse($order->id, $store->id, 'Courier details saved successfully.');
    }

    public function cancelItem(Request $request, $orderId, $itemId)
    {
        $validated = $request->validate([
            'cancellation_reason' => 'required|string|max:1000',
        ]);

        $store = $this->sellerStore($request);
        $order = $this->sellerOrder($orderId, $store->id);
        $item = $order->items->firstWhere('id', (int) $itemId);

        if (!$item) {
            return response()->json(['message' => 'Order item not found.'], 404);
        }

        if ($item->status === 'cancelled') {
            return response()->json([
                'message' => 'Cannot cancel item.',
                'error' => 'This item is already cancelled.',
            ], 422);
        }

        if (in_array($item->status, ['shipped', 'delivered'])) {
            return response()->json([
                'message' => 'Cannot cancel item.',
                'error' => 'Shipped or delivered items cannot be cancelled.',
            ], 422);
        }

        DB::transaction(function () use ($order, $item, $validated) {
            $this->restoreItemStock($item);
            $item->update([
                'status' => 'cancelled',
                'cancelled_by' => 'seller',
                'cancellation_reason' => $validated['cancellation_reason'],
                'cancelled_at' => now(),
            ]);

            $this->recalculateOrderTotalsAndStatus($order, [
                'cancelled_by' => 'seller',
                'cancellation_reason' => $validated['cancellation_reason'],
            ]);
        });

        NotificationHelper::send(
            userId: $order->user_id,
            type: 'order',
            title: 'Order Item Cancelled',
            message: "{$store->store_name} cancelled {$item->product?->name} from Order #{$order->id}.",
            data: [
                'order_id' => $order->id,
                'order_item_id' => $item->id,
                'store_id' => $store->id,
                'status' => 'cancelled',
                'url' => "/customer/orders/{$order->id}",
            ],
        );

        return $this->freshSellerOrderResponse($order->id, $store->id, 'Order item cancelled successfully.');
    }

    private function sellerStore(Request $request)
    {
        $store = $request->user()->store;

        if (!$store) {
            abort(response()->json([
                'message' => 'Store not found.',
            ], 404));
        }

        return $store;
    }

    private function sellerOrder($orderId, int $storeId): Order
    {
        return Order::query()
            ->where('id', $orderId)
            ->whereHas('items.product', fn ($q) => $q->where('store_id', $storeId))
            ->with([
                'items' => fn ($q) => $q
                    ->whereHas('product', fn ($p) => $p->where('store_id', $storeId))
                    ->with(['product.images', 'product.store', 'variant']),
            ])
            ->firstOrFail();
    }

    private function freshSellerOrderResponse(int $orderId, int $storeId, string $message)
    {
        $order = Order::query()
            ->where('id', $orderId)
            ->with([
                'user',
                'location',
                'shipments' => fn ($q) => $q->where('store_id', $storeId),
                'items' => fn ($q) => $q
                    ->whereHas('product', fn ($p) => $p->where('store_id', $storeId))
                    ->with(['product.images', 'product.store', 'variant']),
            ])
            ->firstOrFail();

        return response()->json([
            'message' => $message,
            'data' => $this->decorateSellerOrder($order, $storeId),
        ]);
    }

    private function restoreItemStock(OrderItem $item): void
    {
        if ($item->product_variant_id) {
            ProductVariant::find($item->product_variant_id)?->increment('stock', $item->quantity);
        }
    }

    private function recalculateOrderTotalsAndStatus(Order $order, array $cancellationData = []): void
    {
        $order->load(['items.product']);

        $activeItems = $order->items
            ->where('status', '!=', 'cancelled')
            ->values();

        $subtotal = $activeItems->sum(fn ($item) => (float) $item->price * $item->quantity);
        $shippingCost = 0;

        if ($activeItems->isNotEmpty()) {
            $shippingItems = $activeItems->map(fn ($item) => [
                'product_id' => $item->product_id,
                'product_variant_id' => $item->product_variant_id,
                'quantity' => $item->quantity,
            ])->all();

            $shippingCost = (new ShippingCalculationService())->calculateShipping($shippingItems)['total_shipping_fee'];
        }

        $activeStatuses = $activeItems->pluck('status')->unique()->values();
        $status = match (true) {
            $activeItems->isEmpty() => 'cancelled',
            $activeStatuses->contains('pending') => 'pending',
            $activeStatuses->contains('processing') => 'processing',
            $activeStatuses->contains('shipped') => 'shipped',
            default => $order->status,
        };

        $order->update([
            'price' => $subtotal,
            'shipping_cost' => $shippingCost,
            'total_price' => $subtotal + $shippingCost,
            'status' => $status,
            'cancelled_by' => $activeItems->isEmpty()
                ? ($cancellationData['cancelled_by'] ?? $order->cancelled_by)
                : $order->cancelled_by,
            'cancellation_reason' => $activeItems->isEmpty()
                ? ($cancellationData['cancellation_reason'] ?? $order->cancellation_reason)
                : $order->cancellation_reason,
        ]);
    }

    private function decorateSellerOrder(Order $order, int $storeId): array
    {
        $items = $order->items ?? collect();
        $activeItems = $items->where('status', '!=', 'cancelled');
        $shipment = $order->shipments?->firstWhere('store_id', $storeId);
        $customer = $order->user;
        $store = $items->first()?->product?->store;

        $orderArray = $order->toArray();
        $orderArray['customer'] = $customer ? [
            'id' => $customer->id,
            'uuid' => $customer->uuid,
            'firstname' => $customer->firstname,
            'lastname' => $customer->lastname,
            'email' => $customer->email,
            'contact_number' => $customer->contact_number,
        ] : null;
        $orderArray['store_order'] = [
            'store' => $store ? [
                'id' => $store->id,
                'uuid' => $store->uuid,
                'store_name' => $store->store_name,
            ] : null,
            'items' => $items->values()->toArray(),
            'active_items_count' => $activeItems->count(),
            'cancelled_items_count' => $items->where('status', 'cancelled')->count(),
            'subtotal' => $activeItems->sum(fn ($item) => (float) $item->price * $item->quantity),
            'status' => $this->sellerStatus($items),
            'shipment' => $shipment?->toArray(),
        ];

        return $orderArray;
    }

    private function sellerStatus($items): string
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

    private function notifyCustomerStatusChanged(Order $order, $store, array $validated): void
    {
        $status = $validated['status'];
        $label = $this->statusLabel($status);

        $message = "{$store->store_name} marked Order #{$order->id} as {$label}.";
        if ($status === 'shipped') {
            $message .= " Courier: {$validated['courier_name']}. Tracking: {$validated['tracking_number']}.";
        }

        NotificationHelper::send(
            userId: $order->user_id,
            type: 'order',
            title: $status === 'cancelled' ? 'Store Order Cancelled' : 'Order Status Updated',
            message: $message,
            data: [
                'order_id' => $order->id,
                'store_id' => $store->id,
                'status' => $status,
                'url' => "/customer/orders/{$order->id}",
            ],
        );
    }

    private function statusLabel(string $status): string
    {
        return [
            'pending' => 'Order placed',
            'processing' => 'Preparing to ship',
            'shipped' => 'Shipped out',
            'delivered' => 'Delivered',
            'cancelled' => 'Cancelled',
        ][$status] ?? ucfirst($status);
    }
}
