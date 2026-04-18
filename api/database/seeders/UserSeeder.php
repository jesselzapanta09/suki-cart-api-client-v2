<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Location;
use App\Models\Store;
use App\Models\Category;
use App\Models\StoreVerification;
use App\Models\StoreVerificationLog;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $reviewedAt = Carbon::now();
        // ── Admins (2) ──────────────────────────────────────
        foreach ([
            ['firstname' => 'Admin',   'lastname' => 'SukiCart',  'contact_number' => '09170000001', 'email' => 'admin@sukicart.ph'],
            ['firstname' => 'Rosa',    'lastname' => 'Reyes',     'contact_number' => '09170000002', 'email' => 'rosa.admin@sukicart.ph'],
        ] as $admin) {
            $this->upsertUser(array_merge($admin, [
                'role' => 'admin',
            ]));
        }

        $reviewer = User::where('email', 'admin@sukicart.ph')->first();

        // ── Customers (10) ──────────────────────────────────
        $customers = [
            ['firstname' => 'Juan',    'lastname' => 'Dela Cruz',   'contact_number' => '09170000003', 'email' => 'juan@example.com',    'region' => 'NCR',          'province' => 'Metro Manila',   'city' => 'Quezon City',   'barangay' => 'Barangay Holy Spirit'],
            ['firstname' => 'Maria',   'lastname' => 'Garcia',      'contact_number' => '09170000004', 'email' => 'maria@example.com',   'region' => 'NCR',          'province' => 'Metro Manila',   'city' => 'Makati',        'barangay' => 'Barangay Poblacion'],
            ['firstname' => 'Jose',    'lastname' => 'Reyes',       'contact_number' => '09170000005', 'email' => 'jose@example.com',    'region' => 'Region IV-A',  'province' => 'Cavite',         'city' => 'Bacoor',        'barangay' => 'Barangay Molino'],
            ['firstname' => 'Ana',     'lastname' => 'Bautista',    'contact_number' => '09170000006', 'email' => 'ana@example.com',     'region' => 'Region III',   'province' => 'Bulacan',        'city' => 'Meycauayan',    'barangay' => 'Barangay Calvario'],
            ['firstname' => 'Ramon',   'lastname' => 'Mendoza',     'contact_number' => '09170000007', 'email' => 'ramon@example.com',   'region' => 'NCR',          'province' => 'Metro Manila',   'city' => 'Pasig',         'barangay' => 'Barangay Kapitolyo'],
            ['firstname' => 'Liza',    'lastname' => 'Tan',         'contact_number' => '09170000008', 'email' => 'liza@example.com',    'region' => 'Region IV-A',  'province' => 'Laguna',         'city' => 'San Pedro',     'barangay' => 'Barangay Landayan'],
            ['firstname' => 'Carlos',  'lastname' => 'Villanueva',  'contact_number' => '09170000009', 'email' => 'carlos@example.com',  'region' => 'NCR',          'province' => 'Metro Manila',   'city' => 'Manila',        'barangay' => 'Barangay Sampaloc'],
            ['firstname' => 'Diane',   'lastname' => 'Aquino',      'contact_number' => '09170000010', 'email' => 'diane@example.com',   'region' => 'Region III',   'province' => 'Pampanga',       'city' => 'San Fernando',  'barangay' => 'Barangay Dolores'],
            ['firstname' => 'Mark',    'lastname' => 'Gonzales',    'contact_number' => '09170000011', 'email' => 'mark@example.com',    'region' => 'NCR',          'province' => 'Metro Manila',   'city' => 'Taguig',        'barangay' => 'Barangay Ususan'],
            ['firstname' => 'Elena',   'lastname' => 'Ramos',       'contact_number' => '09170000012', 'email' => 'elena@example.com',   'region' => 'Region IV-A',  'province' => 'Rizal',          'city' => 'Antipolo',      'barangay' => 'Barangay Dela Paz'],
        ];

        foreach ($customers as $c) {
            $user = $this->upsertUser([
                'firstname'      => $c['firstname'],
                'lastname'       => $c['lastname'],
                'contact_number' => $c['contact_number'],
                'role'           => 'customer',
                'email'          => $c['email'],
            ]);

            $this->upsertLocation($user->id, 'customer', [
                'status'            => 1,
                'region'            => $c['region'],
                'province'          => $c['province'],
                'city_municipality' => $c['city'],
                'barangay'          => $c['barangay'],
            ]);
        }

        // ── Sellers (8) ─────────────────────────────────────
        $sellers = [
            ['firstname' => 'Pedro',   'lastname' => 'Santos',     'contact_number' => '09170000013', 'email' => 'pedro@example.com',    'store_name' => 'Pedro\'s Palengke',       'category' => 'Butcher / Palengke',             'description' => 'Fresh produce and groceries from the neighborhood.',    'region' => 'NCR',          'province' => 'Metro Manila',   'city' => 'Manila',        'barangay' => 'Barangay Ermita'],
            ['firstname' => 'Lorna',   'lastname' => 'Cruz',       'contact_number' => '09170000014', 'email' => 'lorna@example.com',    'store_name' => 'Lorna\'s Sari-Sari',     'category' => 'Convenience Store / Sari-Sari',  'description' => 'Your neighborhood sari-sari store with everyday needs.', 'region' => 'NCR',          'province' => 'Metro Manila',   'city' => 'Quezon City',   'barangay' => 'Barangay Tandang Sora'],
            ['firstname' => 'Ricardo', 'lastname' => 'Dimaculangan','contact_number' => '09170000015', 'email' => 'ricardo@example.com',  'store_name' => 'Rick\'s Hardware',        'category' => 'Hardware',                       'description' => 'Construction supplies, tools, and building materials.',  'region' => 'Region IV-A',  'province' => 'Cavite',         'city' => 'Imus',          'barangay' => 'Barangay Poblacion'],
            ['firstname' => 'Gemma',   'lastname' => 'Navarro',    'contact_number' => '09170000016', 'email' => 'gemma@example.com',    'store_name' => 'Gemma\'s Bakeshop',      'category' => 'Bakery / Panaderya',             'description' => 'Freshly baked pandesal, cakes, and pastries daily.',     'region' => 'NCR',          'province' => 'Metro Manila',   'city' => 'Makati',        'barangay' => 'Barangay San Antonio'],
            ['firstname' => 'Dennis',  'lastname' => 'Reyes',      'contact_number' => '09170000017', 'email' => 'dennis@example.com',   'store_name' => 'TechZone PH',             'category' => 'Electronics & Gadgets',          'description' => 'Gadgets, accessories, and phone repair services.',       'region' => 'NCR',          'province' => 'Metro Manila',   'city' => 'Pasig',         'barangay' => 'Barangay Rosario'],
            ['firstname' => 'Arlene',  'lastname' => 'Manalo',     'contact_number' => '09170000018', 'email' => 'arlene@example.com',   'store_name' => 'Arlene\'s Beauty Hub',   'category' => 'Beauty & Wellness',              'description' => 'Skincare, cosmetics, and wellness products.',            'region' => 'Region III',   'province' => 'Bulacan',        'city' => 'Malolos',       'barangay' => 'Barangay Mojon'],
            ['firstname' => 'Edwin',   'lastname' => 'Tolentino',  'contact_number' => '09170000019', 'email' => 'edwin@example.com',    'store_name' => 'Kuya Ed\'s Carinderia',  'category' => 'Restaurant / Carinderia',        'description' => 'Home-cooked Filipino meals at affordable prices.',       'region' => 'NCR',          'province' => 'Metro Manila',   'city' => 'Taguig',        'barangay' => 'Barangay Western Bicutan'],
            ['firstname' => 'Cherry',  'lastname' => 'Pascual',    'contact_number' => '09170000020', 'email' => 'cherry@example.com',   'store_name' => 'FreshPick Fruits',        'category' => 'Fruits & Vegetables',            'description' => 'Farm-fresh fruits and vegetables delivered daily.',      'region' => 'Region IV-A',  'province' => 'Laguna',         'city' => 'Santa Rosa',    'barangay' => 'Barangay Balibago'],
        ];

        foreach ($sellers as $s) {
            $user = $this->upsertUser([
                'firstname'      => $s['firstname'],
                'lastname'       => $s['lastname'],
                'contact_number' => $s['contact_number'],
                'role'           => 'seller',
                'email'          => $s['email'],
            ]);

            $category = Category::where('name', $s['category'])->first();

            $store = $this->upsertStore($user->id, [
                'store_name'  => $s['store_name'],
                'category_id' => $category->id,
                'description' => $s['description'],
            ], $reviewedAt, $s['email']);

            $this->upsertLocation($user->id, 'store', [
                'status'            => 1,
                'region'            => $s['region'],
                'province'          => $s['province'],
                'city_municipality' => $s['city'],
                'barangay'          => $s['barangay'],
            ]);

            $this->upsertStoreApproval($store, $reviewer?->uuid, $reviewedAt, $s['email']);
        }
    }

    protected function upsertUser(array $attributes): User
    {
        $user = User::firstOrNew(['email' => $attributes['email']]);
        $user->fill([
            'uuid'              => $user->uuid ?: Str::uuid(),
            'firstname'         => $attributes['firstname'],
            'lastname'          => $attributes['lastname'],
            'contact_number'    => $attributes['contact_number'],
            'role'              => $attributes['role'],
            'email'             => $attributes['email'],
            'email_verified_at' => Carbon::now(),
            'password'          => bcrypt('password'),
        ]);
        $user->save();

        return $user;
    }

    protected function upsertLocation(int $userId, string $type, array $attributes): void
    {
        Location::updateOrCreate(
            [
                'user_id' => $userId,
                'type' => $type,
            ],
            $attributes
        );
    }

    protected function upsertStore(int $userId, array $attributes, Carbon $verifiedAt, string $email = ''): Store
    {
        $store = Store::firstOrNew(['user_id' => $userId]);
        $store->fill([
            'uuid' => $store->uuid ?: Str::uuid(),
            'store_name' => $attributes['store_name'],
            'category_id' => $attributes['category_id'],
            'description' => $attributes['description'],
            'verified_at' => $email === 'pedro@example.com' ? $verifiedAt : null,
        ]);
        $store->save();

        return $store;
    }

    protected function upsertStoreApproval(Store $store, ?string $reviewedBy, Carbon $reviewedAt, string $email = ''): void
    {
        $isPedro = $email === 'pedro@example.com';
        
        StoreVerification::updateOrCreate(
            [
                'store_id' => $store->id,
            ],
            [
                'store_status' => $isPedro ? 'approved' : 'pending',
                'rejection_reason' => null,
                'reviewed_by' => $isPedro ? $reviewedBy : null,
                'reviewed_at' => $isPedro ? $reviewedAt : null,
            ]
        );
    }
}
