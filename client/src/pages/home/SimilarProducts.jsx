import React from "react";
import { Spin } from "antd";
import { useNavigate } from "react-router-dom";
import ProductCard from "../../components/home/ProductCard";

export default function SimilarProducts({
    similarProducts = [],
    similarLoading = false,
    searchKeyword,
    onAddToCart,
}) {
    const navigate = useNavigate();

    const handleProductClick = (productUuid) => {
        navigate(`/products/${productUuid}`, { state: { searchKeyword } });
    };

    const buildCardProduct = (product) => ({
        ...product,
        rating: Number(product.rating ?? 0),
        sold: product.sold || 0,
        category: product.category?.name || "Unknown",
    });

    return (
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Similar Products</h2>

            {similarLoading ? (
                <div className="flex justify-center py-12">
                    <Spin />
                </div>
            ) : similarProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {similarProducts.map((product) => (
                        <ProductCard
                            key={product.uuid}
                            product={buildCardProduct(product)}
                            onClick={() => handleProductClick(product.uuid)}
                            onAdd={() => onAddToCart(product)}
                        />
                    ))}
                </div>
            ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
                    <p className="text-base font-semibold text-gray-700">No similar products found</p>
                    <p className="mt-2 text-sm text-gray-500">
                        Try browsing more items in this category.
                    </p>
                </div>
            )}
        </div>
    );
}
