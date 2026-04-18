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
            ->where('stock', '>', 0);

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

        // Price range filter
        if ($minPrice = $request->input('min_price')) {
            $query->where('price', '>=', (float) $minPrice);
        }
        if ($maxPrice = $request->input('max_price')) {
            $query->where('price', '<=', (float) $maxPrice);
        }

        // Sort
        $sortField = $request->input('sort_field', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');
        $allowedSorts = ['id', 'name', 'price', 'stock', 'created_at'];
        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortOrder === 'ascend' ? 'asc' : 'desc');
        }

        $perPage = (int) $request->input('per_page', 10);
        $products = $query->with(['images', 'category', 'store', 'variants'])
            ->paginate($perPage);

        return response()->json($products);
    }

    /**
     * GET /api/products/{id}
     * Get a single product detail with images, category, and store info
     * No authentication required (public)
     */
    public function show($id)
    {
        $product = Product::query()
            ->where('status', 'active')
            ->where('stock', '>', 0)
            ->with(['images', 'category', 'store', 'variants'])
            ->findOrFail($id);

        return response()->json(['product' => $product]);
    }
}
