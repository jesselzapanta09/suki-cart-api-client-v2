<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\StoreProductVariantRequest;
use App\Http\Requests\Seller\UpdateProductVariantRequest;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class SellerProductVariantController extends Controller
{
    /**
     * GET /api/seller/products/{product_id}/variants
     * Get all variants for a product
     */
    public function index($productId, Request $request)
    {
        $user = $request->user();
        $product = Product::query()
            ->where('store_id', $user->store->id)
            ->findOrFail($productId);

        $variants = $product->variants;

        return response()->json([
            'data' => $variants,
            'count' => $variants->count(),
        ]);
    }

    /**
     * GET /api/seller/products/{product_id}/variants/{variant_id}
     * Get a specific variant
     */
    public function show($productId, $variantId, Request $request)
    {
        $user = $request->user();
        $product = Product::query()
            ->where('store_id', $user->store->id)
            ->findOrFail($productId);

        $variant = $product->variants()
            ->findOrFail($variantId);

        return response()->json(['data' => $variant]);
    }

    /**
     * POST /api/seller/products/{product_id}/variants
     * Create a new variant
     */
    public function store($productId, StoreProductVariantRequest $request)
    {
        $user = $request->user();
        $product = Product::query()
            ->where('store_id', $user->store->id)
            ->findOrFail($productId);

        $data = $request->validated();
        
        // Create variant
        $variant = $product->variants()->create([
            'name' => $data['name'],
            'price' => $data['price'],
            'stock' => $data['stock'],
        ]);

        return response()->json([
            'message' => 'Variant created successfully.',
            'data' => $variant,
        ], 201);
    }

    /**
     * PUT /api/seller/products/{product_id}/variants/{variant_id}
     * Update a variant
     */
    public function update($productId, $variantId, UpdateProductVariantRequest $request)
    {
        $user = $request->user();
        $product = Product::query()
            ->where('store_id', $user->store->id)
            ->findOrFail($productId);

        $variant = $product->variants()
            ->findOrFail($variantId);

        $data = $request->validated();
        $variant->update([
            'name' => $data['name'],
            'price' => $data['price'],
            'stock' => $data['stock'],
        ]);

        return response()->json([
            'message' => 'Variant updated successfully.',
            'data' => $variant,
        ]);
    }

    /**
     * DELETE /api/seller/products/{product_id}/variants/{variant_id}
     * Delete a variant
     */
    public function destroy($productId, $variantId, Request $request)
    {
        $user = $request->user();
        $product = Product::query()
            ->where('store_id', $user->store->id)
            ->findOrFail($productId);

        $variant = $product->variants()
            ->findOrFail($variantId);

        // Check if variant is in any cart
        if ($variant->cartItems()->exists()) {
            throw ValidationException::withMessages([
                'variant' => ['Cannot delete variant that is in customer carts'],
            ]);
        }

        $variant->delete();

        return response()->json(['message' => 'Variant deleted successfully.']);
    }
}
