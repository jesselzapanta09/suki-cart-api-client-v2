<?php

namespace App\Http\Requests\Seller;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'category_id' => 'required|exists:categories,id',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'sku' => 'nullable|string|max:100',
            'condition' => 'nullable|string|max:50',
            'brand' => 'nullable|string|max:100',
            'weight' => 'nullable|string|max:50',
            'dimensions' => 'nullable|string|max:100',
            'status' => 'required|in:active,draft,out_of_stock',
            'images' => 'required|array|min:1|max:5',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif,webp|max:4096',
        ];
    }

    protected function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $stock = $this->input('stock');
            $status = $this->input('status');
            
            if ($stock == 0 && $status !== 'out_of_stock') {
                $validator->errors()->add('status', 'Status must be "Out of Stock" when stock is 0.');
            }
            
            if ($stock > 0 && $status === 'out_of_stock') {
                $validator->errors()->add('status', 'Status cannot be "Out of Stock" when stock is greater than 0.');
            }
        });
    }
}
