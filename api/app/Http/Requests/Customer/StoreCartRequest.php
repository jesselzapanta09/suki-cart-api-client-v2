<?php

namespace App\Http\Requests\Customer;

use App\Models\Product;
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
            'quantity' => 'required|integer|min:1',
        ];
    }

    protected function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $productId = $this->input('product_id');
            $quantity = $this->input('quantity');

            // Check product exists and is active
            $product = Product::find($productId);
            if (!$product) {
                $validator->errors()->add('product_id', 'Product not found.');
                return;
            }

            if ($product->status !== 'active') {
                $validator->errors()->add('product_id', 'This product is not available for purchase.');
            }

            // Check stock availability
            if ($product->stock < $quantity) {
                $validator->errors()->add('quantity', "Not enough stock. Only {$product->stock} available.");
            }
        });
    }
}
