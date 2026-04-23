<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'location_id' => 'required|integer|exists:locations,id',
            'address_extra' => 'nullable|string|max:500',
            'message' => 'nullable|string|max:1000',
            'items' => 'required|array|min:1',
            'items.*.cart_id' => 'nullable|integer|exists:carts,id',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.product_variant_id' => 'nullable|integer|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
        ];
    }

    public function messages()
    {
        return [
            'location_id.required' => 'Delivery location is required.',
            'location_id.exists' => 'The selected location does not exist.',
            'items.required' => 'Order must contain at least one item.',
            'items.*.product_id.required' => 'Product ID is required for each item.',
            'items.*.product_id.exists' => 'One or more selected products do not exist.',
            'items.*.quantity.required' => 'Quantity is required for each item.',
            'items.*.quantity.min' => 'Quantity must be at least 1.',
        ];
    }
}
