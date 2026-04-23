<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('location_id')->constrained()->cascadeOnDelete();
            $table->decimal('price', 12, 2)->default(0); // Product price at time of order
            $table->decimal('shipping_cost', 12, 2)->default(0); // Reference for future use
            $table->decimal('total_price', 12, 2)->default(0); // price + shipping_cost
            $table->enum('status', ['pending', 'processing', 'shipped', 'delivered', 'cancelled'])->default('pending');
            $table->string('address_extra')->nullable(); // Street/landmark/house number
            $table->text('message')->nullable(); // Customer message
            $table->enum('cancelled_by', ['admin', 'seller', 'customer'])->nullable(); // Who cancelled
            $table->text('cancellation_reason')->nullable(); // Why cancelled
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
