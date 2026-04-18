<?php

namespace App\Http\Requests\Seller;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string',
            'category_id' => 'sometimes|required|exists:categories,id',
            'price' => 'sometimes|required|numeric|min:0',
            'stock' => 'sometimes|required|integer|min:0',
            'specs' => 'nullable|array',
            'status' => 'sometimes|required|in:active,draft,out_of_stock',
            'images' => 'sometimes|array|min:1|max:5',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif,webp|max:4096',
            'deleted_image_ids' => 'nullable|array',
            'deleted_image_ids.*' => 'integer',
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
