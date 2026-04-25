<?php

namespace App\Http\Controllers\Home;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductReview;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

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
        $products = $query
            ->with(['images', 'category', 'store', 'variants'])
            ->withCount('reviews')
            ->withAvg('reviews', 'rating')
            ->withSum([
                'orderItems as sold' => fn ($orderQuery) => $orderQuery->where('status', 'delivered'),
            ], 'quantity')
            ->paginate($perPage);

        $products->getCollection()->transform(function (Product $product) {
            return $this->decorateProductSummary($product);
        });

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
            ->with([
                'images',
                'category',
                'store',
                'variants',
                'reviews' => fn ($q) => $q->latest()->with(['user', 'variant']),
            ])
            ->withCount('reviews')
            ->withAvg('reviews', 'rating')
            ->withSum([
                'orderItems as sold' => fn ($orderQuery) => $orderQuery->where('status', 'delivered'),
            ], 'quantity')
            ->firstOrFail();

        return response()->json([
            'product' => $this->decorateProductDetail($product),
        ]);
    }

    private function decorateProductSummary(Product $product): array
    {
        $payload = $product->toArray();
        $payload['rating'] = round((float) ($product->reviews_avg_rating ?? 0), 1);
        $payload['review_count'] = (int) ($product->reviews_count ?? 0);
        $payload['sold'] = (int) ($product->sold ?? 0);

        return $payload;
    }

    private function decorateProductDetail(Product $product): array
    {
        $payload = $this->decorateProductSummary($product);
        $reviews = $product->reviews instanceof Collection ? $product->reviews : collect($product->reviews);
        $reviewCount = (int) ($product->reviews_count ?? $reviews->count());
        $averageRating = round((float) ($product->reviews_avg_rating ?? 0), 1);
        $storeSummary = $this->storeReviewSummary((int) $product->store_id);

        $distribution = collect(range(5, 1))->map(function (int $stars) use ($reviews, $reviewCount) {
            $count = $reviews->where('rating', $stars)->count();

            return [
                'stars' => $stars,
                'count' => $count,
                'percentage' => $reviewCount > 0 ? round(($count / $reviewCount) * 100) : 0,
            ];
        })->values()->all();

        $payload['review_summary'] = [
            'average_rating' => $averageRating,
            'review_count' => $reviewCount,
            'distribution' => $distribution,
        ];

        $payload['reviews'] = $reviews->map(function ($review) {
            return [
                'id' => $review->id,
                'rating' => $review->rating,
                'review' => $review->review,
                'variant_name' => $review->variant_name,
                'created_at' => $review->created_at,
                'user' => $review->user ? [
                    'id' => $review->user->id,
                    'firstname' => $review->user->firstname,
                    'lastname' => $review->user->lastname,
                ] : null,
            ];
        })->values()->all();

        if (!empty($payload['store'])) {
            $payload['store']['rating'] = $storeSummary['average_rating'];
            $payload['store']['review_count'] = $storeSummary['review_count'];
        }

        return $payload;
    }

    private function storeReviewSummary(int $storeId): array
    {
        $summary = ProductReview::query()
            ->selectRaw('COUNT(*) as review_count, AVG(rating) as average_rating')
            ->whereHas('product', fn ($q) => $q->where('store_id', $storeId))
            ->first();

        return [
            'average_rating' => round((float) ($summary?->average_rating ?? 0), 1),
            'review_count' => (int) ($summary?->review_count ?? 0),
        ];
    }
}
