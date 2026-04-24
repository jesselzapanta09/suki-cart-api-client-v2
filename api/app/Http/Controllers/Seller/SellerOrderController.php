<?php

namespace App\Http\Controllers\Seller;

use App\Helpers\NotificationHelper;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductVariant;
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
                'items' => fn ($q) => $q
                    ->whereHas('product', fn ($p) => $p->where('store_id', $store->id))
                    ->when($status, fn ($itemQuery) => $itemQuery->where('status', $status))
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
            'data' => collect($orders->items())->map(fn ($order) => $this->decorateSellerOrder($order))->values(),
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
                'items' => fn ($q) => $q
                    ->whereHas('product', fn ($p) => $p->where('store_id', $store->id))
                    ->with(['product.images', 'product.store', 'variant']),
            ])
            ->firstOrFail();

        return response()->json([
            'message' => 'Seller order retrieved successfully.',
            'data' => $this->decorateSellerOrder($order),
        ]);
    }

    public function updateStatus(Request $request, $orderId)
    {
        $validated = $request->validate([
            'order_item_id' => 'required|integer|exists:order_items,id',
            'status' => 'required|in:pending,processing,shipped,cancelled',
            'courier_name' => 'nullable|required_if:status,shipped|string|max:255',
            'tracking_number' => 'nullable|required_if:status,shipped|string|max:255',
            'cancellation_reason' => 'nullable|required_if:status,cancelled|string|max:1000',
        ]);

        $store = $this->sellerStore($request);
        $order = $this->sellerOrder($orderId, $store->id);
        $item = $this->sellerOrderItem($order, $validated['order_item_id']);
        $previousStatus = $item->status;

        if (in_array($item->status, ['delivered', 'cancelled'])) {
            return response()->json([
                'message' => 'Cannot update item.',
                'error' => "This item is already {$item->status}.",
            ], 422);
        }

        if ($validated['status'] === 'cancelled' && in_array($item->status, ['shipped', 'delivered'])) {
            return response()->json([
                'message' => 'Cannot cancel item.',
                'error' => 'Shipped or delivered items cannot be cancelled.',
            ], 422);
        }

        DB::transaction(function () use ($order, $item, $validated) {
            if ($validated['status'] === 'cancelled') {
                $this->restoreItemStock($item);
                $item->update([
                    'status' => 'cancelled',
                    'cancelled_by' => 'seller',
                    'cancellation_reason' => $validated['cancellation_reason'],
                    'cancelled_at' => now(),
                ]);
            } else {
                $item->update([
                    'status' => $validated['status'],
                    'courier_name' => $validated['status'] === 'shipped' ? $validated['courier_name'] : $item->courier_name,
                    'tracking_number' => $validated['status'] === 'shipped' ? $validated['tracking_number'] : $item->tracking_number,
                ]);
            }

            $this->recalculateOrderTotalsAndStatus($order);
        });

        if ($validated['status'] !== $previousStatus) {
            $this->notifyCustomerStatusChanged($order, $item->fresh(['product.store']), $store, $validated);
        }

        return $this->freshSellerOrderResponse($order->id, $store->id, 'Order item updated successfully.');
    }

    public function updateShipment(Request $request, $orderId)
    {
        $validated = $request->validate([
            'order_item_id' => 'required|integer|exists:order_items,id',
            'courier_name' => 'required|string|max:255',
            'tracking_number' => 'required|string|max:255',
        ]);

        $store = $this->sellerStore($request);
        $order = $this->sellerOrder($orderId, $store->id);
        $item = $this->sellerOrderItem($order, $validated['order_item_id']);

        $item->update([
            'courier_name' => $validated['courier_name'],
            'tracking_number' => $validated['tracking_number'],
        ]);

        NotificationHelper::send(
            userId: $order->user_id,
            type: 'order',
            title: 'Courier Details Updated',
            message: "{$store->store_name} updated courier details for {$item->product?->name}.",
            data: [
                'order_id' => $order->id,
                'order_item_id' => $item->id,
                'status' => $item->status,
                'url' => "/customer/orders/{$order->id}?item={$item->id}",
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
        $item = $this->sellerOrderItem($order, (int) $itemId);

        if (in_array($item->status, ['cancelled', 'shipped', 'delivered'])) {
            return response()->json([
                'message' => 'Cannot cancel item.',
                'error' => "This item cannot be cancelled once it is {$item->status}.",
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

            $this->recalculateOrderTotalsAndStatus($order);
        });

        NotificationHelper::send(
            userId: $order->user_id,
            type: 'order',
            title: 'Product Order Cancelled',
            message: "{$store->store_name} cancelled {$item->product?->name}.",
            data: [
                'order_id' => $order->id,
                'order_item_id' => $item->id,
                'status' => 'cancelled',
                'url' => "/customer/orders/{$order->id}?item={$item->id}",
            ],
        );

        return $this->freshSellerOrderResponse($order->id, $store->id, 'Order item cancelled successfully.');
    }

    private function sellerStore(Request $request)
    {
        $store = $request->user()->store;

        if (!$store) {
            abort(response()->json(['message' => 'Store not found.'], 404));
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

    private function sellerOrderItem(Order $order, int $itemId): OrderItem
    {
        $item = $order->items->firstWhere('id', $itemId);

        if (!$item) {
            abort(response()->json(['message' => 'Order item not found.'], 404));
        }

        return $item;
    }

    private function freshSellerOrderResponse(int $orderId, int $storeId, string $message)
    {
        $order = Order::query()
            ->where('id', $orderId)
            ->with([
                'user',
                'location',
                'items' => fn ($q) => $q
                    ->whereHas('product', fn ($p) => $p->where('store_id', $storeId))
                    ->with(['product.images', 'product.store', 'variant']),
            ])
            ->firstOrFail();

        return response()->json([
            'message' => $message,
            'data' => $this->decorateSellerOrder($order),
        ]);
    }

    private function restoreItemStock(OrderItem $item): void
    {
        ProductVariant::find($item->product_variant_id)?->increment('stock', $item->quantity);
    }

    private function recalculateOrderTotalsAndStatus(Order $order): void
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

    private function decorateSellerOrder(Order $order): array
    {
        $items = $order->items ?? collect();
        $customer = $order->user;
        $store = $items->first()?->product?->store;
        $activeItems = $items->where('status', '!=', 'cancelled');

        $orderArray = $order->toArray();
        $orderArray['customer'] = $customer ? [
            'id' => $customer->id,
            'uuid' => $customer->uuid,
            'firstname' => $customer->firstname,
            'lastname' => $customer->lastname,
            'email' => $customer->email,
            'contact_number' => $customer->contact_number,
        ] : null;

        $decoratedItems = $items->values()->map(function ($item) {
            $payload = $item->toArray();
            $payload['line_total'] = (float) $item->price * $item->quantity;
            $payload['item_total'] = $item->status === 'cancelled' ? 0 : $payload['line_total'] + (float) $item->shipping_cost;
            return $payload;
        })->toArray();

        $orderArray['store_order'] = [
            'store' => $store ? [
                'id' => $store->id,
                'uuid' => $store->uuid,
                'store_name' => $store->store_name,
            ] : null,
            'items' => $decoratedItems,
            'active_items_count' => $activeItems->count(),
            'cancelled_items_count' => $items->where('status', 'cancelled')->count(),
            'subtotal' => $activeItems->sum(fn ($item) => (float) $item->price * $item->quantity),
            'shipping_cost' => $activeItems->sum(fn ($item) => (float) $item->shipping_cost),
            'status' => $this->sellerStatus($items),
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

    private function notifyCustomerStatusChanged(Order $order, OrderItem $item, $store, array $validated): void
    {
        $status = $validated['status'];
        $message = "{$store->store_name} marked {$item->product?->name} as {$this->statusLabel($status)}.";

        if ($status === 'shipped') {
            $message .= " Courier: {$validated['courier_name']}. Tracking: {$validated['tracking_number']}.";
        }

        NotificationHelper::send(
            userId: $order->user_id,
            type: 'order',
            title: $status === 'cancelled' ? 'Product Order Cancelled' : 'Product Order Updated',
            message: $message,
            data: [
                'order_id' => $order->id,
                'order_item_id' => $item->id,
                'status' => $status,
                'url' => "/customer/orders/{$order->id}?item={$item->id}",
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
