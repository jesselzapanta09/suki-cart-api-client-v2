<?php

namespace App\Http\Requests\Customer;

use App\Models\Cart;
use Illuminate\Foundation\Http\FormRequest;

class UpdateCartRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'quantity' => 'required|integer|min:1',
        ];
    }

    protected function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $cartId = $this->route('id');
            $quantity = $this->input('quantity');

            // Get cart item and product
            $cartItem = Cart::find($cartId);
            if (!$cartItem) {
                $validator->errors()->add('id', 'Cart item not found.');
                return;
            }

            $product = $cartItem->product;
            if (!$product) {
                $validator->errors()->add('product', 'Product not found.');
                return;
            }

            // Check stock availability
            if ($product->stock < $quantity) {
                $validator->errors()->add('quantity', "Not enough stock. Only {$product->stock} available.");
            }
        });
    }
}
