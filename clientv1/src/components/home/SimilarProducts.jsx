import React from "react";
import { Spin } from "antd";
import { useNavigate } from "react-router-dom";
import ProductCard from "./ProductCard";

export default function SimilarProducts({ 
    similarProducts = [], 
    similarLoading = false, 
    currentProductId,
    searchKeyword,
    onAddToCart 
}) {
    const navigate = useNavigate();

    return (
        <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Similar Products</h2>
            {similarLoading ? (
                <div className="flex justify-center py-12">
                    <Spin />
                </div>
            ) : similarProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {similarProducts.map(p => (
                        <div
                            key={p.id}
                            onClick={() => navigate(`/products/${p.id}`, { state: { searchKeyword } })}
                            className="cursor-pointer"
                        >
                            <ProductCard
                                product={{
                                    ...p,
                                    rating: p.rating || 4.5,
                                    sold: p.sold || 0,
                                    category: p.category?.name || "Unknown",
                                }}
                                onAdd={() => onAddToCart(p)}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-500 text-center py-12">No similar products found</p>
            )}
        </div>
    );
}
