<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Convenience Store / Sari-Sari', 'description' => 'Neighborhood convenience stores and sari-sari shops', 'status' => 1],
            ['name' => 'Grocery',                        'description' => 'Grocery stores and supermarkets', 'status' => 1],
            ['name' => 'Bakery / Panaderya',             'description' => 'Bakeries and bread shops', 'status' => 1],
            ['name' => 'Butcher / Palengke',             'description' => 'Meat shops and wet market vendors', 'status' => 1],
            ['name' => 'Pharmacy / Botika',              'description' => 'Pharmacies and drugstores', 'status' => 1],
            ['name' => 'Restaurant / Carinderia',        'description' => 'Restaurants, carinderias, and food stalls', 'status' => 1],
            ['name' => 'Clothing & Apparel',             'description' => 'Clothing, accessories, and fashion stores', 'status' => 1],
            ['name' => 'Electronics & Gadgets',          'description' => 'Electronics, gadgets, and accessories shops', 'status' => 1],
            ['name' => 'Hardware',                       'description' => 'Hardware and construction supply stores', 'status' => 1],
            ['name' => 'Beauty & Wellness',              'description' => 'Beauty products, cosmetics, and wellness shops', 'status' => 1],
            ['name' => 'Fruits & Vegetables',            'description' => 'Fresh fruits and vegetable vendors', 'status' => 1],
            ['name' => 'Pet Supplies',                   'description' => 'Pet food, accessories, and care products', 'status' => 1],
            ['name' => 'School & Office Supplies',       'description' => 'Stationery, school, and office supply stores', 'status' => 1],
            ['name' => 'Auto Parts & Accessories',       'description' => 'Automotive parts, accessories, and repair shops', 'status' => 1],
            ['name' => 'Other',                          'description' => 'Other types of stores', 'status' => 1],
        ];

        foreach ($categories as $category) {
            Category::firstOrCreate(
                ['name' => $category['name']],
                $category,
            );
        }
    }
}
