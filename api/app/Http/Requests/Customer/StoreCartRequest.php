<?php

namespace App\Http\Requests\Customer;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Foundation\Http\FormRequest;

class StoreCartRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'product_id' => 'required|integer|exists:products,id',
            'product_variant_id' => 'nullable|integer|exists:product_variants,id',
            'quantity' => 'required|integer|min:1',
        ];
    }

    protected function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $productId = $this->input('product_id');
            $variantId = $this->input('product_variant_id');
            $quantity = $this->input('quantity');

            // Check product exists and is active
            $product = Product::find($productId);
            if (!$product) {
                $validator->errors()->add('product_id', 'Product not found.');
                return;
            }

            if ($product->status !== 'active') {
                $validator->errors()->add('product_id', 'This product is not available for purchase.');
                return;
            }

            // If variant is specified, check variant exists and has stock
            if ($variantId) {
                $variant = ProductVariant::find($variantId);
                if (!$variant || $variant->product_id !== $productId) {
                    $validator->errors()->add('product_variant_id', 'Invalid product variant.');
                    return;
                }

                if ($variant->stock < $quantity) {
                    $validator->errors()->add('quantity', "Not enough stock for this variant. Only {$variant->stock} available.");
                }
            } else {
                // If no variant specified, check if product has variants with stock
                $product->load('variants');
                if (!$product->variants || $product->variants->count() === 0) {
                    $validator->errors()->add('product_id', 'This product has no available variants.');
                    return;
                }
                
                // Check if any variant has enough stock
                $totalStock = $product->variants->sum('stock');
                if ($totalStock < $quantity) {
                    $validator->errors()->add('quantity', "Not enough stock available. Only {$totalStock} total available across variants.");
                }
            }
        });
    }
}
