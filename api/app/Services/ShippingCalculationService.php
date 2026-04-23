<?php

namespace App\Services;

use App\Models\Product;

class ShippingCalculationService
{
    // Shipping constants
    private const BASE_SHIPPING_FEE = 100; // ₱100 base per store
    private const WEIGHT_RATE = 50; // ₱50 per kg

    /**
     * Calculate shipping fees for order items
     * 
     * Groups items by store and calculates shipping for each group
     * 
     * @param array $items Array of order items with product_id, product_variant_id, quantity
     * @return array Detailed shipping breakdown
     */
    public function calculateShipping(array $items)
    {
        // Get all products with their store information
        $productIds = array_unique(array_column($items, 'product_id'));
        $products = Product::whereIn('id', $productIds)
            ->with('store')
            ->get()
            ->keyBy('id');

        // Group items by store
        $itemsByStore = [];
        foreach ($items as $item) {
            $product = $products->get($item['product_id']);
            
            if (!$product) {
                throw new \Exception("Product {$item['product_id']} not found");
            }

            $storeId = $product->store_id;
            
            if (!isset($itemsByStore[$storeId])) {
                $itemsByStore[$storeId] = [
                    'store_id' => $storeId,
                    'store_name' => $product->store->store_name ?? 'Unknown Store',
                    'items' => [],
                    'total_weight' => 0,
                    'shipping_fee' => 0,
                ];
            }

            $itemsByStore[$storeId]['items'][] = $item;
            
            // Calculate weight for this item (weight in kg × quantity)
            $weight = ($product->weight ?? 0) * $item['quantity'];
            $itemsByStore[$storeId]['total_weight'] += $weight;
        }

        // Calculate shipping fee for each store group
        $totalShippingFee = 0;
        $shippingBreakdown = [];

        foreach ($itemsByStore as $storeId => $storeData) {
            $shippingFee = self::BASE_SHIPPING_FEE + ($storeData['total_weight'] * self::WEIGHT_RATE);
            $itemsByStore[$storeId]['shipping_fee'] = $shippingFee;
            $totalShippingFee += $shippingFee;

            $shippingBreakdown[] = [
                'store_id' => $storeData['store_id'],
                'store_name' => $storeData['store_name'],
                'total_weight' => $storeData['total_weight'],
                'base_fee' => self::BASE_SHIPPING_FEE,
                'weight_fee' => $storeData['total_weight'] * self::WEIGHT_RATE,
                'shipping_fee' => $shippingFee,
            ];
        }

        return [
            'breakdown' => $shippingBreakdown,
            'total_shipping_fee' => $totalShippingFee,
        ];
    }
}
