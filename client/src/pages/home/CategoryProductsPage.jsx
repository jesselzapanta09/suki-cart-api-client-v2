import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { App, Spin, Pagination } from "antd";
import { Package, ShoppingBasket } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import ProductCard from "../../components/home/ProductCard";
import ProductFiltersCard from "../../components/home/ProductFiltersCard";
import { getHomeCategories } from "../../services/categoryService";
import { searchPublicProducts } from "../../services/productService";

export default function CategoryProductsPage() {
    const { categoryId } = useParams();
    const navigate = useNavigate();
    const { message } = App.useApp();
    const { isCustomer } = useAuth();

    const numericCategoryId = useMemo(() => Number(categoryId), [categoryId]);

    const [categories, setCategories] = useState(null);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [sortBy, setSortBy] = useState("created_at");
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 12,
        total: 0,
    });
    const { current: currentPage, pageSize } = pagination;

    useEffect(() => {
        let active = true;

        getHomeCategories()
            .then((data) => {
                if (active) {
                    setCategories(Array.isArray(data) ? data : []);
                }
            })
            .catch(() => {
                if (active) {
                    setCategories([]);
                }
            });

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        setPagination((prev) => ({
            ...prev,
            current: 1,
        }));
    }, [categoryId]);

    useEffect(() => {
        if (!Number.isInteger(numericCategoryId) || numericCategoryId <= 0) {
            navigate("/", { replace: true });
            return;
        }

        const fetchResults = async () => {
            try {
                setLoading(true);
                const response = await searchPublicProducts({
                    category_id: numericCategoryId,
                    page: currentPage,
                    per_page: pageSize,
                    ...(minPrice && { min_price: minPrice }),
                    ...(maxPrice && { max_price: maxPrice }),
                    sort_field: sortBy === "price_asc" || sortBy === "price_desc" ? "price" : "created_at",
                    sort_order: sortBy === "price_asc" ? "ascend" : "desc",
                });

                setResults(response.data || []);
                setPagination((prev) => ({
                    ...prev,
                    total: response.total || 0,
                }));
            } catch {
                message.error("Failed to load category products");
                setResults([]);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [numericCategoryId, currentPage, pageSize, minPrice, maxPrice, sortBy, navigate, message]);

    const category = Array.isArray(categories)
        ? categories.find((item) => item.id === numericCategoryId)
        : null;

    const categoryName = category?.name || "Category";

    const handleAddToCart = (product) => {
        if (!isCustomer) {
            message.warning("Only customers can add items to cart. Please log in as a customer.");
            navigate("/login");
            return;
        }

        navigate(`/products/${product.uuid}`, {
            state: { searchKeyword: categoryName },
        });
    };

    const handlePaginationChange = (page) => {
        setPagination((prev) => ({ ...prev, current: page }));
        window.scrollTo(0, 0);
    };

    const handleSortChange = (value) => {
        setSortBy(value);
        setPagination((prev) => ({ ...prev, current: 1 }));
    };

    const handleMinPriceChange = (value) => {
        setMinPrice(value);
        setPagination((prev) => ({ ...prev, current: 1 }));
    };

    const handleMaxPriceChange = (value) => {
        setMaxPrice(value);
        setPagination((prev) => ({ ...prev, current: 1 }));
    };

    const handleClearFilters = () => {
        setMinPrice("");
        setMaxPrice("");
        setSortBy("created_at");
        setPagination((prev) => ({ ...prev, current: 1 }));
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-7xl p-5 lg:p-6">
                <div className="flex items-center rounded-lg bg-white px-5 py-4 shadow-sm ring-1 ring-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-green-600 to-emerald-500 shadow-sm">
                            <ShoppingBasket size={18} className="text-white" />
                        </div>
                        <div>
                            <h1 className="font-sora text-base font-bold text-green-700">{categoryName}</h1>
                            <p className="mt-0.5 text-xs text-gray-500">
                                Found {pagination.total} product{pagination.total !== 1 ? "s" : ""} in this category
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-8">
                <div className="flex gap-6">
                    <ProductFiltersCard
                        sortBy={sortBy}
                        minPrice={minPrice}
                        maxPrice={maxPrice}
                        onSortChange={handleSortChange}
                        onMinPriceChange={handleMinPriceChange}
                        onMaxPriceChange={handleMaxPriceChange}
                        onClear={handleClearFilters}
                    />

                    <div className="flex-1">
                        {loading || categories === null ? (
                            <div className="flex items-center justify-center py-16">
                                <Spin size="large" />
                            </div>
                        ) : results.length > 0 ? (
                            <>
                                <ProductFiltersCard
                                    sortBy={sortBy}
                                    minPrice={minPrice}
                                    maxPrice={maxPrice}
                                    onSortChange={handleSortChange}
                                    onMinPriceChange={handleMinPriceChange}
                                    onMaxPriceChange={handleMaxPriceChange}
                                    onClear={handleClearFilters}
                                    mobile
                                />

                                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {results.map((product) => (
                                        <ProductCard
                                            key={product.uuid}
                                            product={{
                                                ...product,
                                                rating: Number(product.rating ?? 0),
                                                sold: product.sold || 0,
                                                category: product.category?.name || "Unknown",
                                            }}
                                            onAdd={handleAddToCart}
                                        />
                                    ))}
                                </div>

                                {pagination.total > pagination.pageSize && (
                                    <div className="flex justify-center py-8">
                                        <Pagination
                                            current={pagination.current}
                                            pageSize={pagination.pageSize}
                                            total={pagination.total}
                                            onChange={handlePaginationChange}
                                            showSizeChanger={false}
                                            showQuickJumper={false}
                                        />
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center rounded-lg bg-white py-16">
                                <Package size={64} className="mb-4 text-gray-300" />
                                <h2 className="mb-2 text-2xl font-bold text-gray-800">No Products Found</h2>
                                <p className="mb-6 max-w-md text-center text-gray-600">
                                    There are no available products in <span className="font-semibold">{categoryName}</span> yet.
                                </p>
                                <button
                                    onClick={() => navigate("/")}
                                    className="rounded-lg bg-green-600 px-6 py-2 text-white transition-colors hover:bg-green-700"
                                >
                                    Back to Home
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
