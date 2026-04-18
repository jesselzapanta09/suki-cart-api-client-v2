<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\StoreCartRequest;
use App\Http\Requests\Customer\UpdateCartRequest;
use App\Models\Cart;
use Illuminate\Http\Request;

class CustomerCartController extends Controller
{
    /**
     * GET /api/customer/cart
     * Fetch all cart items for authenticated customer.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $cartItems = Cart::query()
            ->where('user_id', $user->id)
            ->with(['product' => function ($q) {
                $q->with(['images', 'category', 'store', 'variants']);
            }, 'variant'])
            ->get();

        return response()->json([
            'message' => 'Cart items retrieved successfully.',
            'data' => $cartItems,
        ]);
    }

    /**
     * POST /api/customer/cart
     * Add item to cart or increment quantity if already exists.
     */
    public function store(StoreCartRequest $request)
    {
        $user = $request->user();
        $data = $request->validated();

        // Check if product/variant combination already in cart
        $existingCart = Cart::where('user_id', $user->id)
            ->where('product_id', $data['product_id'])
            ->where('product_variant_id', $data['product_variant_id'] ?? null)
            ->first();

        if ($existingCart) {
            // Increment quantity
            $newQuantity = $existingCart->quantity + $data['quantity'];
            
            // Validate stock
            if ($data['product_variant_id']) {
                $variant = $existingCart->variant;
                if ($variant->stock < $newQuantity) {
                    return response()->json([
                        'message' => 'Not enough stock available.',
                        'error' => "Only {$variant->stock} items available.",
                    ], 422);
                }
            } else {
                $product = $existingCart->product;
                if ($product->stock < $newQuantity) {
                    return response()->json([
                        'message' => 'Not enough stock available.',
                        'error' => "Only {$product->stock} items available.",
                    ], 422);
                }
            }

            $existingCart->update(['quantity' => $newQuantity]);
            $cartItem = $existingCart->load(['product' => function ($q) {
                $q->with(['images', 'category', 'store', 'variants']);
            }, 'variant']);

            return response()->json([
                'message' => 'Item quantity updated in cart.',
                'data' => $cartItem,
            ]);
        }

        // Create new cart item
        $cartItem = Cart::create([
            'user_id' => $user->id,
            'product_id' => $data['product_id'],
            'product_variant_id' => $data['product_variant_id'] ?? null,
            'quantity' => $data['quantity'],
        ]);

        $cartItem->load(['product' => function ($q) {
            $q->with(['images', 'category', 'store', 'variants']);
        }, 'variant']);

        return response()->json([
            'message' => 'Item added to cart successfully.',
            'data' => $cartItem,
        ], 201);
    }

    /**
     * PUT /api/customer/cart/{id}
     * Update quantity of a cart item.
     */
    public function update(UpdateCartRequest $request, $id)
    {
        $user = $request->user();
        $data = $request->validated();

        $cartItem = Cart::findOrFail($id);

        // Check authorization
        if ($cartItem->user_id !== $user->id) {
            return response()->json([
                'message' => 'Unauthorized.',
                'error' => 'You do not have permission to update this cart item.',
            ], 403);
        }

        $cartItem->update(['quantity' => $data['quantity']]);

        $cartItem->load(['product' => function ($q) {
            $q->with(['images', 'category', 'store', 'variants']);
        }, 'variant']);

        return response()->json([
            'message' => 'Cart item updated successfully.',
            'data' => $cartItem,
        ]);
    }

    /**
     * DELETE /api/customer/cart/{id}
     * Remove a single item from cart.
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $cartItem = Cart::findOrFail($id);

        // Check authorization
        if ($cartItem->user_id !== $user->id) {
            return response()->json([
                'message' => 'Unauthorized.',
                'error' => 'You do not have permission to delete this cart item.',
            ], 403);
        }

        $cartItem->delete();

        return response()->json([
            'message' => 'Cart item removed successfully.',
        ]);
    }

    /**
     * DELETE /api/customer/cart
     * Clear entire cart for authenticated customer.
     */
    public function destroyAll(Request $request)
    {
        $user = $request->user();
        Cart::where('user_id', $user->id)->delete();

        return response()->json([
            'message' => 'Cart cleared successfully.',
        ]);
    }
}
