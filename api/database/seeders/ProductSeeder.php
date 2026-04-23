<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\Store;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    /**
     * Convert weight string to decimal kg value
     * Supports formats like '1kg', '1.2kg', '500g', '330g'
     */
    private function parseWeight($weightString): ?float
    {
        if (!$weightString) {
            return null;
        }

        $weightString = trim(strtolower($weightString));
        
        // Extract numeric value and unit
        if (preg_match('/^([\d.]+)\s*(kg|g|gram|kilogram)?$/', $weightString, $matches)) {
            $value = (float) $matches[1];
            $unit = $matches[2] ?? 'kg';

            // Convert to kg
            if (in_array($unit, ['g', 'gram'])) {
                $value = $value / 1000;
            }

            return round($value, 2);
        }

        return null;
    }

    public function run(): void
    {
        $storesByName = Store::query()->get()->keyBy('store_name');
        $categoriesByName = Category::query()->get()->keyBy('name');

        $catalog = [
            "Pedro's Palengke" => [
                [
                    'name' => 'Fresh Pork Liempo',
                    'description' => 'Locally sourced pork belly, freshly cut and ideal for grilling or adobo.',
                    'weight' => '1kg',
                    'dimension' => '30x20x5cm',
                    'specs' => ['cut' => 'belly', 'weight' => '1kg', 'origin' => 'local'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Dressed Chicken Whole',
                    'description' => 'Cleaned whole chicken, ready for roasting, frying, or soup dishes.',
                    'weight' => '1.2kg',
                    'dimension' => '25x20x10cm',
                    'specs' => ['type' => 'whole', 'weight' => '1.2kg', 'source' => 'fresh'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Brown Eggs Tray',
                    'description' => 'Thirty medium brown eggs packed in a tray for daily household use.',
                    'weight' => '1.8kg',
                    'dimension' => '30x10x8cm',
                    'specs' => ['count' => '30', 'size' => 'medium', 'type' => 'brown'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Tilapia Cleaned',
                    'description' => 'Fresh tilapia cleaned and scaled, perfect for frying or sinigang.',
                    'weight' => '1kg',
                    'dimension' => '25x8x5cm',
                    'specs' => ['type' => 'cleaned', 'weight' => '1kg', 'freshness' => 'fresh'],
                    'status' => 'out_of_stock',
                ],
            ],
            "Lorna's Sari-Sari" => [
                [
                    'name' => 'Instant Noodles Family Pack',
                    'description' => 'Value pack of classic instant noodles for quick merienda or midnight snacks.',
                    'weight' => '330g',
                    'dimension' => '20x15x10cm',
                    'specs' => ['pack' => '6 pieces', 'flavor' => 'chicken', 'quantity' => '55g each'],
                    'status' => 'active',
                ],
                [
                    'name' => '3-in-1 Coffee Mix',
                    'description' => 'Convenient sachet coffee mix with creamy taste for busy mornings.',
                    'weight' => '360g',
                    'dimension' => '18x12x8cm',
                    'specs' => ['type' => '3-in-1', 'sachets' => '20', 'weight' => '18g per sachet'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Assorted Biscuit Pack',
                    'description' => 'Mixed snack biscuits packed for sari-sari counter display and impulse buys.',
                    'weight' => '250g',
                    'dimension' => '22x16x6cm',
                    'specs' => ['packs' => '10', 'variety' => 'assorted', 'weight' => '25g per pack'],
                    'status' => 'draft',
                ],
                [
                    'name' => 'Canned Sardines Bundle',
                    'description' => 'Bundle of tomato sauce sardines, a pantry staple for quick meals.',
                    'weight' => '620g',
                    'dimension' => '15x10x12cm',
                    'specs' => ['cans' => '4', 'flavor' => 'tomato sauce', 'weight' => '155g each'],
                    'status' => 'active',
                ],
            ],
            "Rick's Hardware" => [
                [
                    'name' => 'Steel Nails Assorted',
                    'description' => 'Durable assorted steel nails for woodwork, repairs, and general construction.',
                    'weight' => '1kg',
                    'dimension' => '12x10x8cm',
                    'specs' => ['material' => 'steel', 'types' => 'assorted', 'weight' => '1kg'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Measuring Tape 5m',
                    'description' => 'Compact 5-meter measuring tape with lock feature for home and site use.',
                    'weight' => '200g',
                    'dimension' => '10x10x4cm',
                    'specs' => ['length' => '5m', 'feature' => 'lock function', 'material' => 'metal'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Latex Wall Paint White',
                    'description' => 'Interior latex paint with smooth finish and reliable wall coverage.',
                    'weight' => '6kg',
                    'dimension' => '15x15x20cm',
                    'specs' => ['color' => 'white', 'type' => 'latex', 'volume' => '4L'],
                    'status' => 'active',
                ],
                [
                    'name' => 'PVC Electrical Tape',
                    'description' => 'Insulating tape for cable management, minor repairs, and electrical projects.',
                    'weight' => '150g',
                    'dimension' => '8x8x3cm',
                    'specs' => ['material' => 'PVC', 'type' => 'electrical', 'width' => 'standard'],
                    'status' => 'out_of_stock',
                ],
            ],
            "Gemma's Bakeshop" => [
                [
                    'name' => 'Classic Pandesal Pack',
                    'description' => 'Freshly baked soft pandesal, perfect for breakfast and merienda.',
                    'weight' => '250g',
                    'dimension' => '20x15x8cm',
                    'specs' => ['pieces' => '10', 'texture' => 'soft', 'freshness' => 'baked daily'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Cheese Ensaymada Box',
                    'description' => 'Soft ensaymada topped with butter, sugar, and grated cheese.',
                    'weight' => '300g',
                    'dimension' => '22x18x10cm',
                    'specs' => ['pieces' => '6', 'topping' => 'cheese', 'style' => 'butter sugar'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Loaf Bread',
                    'description' => 'Daily baked loaf bread for sandwiches, toast, and family breakfasts.',
                    'weight' => '600g',
                    'dimension' => '25x12x10cm',
                    'specs' => ['weight' => '600g', 'type' => 'white loaf', 'freshness' => 'daily bake'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Chocolate Cake Slice',
                    'description' => 'Rich chocolate cake slice for dessert counters and cafe-style servings.',
                    'weight' => '120g',
                    'dimension' => '12x12x8cm',
                    'specs' => ['flavor' => 'chocolate', 'type' => 'slice', 'size' => 'single serving'],
                    'status' => 'draft',
                ],
            ],
            'TechZone PH' => [
                [
                    'name' => 'Fast Charging USB-C Cable',
                    'description' => 'Durable USB-C cable with fast charging support for modern smartphones.',
                    'weight' => '50g',
                    'dimension' => '15x8x2cm',
                    'specs' => ['connector' => 'USB-C', 'length' => '1m', 'speed' => 'fast charge'],
                    'status' => 'active',
                ],
                [
                    'name' => '20W Wall Charger',
                    'description' => 'Compact wall charger designed for efficient charging at home or travel.',
                    'weight' => '100g',
                    'dimension' => '8x8x3cm',
                    'specs' => ['wattage' => '20W', 'type' => 'wall charger', 'ports' => 'USB-C'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Wireless Earbuds',
                    'description' => 'Portable wireless earbuds with charging case for music and calls.',
                    'weight' => '60g',
                    'dimension' => '10x6x5cm',
                    'specs' => ['connectivity' => 'wireless', 'case' => 'charging', 'battery' => '8 hours'],
                    'status' => 'active',
                ],
                [
                    'name' => '10000mAh Power Bank',
                    'description' => 'Slim emergency power bank for on-the-go charging during long days out.',
                    'weight' => '200g',
                    'dimension' => '12x6x2cm',
                    'specs' => ['capacity' => '10000mAh', 'type' => 'slim', 'ports' => 'USB-C + USB-A'],
                    'status' => 'out_of_stock',
                ],
            ],
            "Arlene's Beauty Hub" => [
                [
                    'name' => 'Hydrating Facial Wash',
                    'description' => 'Gentle facial cleanser for daily use with a refreshing, non-drying finish.',
                    'weight' => '120g',
                    'dimension' => '8x6x12cm',
                    'specs' => ['volume' => '100ml', 'type' => 'facial wash', 'benefit' => 'hydrating'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Color Protective Hair Conditioner',
                    'description' => 'Rich conditioner formula to maintain color vibrancy and hair smoothness.',
                    'weight' => '280g',
                    'dimension' => '8x8x15cm',
                    'specs' => ['volume' => '250ml', 'for' => 'color-treated hair', 'type' => 'conditioner'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Volumizing Hair Shampoo',
                    'description' => 'Lightweight shampoo formula to boost volume and add body to fine hair.',
                    'weight' => '420g',
                    'dimension' => '8x8x18cm',
                    'specs' => ['volume' => '400ml', 'benefit' => 'volumizing', 'for' => 'fine hair'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Brightening Body Lotion',
                    'description' => 'Moisturizing body lotion formulated for smooth and nourished skin.',
                    'weight' => '280g',
                    'dimension' => '8x8x15cm',
                    'specs' => ['volume' => '250ml', 'type' => 'body lotion', 'benefit' => 'brightening'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Keratin Repair Shampoo',
                    'description' => 'Salon-inspired shampoo that helps smooth and strengthen dry hair.',
                    'weight' => '420g',
                    'dimension' => '8x8x18cm',
                    'specs' => ['volume' => '400ml', 'benefit' => 'repair', 'for' => 'dry hair'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Tinted Lip Balm',
                    'description' => 'Pocket-friendly lip balm with soft tint and moisturizing formula.',
                    'weight' => '10g',
                    'dimension' => '4x4x4cm',
                    'specs' => ['weight' => '4g', 'type' => 'lip balm', 'feature' => 'tinted moisturizing'],
                    'status' => 'draft',
                ],
            ],
            "Kuya Ed's Carinderia" => [
                [
                    'name' => 'Chicken Adobo Meal Pack',
                    'description' => 'Ready-to-serve chicken adobo meal with rice, good for one person.',
                    'weight' => '400g',
                    'dimension' => '20x20x8cm',
                    'specs' => ['servings' => '1', 'includes' => 'rice', 'freshness' => 'hot & fresh'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Pork Menudo Tray',
                    'description' => 'Hearty pork menudo packed in a tray for lunch orders and takeout.',
                    'weight' => '800g',
                    'dimension' => '25x25x10cm',
                    'specs' => ['servings' => '2', 'type' => 'pork menudo', 'freshness' => 'cooked daily'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Lumpiang Shanghai Pack',
                    'description' => 'Crispy lumpiang shanghai rolls bundled for parties and family meals.',
                    'weight' => '350g',
                    'dimension' => '22x15x8cm',
                    'specs' => ['pieces' => '12', 'type' => 'spring rolls', 'style' => 'shanghai'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Pancit Canton Bilao Mini',
                    'description' => 'Small bilao of pancit canton for office snacks and simple gatherings.',
                    'weight' => '600g',
                    'dimension' => '20x20x10cm',
                    'specs' => ['size' => 'mini bilao', 'type' => 'pancit canton', 'servings' => '8-10'],
                    'status' => 'out_of_stock',
                ],
            ],
            'FreshPick Fruits' => [
                [
                    'name' => 'Sweet Mangoes',
                    'description' => 'Ripe sweet mangoes selected daily from trusted farm suppliers.',
                    'weight' => '1kg',
                    'dimension' => '25x20x12cm',
                    'specs' => ['weight' => '1kg', 'ripeness' => 'ripe', 'type' => 'sweet'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Lakatan Bananas',
                    'description' => 'Naturally sweet lakatan bananas ideal for snacks and smoothies.',
                    'weight' => '1kg',
                    'dimension' => '30x12x8cm',
                    'specs' => ['weight' => '1kg', 'variety' => 'lakatan', 'sweetness' => 'naturally sweet'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Red Tomatoes',
                    'description' => 'Fresh red tomatoes for salads, stews, and everyday cooking.',
                    'weight' => '1kg',
                    'dimension' => '22x18x10cm',
                    'specs' => ['weight' => '1kg', 'color' => 'red', 'use' => 'cooking & salads'],
                    'status' => 'active',
                ],
                [
                    'name' => 'White Onions',
                    'description' => 'Kitchen staple white onions with firm bulbs and strong flavor.',
                    'weight' => '1kg',
                    'dimension' => '20x18x10cm',
                    'specs' => ['weight' => '1kg', 'color' => 'white', 'firmness' => 'firm bulbs'],
                    'status' => 'out_of_stock',
                ],
            ],
        ];

        foreach ($catalog as $storeName => $products) {
            $store = $storesByName->get($storeName);

            if (!$store) {
                $this->command?->warn("Skipping products for missing store: {$storeName}");
                continue;
            }

            $category = $categoriesByName->firstWhere('id', $store->category_id);

            if (!$category) {
                $this->command?->warn("Skipping products for store without category: {$storeName}");
                continue;
            }

            foreach ($products as $productData) {
                Product::updateOrCreate(
                    [
                        'store_id' => $store->id,
                        'name' => $productData['name'],
                    ],
                    [
                        'uuid' => Str::uuid(),
                        'store_id' => $store->id,
                        'category_id' => $category->id,
                        'name' => $productData['name'],
                        'description' => $productData['description'],
                        'weight' => $this->parseWeight($productData['weight'] ?? null),
                        'dimension' => $productData['dimension'] ?? null,
                        'specs' => $productData['specs'],
                        'status' => $productData['status'],
                    ]
                );
            }
        }
    }
}
