import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { App, Spin, Pagination, Radio, InputNumber, Button, Divider } from "antd";
import { ArrowLeft, Package, Search } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import ProductCard from "../../components/home/ProductCard";
import { searchPublicProducts } from "../../services/productService";

export default function SearchResultsPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { message } = App.useApp();
    const { addItem } = useCart();
    const { isCustomer } = useAuth();

    const query = searchParams.get("q") || "";
    const initialPage = parseInt(searchParams.get("page") || "1", 10);

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [sortBy, setSortBy] = useState("created_at");
    const [pagination, setPagination] = useState({
        current: initialPage,
        pageSize: 12,
        total: 0,
    });

    // Fetch search results
    useEffect(() => {
        if (!query.trim()) {
            navigate("/");
            return;
        }

        const fetchResults = async () => {
            try {
                setLoading(true);
                const response = await searchPublicProducts({
                    search: query,
                    page: pagination.current,
                    per_page: pagination.pageSize,
                    ...(minPrice && { min_price: minPrice }),
                    ...(maxPrice && { max_price: maxPrice }),
                    sort_field: sortBy === "price_asc" || sortBy === "price_desc" ? "price" : "created_at",
                    sort_order: sortBy === "price_asc" ? "ascend" : "desc",
                });

                console.log("Search results:", response);
                setResults(response.data || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.total || 0,
                }));

            } catch (error) {
                console.error("Error fetching search results:", error);
                message.error("Failed to load search results");
                setResults([]);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [query, pagination.current, pagination.pageSize, minPrice, maxPrice, sortBy, navigate, message]);

    const handleProductClick = (product) => {
        navigate(`/products/${product.id}`, {
            state: { searchKeyword: query },
        });
    };

    const handleAddToCart = (product) => {
        if (!isCustomer) {
            message.warning("Only customers can add items to cart. Please log in as a customer.");
            navigate("/login");
            return;
        }
        
        addItem({
            ...product,
            rating: product.rating || 4.5,
            sold: product.sold || 0,
            category: product.category?.name || "Unknown",
        });
        message.success(`${product.name} added to cart!`);
    };

    const handlePaginationChange = (page) => {
        setPagination(prev => ({ ...prev, current: page }));
        window.scrollTo(0, 0);
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="p-5 lg:p-6 max-w-7xl mx-auto">
                <div className="flex items-center rounded-lg px-5 py-4 bg-white ring-1 ring-gray-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-linear-to-br from-green-600 to-emerald-500 flex items-center justify-center shadow-sm">
                            <Search size={18} className="text-white" />
                        </div>
                        <div>
                            <h1 className="font-sora font-bold text-base text-green-700">Search Results</h1>
                            <p className="text-xs text-gray-500 mt-0.5">Found {pagination.total} product{pagination.total !== 1 ? "s" : ""} for "{query}"</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content - Sidebar + Products */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex gap-6">
                    {/* Left Sidebar - Filters */}
                    <div className="hidden md:block w-72 shrink-0">
                        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                            {/* Sort Section */}
                            <div className="mb-6">
                                <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase">Sort By</h3>
                                <Radio.Group
                                    value={sortBy}
                                    onChange={(e) => {
                                        setSortBy(e.target.value);
                                        setPagination(prev => ({ ...prev, current: 1 }));
                                    }}
                                    style={{ display: "flex", flexDirection: "column", gap: "12px" }}
                                >
                                    <Radio value="created_at">Newest</Radio>
                                    <Radio value="price_asc">Price: Low to High</Radio>
                                    <Radio value="price_desc">Price: High to Low</Radio>
                                </Radio.Group>
                            </div>

                            <Divider style={{ margin: "24px 0" }} />

                            {/* Price Range Section */}
                            <div className="mb-6">
                                <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase">Price Range</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                                            Minimum Price
                                        </label>
                                        <InputNumber
                                            placeholder="₱ 0"
                                            value={minPrice ? Number(minPrice) : null}
                                            onChange={(value) => {
                                                setMinPrice(value ? String(value) : "");
                                                setPagination(prev => ({ ...prev, current: 1 }));
                                            }}
                                            style={{ width: "100%" }}
                                            min={0}
                                            formatter={(value) => `₱ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                            parser={(value) => value.replace(/₱\s?|(,*)/g, "")}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                                            Maximum Price
                                        </label>
                                        <InputNumber
                                            placeholder="₱ Any"
                                            value={maxPrice ? Number(maxPrice) : null}
                                            onChange={(value) => {
                                                setMaxPrice(value ? String(value) : "");
                                                setPagination(prev => ({ ...prev, current: 1 }));
                                            }}
                                            style={{ width: "100%" }}
                                            min={0}
                                            formatter={(value) => `₱ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                            parser={(value) => value.replace(/₱\s?|(,*)/g, "")}
                                        />
                                    </div>
                                </div>

                                {/* Clear Filters Button */}
                                {(minPrice || maxPrice || sortBy !== "created_at") && (
                                    <Button
                                        onClick={() => {
                                            setMinPrice("");
                                            setMaxPrice("");
                                            setSortBy("created_at");
                                            setPagination(prev => ({ ...prev, current: 1 }));
                                        }}
                                        style={{ width: "100%", marginTop: "16px" }}
                                    >
                                        Clear All Filters
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Content - Products Grid */}
                    <div className="flex-1">
                        {loading ? (
                            <div className="flex justify-center items-center py-16">
                                <Spin size="large" />
                            </div>
                        ) : results.length > 0 ? (
                            <>
                                {/* Mobile Filters (shown on small screens) */}
                                <div className="md:hidden mb-6 bg-white rounded-lg p-4 border border-gray-200">
                                    <div className="space-y-4">
                                        {/* Sort */}
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-2">Sort By</label>
                                            <Radio.Group
                                                value={sortBy}
                                                onChange={(e) => {
                                                    setSortBy(e.target.value);
                                                    setPagination(prev => ({ ...prev, current: 1 }));
                                                }}
                                                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
                                            >
                                                <Radio value="created_at">Newest</Radio>
                                                <Radio value="price_asc">Price: Low to High</Radio>
                                                <Radio value="price_desc">Price: High to Low</Radio>
                                            </Radio.Group>
                                        </div>

                                        <Divider style={{ margin: "8px 0" }} />

                                        {/* Min Price */}
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-2">Min Price</label>
                                            <InputNumber
                                                placeholder="₱0"
                                                value={minPrice ? Number(minPrice) : null}
                                                onChange={(value) => {
                                                    setMinPrice(value ? String(value) : "");
                                                    setPagination(prev => ({ ...prev, current: 1 }));
                                                }}
                                                style={{ width: "100%" }}
                                                min={0}
                                                formatter={(value) => `₱ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                                parser={(value) => value.replace(/₱\s?|(,*)/g, "")}
                                            />
                                        </div>

                                        {/* Max Price */}
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-2">Max Price</label>
                                            <InputNumber
                                                placeholder="₱Any"
                                                value={maxPrice ? Number(maxPrice) : null}
                                                onChange={(value) => {
                                                    setMaxPrice(value ? String(value) : "");
                                                    setPagination(prev => ({ ...prev, current: 1 }));
                                                }}
                                                style={{ width: "100%" }}
                                                min={0}
                                                formatter={(value) => `₱ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                                parser={(value) => value.replace(/₱\s?|(,*)/g, "")}
                                            />
                                        </div>

                                        {/* Clear Button */}
                                        {(minPrice || maxPrice || sortBy !== "created_at") && (
                                            <Button
                                                onClick={() => {
                                                    setMinPrice("");
                                                    setMaxPrice("");
                                                    setSortBy("created_at");
                                                    setPagination(prev => ({ ...prev, current: 1 }));
                                                }}
                                                style={{ width: "100%" }}
                                            >
                                                Clear Filters
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Products Grid - 3 columns */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                                    {results.map(product => (
                                        <div
                                            key={product.id}
                                            onClick={() => handleProductClick(product)}
                                            className="cursor-pointer"
                                        >
                                            <ProductCard
                                                product={{
                                                    ...product,
                                                    rating: product.rating || 4.5,
                                                    sold: product.sold || 0,
                                                    category: product.category?.name || "Unknown",
                                                }}
                                                onAdd={(p) => {
                                                    handleAddToCart(p);
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination */}
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
                            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg">
                                <Package size={64} className="text-gray-300 mb-4" />
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">No Products Found</h2>
                                <p className="text-gray-600 mb-6 text-center max-w-md">
                                    We couldn't find any products matching "<span className="font-semibold">{query}</span>". Try searching with different keywords.
                                </p>
                                <button
                                    onClick={() => navigate("/")}
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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
