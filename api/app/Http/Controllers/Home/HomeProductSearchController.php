<?php

namespace App\Http\Controllers\Home;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class HomeProductSearchController extends Controller
{
    /**
     * GET /api/products/search
     * Public product search endpoint - no authentication required
     * Filters: status='active', stock > 0
     * Supports search, pagination, and sorting
     */
    public function index(Request $request)
    {
        $query = Product::query()
            ->where('status', 'active')
            ->whereHas('variants', function ($q) {
                $q->where('stock', '>', 0);
            })
            // Verify seller - only show products from approved stores
            ->whereHas('store.verification', function ($q) {
                $q->where('store_status', 'approved');
            });

        // Search by name or description
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Category filter
        if ($categoryId = $request->input('category_id')) {
            $query->where('category_id', $categoryId);
        }

        // Price range filter - now checking variant prices
        if ($minPrice = $request->input('min_price')) {
            $query->whereHas('variants', function ($q) use ($minPrice) {
                $q->where('price', '>=', (float) $minPrice);
            });
        }
        if ($maxPrice = $request->input('max_price')) {
            $query->whereHas('variants', function ($q) use ($maxPrice) {
                $q->where('price', '<=', (float) $maxPrice);
            });
        }

        // Sort
        $sortField = $request->input('sort_field', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');
        $allowedSorts = ['id', 'name', 'created_at'];
        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortOrder === 'ascend' ? 'asc' : 'desc');
        }

        $perPage = (int) $request->input('per_page', 10);
        $products = $query->with(['images', 'category', 'store', 'variants'])
            ->paginate($perPage);

        return response()->json($products);
    }

    /**
     * GET /api/products/{uuid}
     * Get a single product detail with images, category, and store info
     * No authentication required (public)
     * Only accessible if the store is verified/approved
     */
    public function show($uuid)
    {
        $product = Product::query()
            ->where('status', 'active')
            ->where('uuid', $uuid)
            ->whereHas('variants', function ($q) {
                $q->where('stock', '>', 0);
            })
            // Verify seller - only show products from approved stores
            ->whereHas('store.verification', function ($q) {
                $q->where('store_status', 'approved');
            })
            ->with(['images', 'category', 'store', 'variants'])
            ->firstOrFail();

        return response()->json(['product' => $product]);
    }
}
