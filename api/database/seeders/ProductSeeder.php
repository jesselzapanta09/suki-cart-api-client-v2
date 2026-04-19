<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\Store;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $storesByName = Store::query()->get()->keyBy('store_name');
        $categoriesByName = Category::query()->get()->keyBy('name');

        $catalog = [
            "Pedro's Palengke" => [
                [
                    'name' => 'Fresh Pork Liempo',
                    'description' => 'Locally sourced pork belly, freshly cut and ideal for grilling or adobo.',
                    'specs' => ['cut' => 'belly', 'weight' => '1kg', 'origin' => 'local'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Dressed Chicken Whole',
                    'description' => 'Cleaned whole chicken, ready for roasting, frying, or soup dishes.',
                    'specs' => ['type' => 'whole', 'weight' => '1.2kg', 'source' => 'fresh'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Brown Eggs Tray',
                    'description' => 'Thirty medium brown eggs packed in a tray for daily household use.',
                    'specs' => ['count' => '30', 'size' => 'medium', 'type' => 'brown'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Tilapia Cleaned',
                    'description' => 'Fresh tilapia cleaned and scaled, perfect for frying or sinigang.',
                    'specs' => ['type' => 'cleaned', 'weight' => '1kg', 'freshness' => 'fresh'],
                    'status' => 'out_of_stock',
                ],
            ],
            "Lorna's Sari-Sari" => [
                [
                    'name' => 'Instant Noodles Family Pack',
                    'description' => 'Value pack of classic instant noodles for quick merienda or midnight snacks.',
                    'specs' => ['pack' => '6 pieces', 'flavor' => 'chicken', 'quantity' => '55g each'],
                    'status' => 'active',
                ],
                [
                    'name' => '3-in-1 Coffee Mix',
                    'description' => 'Convenient sachet coffee mix with creamy taste for busy mornings.',
                    'specs' => ['type' => '3-in-1', 'sachets' => '20', 'weight' => '18g per sachet'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Assorted Biscuit Pack',
                    'description' => 'Mixed snack biscuits packed for sari-sari counter display and impulse buys.',
                    'specs' => ['packs' => '10', 'variety' => 'assorted', 'weight' => '25g per pack'],
                    'status' => 'draft',
                ],
                [
                    'name' => 'Canned Sardines Bundle',
                    'description' => 'Bundle of tomato sauce sardines, a pantry staple for quick meals.',
                    'specs' => ['cans' => '4', 'flavor' => 'tomato sauce', 'weight' => '155g each'],
                    'status' => 'active',
                ],
            ],
            "Rick's Hardware" => [
                [
                    'name' => 'Steel Nails Assorted',
                    'description' => 'Durable assorted steel nails for woodwork, repairs, and general construction.',
                    'specs' => ['material' => 'steel', 'types' => 'assorted', 'weight' => '1kg'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Measuring Tape 5m',
                    'description' => 'Compact 5-meter measuring tape with lock feature for home and site use.',
                    'specs' => ['length' => '5m', 'feature' => 'lock function', 'material' => 'metal'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Latex Wall Paint White',
                    'description' => 'Interior latex paint with smooth finish and reliable wall coverage.',
                    'specs' => ['color' => 'white', 'type' => 'latex', 'volume' => '4L'],
                    'status' => 'active',
                ],
                [
                    'name' => 'PVC Electrical Tape',
                    'description' => 'Insulating tape for cable management, minor repairs, and electrical projects.',
                    'specs' => ['material' => 'PVC', 'type' => 'electrical', 'width' => 'standard'],
                    'status' => 'out_of_stock',
                ],
            ],
            "Gemma's Bakeshop" => [
                [
                    'name' => 'Classic Pandesal Pack',
                    'description' => 'Freshly baked soft pandesal, perfect for breakfast and merienda.',
                    'specs' => ['pieces' => '10', 'texture' => 'soft', 'freshness' => 'baked daily'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Cheese Ensaymada Box',
                    'description' => 'Soft ensaymada topped with butter, sugar, and grated cheese.',
                    'specs' => ['pieces' => '6', 'topping' => 'cheese', 'style' => 'butter sugar'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Loaf Bread',
                    'description' => 'Daily baked loaf bread for sandwiches, toast, and family breakfasts.',
                    'specs' => ['weight' => '600g', 'type' => 'white loaf', 'freshness' => 'daily bake'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Chocolate Cake Slice',
                    'description' => 'Rich chocolate cake slice for dessert counters and cafe-style servings.',
                    'specs' => ['flavor' => 'chocolate', 'type' => 'slice', 'size' => 'single serving'],
                    'status' => 'draft',
                ],
            ],
            'TechZone PH' => [
                [
                    'name' => 'Fast Charging USB-C Cable',
                    'description' => 'Durable USB-C cable with fast charging support for modern smartphones.',
                    'specs' => ['connector' => 'USB-C', 'length' => '1m', 'speed' => 'fast charge'],
                    'status' => 'active',
                ],
                [
                    'name' => '20W Wall Charger',
                    'description' => 'Compact wall charger designed for efficient charging at home or travel.',
                    'specs' => ['wattage' => '20W', 'type' => 'wall charger', 'ports' => 'USB-C'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Wireless Earbuds',
                    'description' => 'Portable wireless earbuds with charging case for music and calls.',
                    'specs' => ['connectivity' => 'wireless', 'case' => 'charging', 'battery' => '8 hours'],
                    'status' => 'active',
                ],
                [
                    'name' => '10000mAh Power Bank',
                    'description' => 'Slim emergency power bank for on-the-go charging during long days out.',
                    'specs' => ['capacity' => '10000mAh', 'type' => 'slim', 'ports' => 'USB-C + USB-A'],
                    'status' => 'out_of_stock',
                ],
            ],
            "Arlene's Beauty Hub" => [
                [
                    'name' => 'Hydrating Facial Wash',
                    'description' => 'Gentle facial cleanser for daily use with a refreshing, non-drying finish.',
                    'specs' => ['volume' => '100ml', 'type' => 'facial wash', 'benefit' => 'hydrating'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Color Protective Hair Conditioner',
                    'description' => 'Rich conditioner formula to maintain color vibrancy and hair smoothness.',
                    'specs' => ['volume' => '250ml', 'for' => 'color-treated hair', 'type' => 'conditioner'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Volumizing Hair Shampoo',
                    'description' => 'Lightweight shampoo formula to boost volume and add body to fine hair.',
                    'specs' => ['volume' => '400ml', 'benefit' => 'volumizing', 'for' => 'fine hair'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Brightening Body Lotion',
                    'description' => 'Moisturizing body lotion formulated for smooth and nourished skin.',
                    'specs' => ['volume' => '250ml', 'type' => 'body lotion', 'benefit' => 'brightening'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Keratin Repair Shampoo',
                    'description' => 'Salon-inspired shampoo that helps smooth and strengthen dry hair.',
                    'specs' => ['volume' => '400ml', 'benefit' => 'repair', 'for' => 'dry hair'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Tinted Lip Balm',
                    'description' => 'Pocket-friendly lip balm with soft tint and moisturizing formula.',
                    'specs' => ['weight' => '4g', 'type' => 'lip balm', 'feature' => 'tinted moisturizing'],
                    'status' => 'draft',
                ],
            ],
            "Kuya Ed's Carinderia" => [
                [
                    'name' => 'Chicken Adobo Meal Pack',
                    'description' => 'Ready-to-serve chicken adobo meal with rice, good for one person.',
                    'specs' => ['servings' => '1', 'includes' => 'rice', 'freshness' => 'hot & fresh'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Pork Menudo Tray',
                    'description' => 'Hearty pork menudo packed in a tray for lunch orders and takeout.',
                    'specs' => ['servings' => '2', 'type' => 'pork menudo', 'freshness' => 'cooked daily'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Lumpiang Shanghai Pack',
                    'description' => 'Crispy lumpiang shanghai rolls bundled for parties and family meals.',
                    'specs' => ['pieces' => '12', 'type' => 'spring rolls', 'style' => 'shanghai'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Pancit Canton Bilao Mini',
                    'description' => 'Small bilao of pancit canton for office snacks and simple gatherings.',
                    'specs' => ['size' => 'mini bilao', 'type' => 'pancit canton', 'servings' => '8-10'],
                    'status' => 'out_of_stock',
                ],
            ],
            'FreshPick Fruits' => [
                [
                    'name' => 'Sweet Mangoes',
                    'description' => 'Ripe sweet mangoes selected daily from trusted farm suppliers.',
                    'specs' => ['weight' => '1kg', 'ripeness' => 'ripe', 'type' => 'sweet'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Lakatan Bananas',
                    'description' => 'Naturally sweet lakatan bananas ideal for snacks and smoothies.',
                    'specs' => ['weight' => '1kg', 'variety' => 'lakatan', 'sweetness' => 'naturally sweet'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Red Tomatoes',
                    'description' => 'Fresh red tomatoes for salads, stews, and everyday cooking.',
                    'specs' => ['weight' => '1kg', 'color' => 'red', 'use' => 'cooking & salads'],
                    'status' => 'active',
                ],
                [
                    'name' => 'White Onions',
                    'description' => 'Kitchen staple white onions with firm bulbs and strong flavor.',
                    'specs' => ['weight' => '1kg', 'color' => 'white', 'firmness' => 'firm bulbs'],
                    'status' => 'out_of_stock',
                ],
            ],
            "Kuya Ed's Carinderia" => [
                [
                    'name' => 'Chicken Adobo Meal Pack',
                    'description' => 'Ready-to-serve chicken adobo meal with rice, good for one person.',
                    'specs' => ['servings' => '1', 'includes' => 'rice', 'freshness' => 'hot & fresh'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Pork Menudo Tray',
                    'description' => 'Hearty pork menudo packed in a tray for lunch orders and takeout.',
                    'specs' => ['servings' => '2', 'type' => 'pork menudo', 'freshness' => 'cooked daily'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Lumpiang Shanghai Pack',
                    'description' => 'Crispy lumpiang shanghai rolls bundled for parties and family meals.',
                    'specs' => ['pieces' => '12', 'type' => 'spring rolls', 'style' => 'shanghai'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Pancit Canton Bilao Mini',
                    'description' => 'Small bilao of pancit canton for office snacks and simple gatherings.',
                    'specs' => ['size' => 'mini bilao', 'type' => 'pancit canton', 'servings' => '8-10'],
                    'status' => 'out_of_stock',
                ],
            ],
            'FreshPick Fruits' => [
                [
                    'name' => 'Sweet Mangoes',
                    'description' => 'Ripe sweet mangoes selected daily from trusted farm suppliers.',
                    'specs' => ['weight' => '1kg', 'ripeness' => 'ripe', 'type' => 'sweet'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Lakatan Bananas',
                    'description' => 'Naturally sweet lakatan bananas ideal for snacks and smoothies.',
                    'specs' => ['weight' => '1kg', 'variety' => 'lakatan', 'sweetness' => 'naturally sweet'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Red Tomatoes',
                    'description' => 'Fresh red tomatoes for salads, stews, and everyday cooking.',
                    'specs' => ['weight' => '1kg', 'color' => 'red', 'use' => 'cooking & salads'],
                    'status' => 'active',
                ],
                [
                    'name' => 'White Onions',
                    'description' => 'Kitchen staple white onions with firm bulbs and strong flavor.',
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
                        'specs' => $productData['specs'],
                        'status' => $productData['status'],
                        // price and stock removed - they're now on product_variants
                    ]
                );
            }
        }
    }
}
