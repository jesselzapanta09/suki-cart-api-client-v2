import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { App, Spin, InputNumber, Button } from "antd";
import { ShoppingCart, ShoppingBag, Package, ArrowLeft, ChevronLeft, ChevronRight, Store, Star } from "lucide-react";
import { getPublicProduct, searchPublicProducts } from "../../services/productService";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import ProductCard from "../../components/home/ProductCard";
import SimilarProducts from "../../components/home/SimilarProducts";

export default function ProductDetailPage() {
    const { uuid } = useParams();
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
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [quantity, setQuantity] = useState(1);

    // Fetch main product
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                const response = await getPublicProduct(uuid);
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
    }, [uuid, message]);

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

    // Auto-select first variant if not already selected
    useEffect(() => {
        if (product && product.variants && product.variants.length > 0 && !selectedVariant) {
            setSelectedVariant(product.variants[0]);
        }
    }, [product, selectedVariant]);

    const handleAddToCart = () => {
        // Validate variant is selected
        if (!selectedVariant) {
            message.error("Please select a variant before adding to cart.");
            return;
        }

        if (!isCustomer) {
            // Store pending add-to-cart data in sessionStorage
            const pendingAddToCart = {
                product_uuid: product.uuid,
                product_name: product.name,
                variant_id: selectedVariant.id,
                quantity: quantity,
                variant: selectedVariant,
            };
            sessionStorage.setItem("pendingAddToCart", JSON.stringify(pendingAddToCart));
            message.warning("Please sign in to view your cart.");
            navigate("/login");
            return;
        }

        // Transform product to cart format
        const cartProduct = {
            ...product,
            rating: product.rating || 4.5,
            sold: product.sold || 0,
            category: product.category?.name || "Unknown",
            price: selectedVariant.price,
            stock: selectedVariant.stock,
            variant_id: selectedVariant.id,
            variant: selectedVariant,
        };
        addItem(cartProduct, quantity);
        message.success(`${product.name} added to cart!`);
        // Reset quantity after adding
        setQuantity(1);
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
                <Button
                    onClick={() => navigate("/")}
                    type="primary"
                    size="large"
                    style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}
                >
                    Back to Home
                </Button>
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
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Button
                        onClick={() => navigate(-1)}
                        icon={<ArrowLeft size={20} />}
                        size="large"
                    >
                        Back
                    </Button>
                </div>
            {/* Product Detail */}
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-2xl p-8 shadow-sm mb-8">
                    {/* Image Slider */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-center bg-linear-to-br from-green-50 to-emerald-100 rounded-xl w-full h-auto aspect-square relative group">
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
                                        className={`shrink-0 w-16 h-16 rounded-lg border-2 transition-all overflow-hidden ${idx === currentImageIndex
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
                    <div className="flex flex-col justify-between h-full">
                        <div>
                            {/* Category */}
                            <p className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-3">
                                {product.category?.name || "Uncategorized"}
                            </p>

                            {/* Name */}
                            <h1 className="text-3xl font-bold text-gray-800 mb-4">{product.name}</h1>

                            {/* Rating and Reviews */}
                            <div className="mb-4 pb-4 border-b border-gray-200">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={18}
                                                    className={i < 4 ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-lg font-bold text-gray-800">4.0</span>
                                    </div>
                                    <span className="text-sm text-gray-600">(242 reviews)</span>
                                </div>
                            </div>

                            {/* Price and Stock */}
                            <div className="mb-6">
                                <div className="flex items-baseline gap-4">
                                    <span className="text-4xl font-bold text-green-700">
                                        ₱{(typeof selectedVariant?.price === 'number' ? selectedVariant.price : Number(selectedVariant?.price || 0)).toFixed(2)}
                                    </span>
                                </div>
                                <div className="mt-2">
                                    <p className={`text-sm font-semibold ${(selectedVariant?.stock || 0) > 10 ? "text-green-600" : "text-orange-600"}`}>
                                        {(selectedVariant?.stock || 0) > 0
                                            ? `${selectedVariant.stock} items in stock`
                                            : "Out of stock"}
                                    </p>
                                </div>
                            </div>

                            {/* Product Variants */}
                            {product.variants && product.variants.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="font-semibold text-gray-800 mb-3">Available Options</h3>
                                    <div className="space-y-3">
                                        {product.variants.map((variant) => (
                                            <button
                                                key={variant.id}
                                                onClick={() => setSelectedVariant(variant)}
                                                disabled={variant.stock === 0}
                                                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${selectedVariant?.id === variant.id
                                                        ? "border-green-600 bg-green-50"
                                                        : "border-gray-200 hover:border-green-400"
                                                    } ${variant.stock === 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-semibold text-gray-800">
                                                            {variant.name}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            ₱{(typeof variant.price === 'number' ? variant.price : Number(variant.price || 0)).toFixed(2)} • {variant.stock > 0 ? `${variant.stock} in stock` : "Out of stock"}
                                                        </p>
                                                    </div>
                                                    {selectedVariant?.id === variant.id && (
                                                        <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
                                                            <span className="text-white text-xs">✓</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Quantity */}
                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-800 mb-3">Quantity</h3>
                                <div className="w-32">
                                    <InputNumber
                                        mode="spinner"
                                        min={1}
                                        max={selectedVariant?.stock || 999}
                                        value={quantity}
                                        onChange={(val) => setQuantity(val || 1)}
                                        size="large"
                                        className="w-full"
                                    />
                                </div>
                            </div>
                            {/* Add to Cart and Buy Now Buttons */}
                            <div className="flex gap-4">
                                <Button
                                    onClick={handleAddToCart}
                                    size="large"
                                    className="flex-1"
                                    icon={<ShoppingCart size={20} />}
                                >
                                    Add to Cart
                                </Button>
                                <Button
                                    onClick={() => {
                                        // Buy Now button - just a placeholder for now
                                        message.info(`Buy Now with quantity: ${quantity} (Functionality coming soon)`);
                                    }}
                                    type="primary"
                                    size="large"
                                    className="flex-1"
                                    icon={<ShoppingBag size={20} />}
                                >
                                    Buy Now
                                </Button>
                            </div>

                        </div>

                    </div>
                </div>

                {/* Store Card */}
                {product.store && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm mb-8 border border-gray-100">
                        <div className="flex items-center gap-6">
                            {/* Store Banner */}
                            <div className="h-24 w-24 rounded-full overflow-hidden shrink-0 bg-gray-100 border-2 border-green-600">
                                {product.store.banner ? (
                                    <img
                                        src={`/${product.store.banner}`}
                                        alt={product.store.store_name || product.store.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-green-50 to-emerald-100">
                                        <Package size={32} className="text-green-300" />
                                    </div>
                                )}
                            </div>

                            {/* Store Info */}
                            <div className="flex-1">
                                <div className="mb-3">
                                    <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded mb-2">Official Store</span>
                                    <h3 className="text-lg font-bold text-gray-800">{product.store.store_name || product.store.name}</h3>
                                </div>

                                {/* Rating and Stats */}
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1">
                                        <div className="flex items-center gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={18}
                                                    className={i < 4 ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-sm font-semibold text-gray-700">4.0</span>
                                    </div>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-sm text-gray-600">Fast Shipping</span>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-sm text-gray-600">Trusted Seller</span>
                                </div>
                            </div>

                            {/* View Store Button */}
                            <Button
                                type="default"
                                size="large"
                                onClick={() => navigate(`/store/${product.store.id}`)}
                                className="whitespace-nowrap"
                                icon={<Store size={20} />}
                            >
                                View Store
                            </Button>
                        </div>
                    </div>
                )}
                {(product.description || (product.specs && Object.keys(product.specs).length > 0)) && (
                    <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Description */}
                            {product.description && (
                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-4 text-lg">Description</h3>
                                    <p className="text-gray-600 leading-relaxed">{product.description}</p>
                                </div>
                            )}

                            {/* Specifications */}
                            {product.specs && Object.keys(product.specs).length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-4 text-lg">Specifications</h3>
                                    <div className="space-y-3">
                                        {Object.entries(product.specs).map(([key, value]) => (
                                            <div key={key} className="flex justify-between items-start">
                                                <p className="text-sm text-gray-500 uppercase tracking-wide font-medium">{key}</p>
                                                <p className="text-sm font-semibold text-gray-800 text-right">{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Customer Reviews Section */}
                <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Customer Reviews</h2>
                        
                        {/* Overall Rating Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 pb-8 border-b border-gray-200">
                            {/* Rating Overview */}
                            <div className="flex flex-col items-center justify-center">
                                <div className="text-5xl font-bold text-gray-800 mb-2">4.0</div>
                                <div className="flex gap-1 mb-2">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            size={24}
                                            className={i < 4 ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                                        />
                                    ))}
                                </div>
                                <p className="text-sm text-gray-600">Based on 242 reviews</p>
                            </div>

                            {/* Rating Distribution */}
                            <div className="md:col-span-2 space-y-3">
                                {[
                                    { stars: 5, count: 145, percentage: 60 },
                                    { stars: 4, count: 72, percentage: 30 },
                                    { stars: 3, count: 20, percentage: 8 },
                                    { stars: 2, count: 3, percentage: 1 },
                                    { stars: 1, count: 2, percentage: 1 },
                                ].map((rating) => (
                                    <div key={rating.stars} className="flex items-center gap-4">
                                        <div className="flex items-center gap-1 w-16">
                                            {[...Array(rating.stars)].map((_, i) => (
                                                <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                                            ))}
                                            <span className="text-xs text-gray-600">{rating.stars}</span>
                                        </div>
                                        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="bg-green-600 h-full rounded-full transition-all"
                                                style={{ width: `${rating.percentage}%` }}
                                            />
                                        </div>
                                        <span className="text-sm text-gray-600 w-12 text-right">{rating.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Individual Reviews */}
                    <div className="space-y-6">
                        {[
                            {
                                name: "Maria Santos",
                                rating: 5,
                                date: "March 15, 2026",
                                title: "Excellent Product!",
                                comment: "Very satisfied with this purchase. The product quality is exceptional and delivery was faster than expected. Highly recommended!",
                                verified: true,
                            },
                            {
                                name: "Juan Dela Cruz",
                                rating: 5,
                                date: "March 10, 2026",
                                title: "Great Value for Money",
                                comment: "Amazing quality at this price point. Perfect for what I needed. The seller was very responsive to my questions.",
                                verified: true,
                            },
                            {
                                name: "Angela Reyes",
                                rating: 4,
                                date: "March 5, 2026",
                                title: "Good, but packaging could be better",
                                comment: "Product itself is great and works perfectly. Only minor issue was the packaging could have been more secure, but arrived safely nonetheless.",
                                verified: true,
                            },
                            {
                                name: "Carlos Mendoza",
                                rating: 5,
                                date: "February 28, 2026",
                                title: "Exactly as Described",
                                comment: "Product matches the description perfectly. Fast shipping and excellent customer service. Will definitely buy again!",
                                verified: true,
                            },
                            {
                                name: "Rosa Garcia",
                                rating: 4,
                                date: "February 20, 2026",
                                title: "Very Satisfied",
                                comment: "Good quality product. Took a bit longer to arrive than expected but overall very happy with the purchase.",
                                verified: true,
                            },
                        ].map((review, idx) => (
                            <div key={idx} className="pb-6 border-b border-gray-100 last:border-b-0">
                                {/* Review Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <h4 className="font-semibold text-gray-800">{review.name}</h4>
                                            {review.verified && (
                                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
                                                    ✓ Verified
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex gap-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={14}
                                                        className={i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-xs text-gray-500">{review.date}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Review Content */}
                                <h5 className="font-semibold text-gray-800 mb-2">{review.title}</h5>
                                <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                            </div>
                        ))}
                    </div>

                    {/* View All Reviews Button */}
                    <div className="mt-8 text-center">
                        <Button
                            type="default"
                            size="large"
                            className="px-8"
                        >
                            View All Reviews (242)
                        </Button>
                    </div>
                </div>
                <SimilarProducts
                    similarProducts={similarProducts}
                    similarLoading={similarLoading}
                    currentProductId={product.uuid}
                    searchKeyword={state?.searchKeyword}
                    onAddToCart={(p) => {
                        if (!isCustomer) {
                            message.warning("Only customers can add items to cart. Please log in as a customer.");
                            navigate("/login");
                            return;
                        }
                        addItem({ ...p, rating: p.rating || 4.5, sold: p.sold || 0, category: p.category?.name || "Unknown" }, 1);
                        message.success(`${p.name} added to cart!`);
                    }}
                />
            </div>
        </div>
    );
}
