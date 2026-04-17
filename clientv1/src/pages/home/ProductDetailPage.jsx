import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { App, Spin } from "antd";
import { ShoppingCart, Package, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { getPublicProduct, searchPublicProducts } from "../../services/productService";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import ProductCard from "../../components/home/ProductCard";
import SimilarProducts from "../../components/home/SimilarProducts";

export default function ProductDetailPage() {
    const { id } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();
    const { message } = App.useApp();
    const { addItem } = useCart();
    const { isCustomer } = useAuth();

    const [product, setProduct] = useState(null);
    const [similarProducts, setSimilarProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [similarLoading, setSimilarLoading] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Fetch main product
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                const response = await getPublicProduct(id);
                // API client extracts response.data, so response has product property
                setProduct(response.product);
            } catch (error) {
                console.error("Error fetching product:", error);
                message.error("Failed to load product");
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id, message]);

    // Fetch similar products based on search keyword or category
    useEffect(() => {
        const fetchSimilar = async () => {
            if (!product) return;

            try {
                setSimilarLoading(true);
                const searchKeyword = state?.searchKeyword || product.category?.name || "";

                const response = await searchPublicProducts({
                    search: searchKeyword,
                    per_page: 6,
                });

                // API client extracts response.data, so response.data is the array
                let similar = (response.data || []).filter(p => p.id !== product.id);

                // Limit to 6 items
                setSimilarProducts(similar.slice(0, 6));
            } catch (error) {
                console.error("Error fetching similar products:", error);
                setSimilarProducts([]);
            } finally {
                setSimilarLoading(false);
            }
        };

        fetchSimilar();
    }, [product, state?.searchKeyword]);

    const handleAddToCart = () => {
        if (!isCustomer) {
            message.warning("Only customers can add items to cart. Please log in as a customer.");
            navigate("/login");
            return;
        }
        
        // Transform product to cart format (with mock rating and sold if not available)
        const cartProduct = {
            ...product,
            rating: product.rating || 4.5,
            sold: product.sold || 0,
            category: product.category?.name || "Unknown",
        };
        addItem(cartProduct);
        message.success(`${product.name} added to cart!`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Spin size="large" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
                <Package size={48} className="text-gray-400 mb-4" />
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Product Not Found</h1>
                <p className="text-gray-600 mb-6">The product you're looking for doesn't exist or is no longer available.</p>
                <button
                    onClick={() => navigate("/")}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                    Back to Home
                </button>
            </div>
        );
    }

    const images = product.images && product.images.length > 0 ? product.images : [];
    const currentImage = images.length > 0 ? images[currentImageIndex]?.full_url : null;

    const handlePrevImage = () => {
        setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const handleNextImage = () => {
        setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span>Back</span>
                    </button>
                </div>
            </div>

            {/* Product Detail */}
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-2xl p-8 shadow-sm mb-8">
                    {/* Image Slider */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-center bg-linear-to-br from-green-50 to-emerald-100 rounded-xl w-96 h-96 relative group">
                            {currentImage ? (
                                <>
                                    <img
                                        src={currentImage}
                                        alt={product.name}
                                        className="w-full h-full object-cover rounded-xl"
                                    />
                                    
                                    {/* Navigation Buttons */}
                                    {images.length > 1 && (
                                        <>
                                            <button
                                                onClick={handlePrevImage}
                                                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full transition-all shadow-lg"
                                                title="Previous image"
                                            >
                                                <ChevronLeft size={24} />
                                            </button>
                                            <button
                                                onClick={handleNextImage}
                                                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full transition-all shadow-lg"
                                                title="Next image"
                                            >
                                                <ChevronRight size={24} />
                                            </button>
                                        </>
                                    )}
                                </>
                            ) : (
                                <Package size={80} className="text-green-300" />
                            )}
                        </div>

                        {/* Image Thumbnails & Indicators */}
                        {images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentImageIndex(idx)}
                                        className={`shrink-0 w-16 h-16 rounded-lg border-2 transition-all overflow-hidden ${
                                            idx === currentImageIndex
                                                ? "border-green-600 shadow-lg"
                                                : "border-gray-300 hover:border-green-400"
                                        }`}
                                    >
                                        <img
                                            src={img.full_url}
                                            alt={`${product.name} ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Image Counter */}
                        {images.length > 0 && (
                            <p className="text-center text-sm text-gray-600">
                                {currentImageIndex + 1} of {images.length}
                            </p>
                        )}
                    </div>

                    {/* Details */}
                    <div className="flex flex-col justify-between">
                        <div>
                            {/* Category */}
                            <p className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-3">
                                {product.category?.name || "Uncategorized"}
                            </p>

                            {/* Name and Description */}
                            <h1 className="text-3xl font-bold text-gray-800 mb-4">{product.name}</h1>

                            {/* Price and Stock */}
                            <div className="mb-6">
                                <div className="flex items-baseline gap-4">
                                    <span className="text-4xl font-bold text-green-700">₱{product.price.toFixed(2)}</span>
                                </div>
                                <div className="mt-2">
                                    <p className={`text-sm font-semibold ${product.stock > 10 ? "text-green-600" : "text-orange-600"}`}>
                                        {product.stock > 0 ? `${product.stock} items in stock` : "Out of stock"}
                                    </p>
                                </div>
                            </div>

                            {/* Description */}
                            {product.description && (
                                <div className="mb-6">
                                    <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
                                    <p className="text-gray-600 leading-relaxed">{product.description}</p>
                                </div>
                            )}

                            {/* Product Info Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                {product.sku && (
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">SKU</p>
                                        <p className="text-sm font-semibold text-gray-800">{product.sku}</p>
                                    </div>
                                )}
                                {product.brand && (
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">Brand</p>
                                        <p className="text-sm font-semibold text-gray-800">{product.brand}</p>
                                    </div>
                                )}
                                {product.condition && (
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">Condition</p>
                                        <p className="text-sm font-semibold text-gray-800 capitalize">{product.condition}</p>
                                    </div>
                                )}
                                {product.weight && (
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">Weight</p>
                                        <p className="text-sm font-semibold text-gray-800">{product.weight}</p>
                                    </div>
                                )}
                            </div>

                            {/* Store Info */}
                            {product.store && (
                                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Sold by</p>
                                    <p className="font-semibold text-gray-800">{product.store.store_name || product.store.name}</p>
                                </div>
                            )}
                        </div>

                        {/* Add to Cart Button */}
                        <button
                            onClick={handleAddToCart}
                            disabled={product.stock === 0 || !isCustomer}
                            title={!isCustomer ? "Only customers can add to cart" : product.stock === 0 ? "Out of stock" : ""}
                            className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
                        >
                            <ShoppingCart size={20} />
                            {product.stock > 0 ? (isCustomer ? "Add to Cart" : "Sign in to Shop") : "Out of Stock"}
                        </button>
                    </div>
                </div>

                {/* Similar Products */}
                <SimilarProducts
                    similarProducts={similarProducts}
                    similarLoading={similarLoading}
                    currentProductId={product.id}
                    searchKeyword={state?.searchKeyword}
                    onAddToCart={(p) => {
                        if (!isCustomer) {
                            message.warning("Only customers can add items to cart. Please log in as a customer.");
                            navigate("/login");
                            return;
                        }
                        addItem({ ...p, rating: p.rating || 4.5, sold: p.sold || 0, category: p.category?.name || "Unknown" });
                        message.success(`${p.name} added to cart!`);
                    }}
                />
            </div>
        </div>
    );
}
