<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\StoreOrderRequest;
use App\Http\Requests\Customer\UpdateOrderRequest;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Cart;
use App\Models\ProductVariant;
use Illuminate\Http\Request;

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
            ->with(['location', 'items' => function ($q) {
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
            'data' => $orders->items(),
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
            ->with(['location', 'user', 'items' => function ($q) {
                $q->with(['product' => function ($p) {
                    $p->with(['images', 'store']);
                }, 'variant']);
            }])
            ->firstOrFail();

        return response()->json([
            'message' => 'Order retrieved successfully.',
            'data' => $order,
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
            $product = $user->orders()->getModel()->getConnection()->table('products')
                ->find($item['product_id']);
            
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
            // Create order
            $order = Order::create([
                'user_id' => $user->id,
                'location_id' => $data['location_id'],
                'price' => $totalPrice,
                'shipping_cost' => 0, // Default, can be updated later
                'total_price' => $totalPrice,
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
                        : $item['product_id'], // Use variant price if available
                ]);

                // Reduce variant stock
                if ($item['product_variant_id'] ?? null) {
                    $variant = ProductVariant::find($item['product_variant_id']);
                    $variant->decrement('stock', $item['quantity']);
                }

                // Remove from cart
                Cart::where('user_id', $user->id)
                    ->where('product_id', $item['product_id'])
                    ->where('product_variant_id', $item['product_variant_id'])
                    ->delete();
            }

            $order->load(['location', 'items' => function ($q) {
                $q->with(['product' => function ($p) {
                    $p->with(['images', 'store']);
                }, 'variant']);
            }]);

            return response()->json([
                'message' => 'Order created successfully.',
                'data' => $order,
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

        // Update order
        $order->update([
            'status' => $newStatus,
            'cancelled_by' => $data['cancelled_by'] ?? null,
            'cancellation_reason' => $data['cancellation_reason'] ?? null,
        ]);

        // If cancelling, restore variant stock
        if ($newStatus === 'cancelled' && $currentStatus !== 'cancelled') {
            foreach ($order->items as $item) {
                if ($item->product_variant_id) {
                    ProductVariant::find($item->product_variant_id)
                        ->increment('stock', $item->quantity);
                }
            }
        }

        $order->load(['location', 'items' => function ($q) {
            $q->with(['product' => function ($p) {
                $p->with(['images', 'store']);
            }, 'variant']);
        }]);

        return response()->json([
            'message' => 'Order updated successfully.',
            'data' => $order,
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
}
