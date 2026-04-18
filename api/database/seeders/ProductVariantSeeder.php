<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Seeder;

class ProductVariantSeeder extends Seeder
{
    public function run(): void
    {
        // Get products by name
        $products = Product::query()->get()->keyBy('name');

        $variants = [
            'Fast Charging USB-C Cable' => [
                ['name' => '1m White', 'price' => 199.00, 'stock' => 15],
                ['name' => '2m White', 'price' => 249.00, 'stock' => 12],
                ['name' => '1m Black', 'price' => 199.00, 'stock' => 18],
                ['name' => '2m Black', 'price' => 249.00, 'stock' => 10],
            ],
            '20W Wall Charger' => [
                ['name' => 'White', 'price' => 349.00, 'stock' => 10],
                ['name' => 'Black', 'price' => 349.00, 'stock' => 8],
                ['name' => 'Blue', 'price' => 349.00, 'stock' => 5],
            ],
            'Wireless Earbuds' => [
                ['name' => 'Black Standard', 'price' => 899.00, 'stock' => 5],
                ['name' => 'White Standard', 'price' => 899.00, 'stock' => 4],
            ],
            'Hydrating Facial Wash' => [
                ['name' => '100ml', 'price' => 245.00, 'stock' => 12],
                ['name' => '200ml Refill', 'price' => 420.00, 'stock' => 8],
            ],
            'Volumizing Hair Shampoo' => [
                ['name' => '400ml', 'price' => 305.00, 'stock' => 10],
                ['name' => '1L Family Pack', 'price' => 650.00, 'stock' => 6],
            ],
            'Color Protective Hair Conditioner' => [
                ['name' => '250ml', 'price' => 320.00, 'stock' => 10],
                ['name' => '500ml Refill', 'price' => 580.00, 'stock' => 6],
            ],
            'Instant Noodles Family Pack' => [
                ['name' => 'Chicken', 'price' => 89.00, 'stock' => 20],
                ['name' => 'Shrimp', 'price' => 92.00, 'stock' => 15],
                ['name' => 'Beef', 'price' => 92.00, 'stock' => 12],
            ],
            'Brown Eggs Tray' => [
                ['name' => 'Large (30pc)', 'price' => 245.00, 'stock' => 15],
                ['name' => 'Medium (30pc)', 'price' => 220.00, 'stock' => 18],
            ],
            'Brightening Body Lotion' => [
                ['name' => '250ml', 'price' => 189.00, 'stock' => 10],
                ['name' => '500ml Refill', 'price' => 340.00, 'stock' => 7],
            ],
        ];

        foreach ($variants as $productName => $variantList) {
            $product = $products->get($productName);

            if (!$product) {
                $this->command?->warn("Skipping variants for missing product: {$productName}");
                continue;
            }

            foreach ($variantList as $variantData) {
                ProductVariant::updateOrCreate(
                    [
                        'product_id' => $product->id,
                        'name' => $variantData['name'],
                    ],
                    [
                        'product_id' => $product->id,
                        'name' => $variantData['name'],
                        'price' => $variantData['price'],
                        'stock' => $variantData['stock'],
                    ]
                );
            }
        }

        // Create default variants for products without explicit variants
        $productsWithVariants = array_keys($variants);
        $allProducts = $products->filter(fn ($product) => !in_array($product->name, $productsWithVariants));

        foreach ($allProducts as $product) {
            // Create a "Default" variant with default values
            ProductVariant::updateOrCreate(
                [
                    'product_id' => $product->id,
                    'name' => 'Default',
                ],
                [
                    'product_id' => $product->id,
                    'name' => 'Default',
                    'price' => 0,
                    'stock' => 0,
                ]
            );
        }
    }
}
