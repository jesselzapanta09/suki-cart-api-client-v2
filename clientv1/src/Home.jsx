import React, { useRef, useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useCart } from "./context/CartContext";
import { App } from "antd";
import {
    ShoppingBag, ChevronRight, ChevronLeft, Star, Search,
    Truck, Shield, Leaf, ShoppingCart, Package
} from "lucide-react";
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from "./services/mockData";

const HERO_SLIDES = [
    { tag: "FRESH DAILY", title: "Your Trusted Online", accent: "Palengke", subtitle: "Fresh, affordable groceries from local farmers — delivered to your door.", cta: "Shop Now", bg: "from-green-950 via-green-900 to-green-700" },
    { tag: "LOCAL SELLERS", title: "Support Your", accent: "Neighborhood", subtitle: "Discover sari-sari stores, bakeries, and more — all in one place.", cta: "Find Stores", bg: "from-emerald-950 via-emerald-900 to-teal-700" },
    { tag: "BEST PRICES", title: "Deals You Can", accent: "Trust", subtitle: "Everyday low prices on hundreds of products. No hidden fees.", cta: "View Deals", bg: "from-green-900 via-green-800 to-lime-700" },
];

function HeroSlider({ isAuthenticated }) {
    const [active, setActive] = useState(0);
    const timerRef = useRef(null);
    const next = useCallback(() => setActive(a => (a + 1) % HERO_SLIDES.length), []);
    const prev = useCallback(() => setActive(a => (a - 1 + HERO_SLIDES.length) % HERO_SLIDES.length), []);
    useEffect(() => { timerRef.current = setInterval(next, 5000); return () => clearInterval(timerRef.current); }, [next]);
    const resetTimer = (fn) => { clearInterval(timerRef.current); fn(); timerRef.current = setInterval(next, 5000); };
    const slide = HERO_SLIDES[active];
    return (
        <section className={`relative min-h-[92vh] flex items-center overflow-hidden bg-linear-to-br ${slide.bg} transition-all duration-700`}>
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-15%] right-[-10%] w-175 h-175 rounded-full bg-white/5 border border-white/5" />
                <div className="absolute bottom-[-20%] left-[-8%] w-125 h-125 rounded-full bg-green-400/10 border border-white/5" />
                <svg className="absolute inset-0 opacity-[0.03]" width="100%" height="100%">
                    <defs><pattern id="hero-dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="white" /></pattern></defs>
                    <rect width="100%" height="100%" fill="url(#hero-dots)" />
                </svg>
            </div>
            <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 pt-28 pb-24 w-full">
                <div className="max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6 bg-white/10 border border-white/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-emerald-200 text-xs font-mono font-medium tracking-widest">{slide.tag}</span>
                    </div>
                    <h1 className="font-bold text-white text-4xl sm:text-5xl md:text-6xl leading-tight mb-4 tracking-tight">
                        {slide.title} <br /><span className="text-emerald-300">{slide.accent}</span>
                    </h1>
                    <p className="text-green-200 text-lg leading-relaxed mb-10 max-w-lg">{slide.subtitle}</p>
                    <div className="flex flex-wrap gap-3">
                        <Link to={isAuthenticated ? "/dashboard" : "/register/customer"} className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white text-green-800 font-bold shadow-xl hover:-translate-y-0.5 transition-all">
                            {slide.cta} <ChevronRight className="w-4 h-4" />
                        </Link>
                        <Link to="/login" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white/10 text-white font-semibold border border-white/20 hover:bg-white/20 transition-all">
                            Sign In
                        </Link>
                    </div>
                </div>
            </div>
            <button onClick={() => resetTimer(prev)} className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors cursor-pointer border-none">
                <ChevronLeft size={20} />
            </button>
            <button onClick={() => resetTimer(next)} className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors cursor-pointer border-none">
                <ChevronRight size={20} />
            </button>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {HERO_SLIDES.map((_, i) => (
                    <button key={i} onClick={() => resetTimer(() => setActive(i))} className={`rounded-full transition-all cursor-pointer border-none ${i === active ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/40"}`} />
                ))}
            </div>
            <div className="absolute bottom-0 left-0 right-0">
                <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="block w-full">
                    <path d="M0 30C240 60 480 0 720 30C960 60 1200 0 1440 30V60H0V30Z" fill="#f9fafb" />
                </svg>
            </div>
        </section>
    );
}

function ProductCard({ product, onAdd }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all group overflow-hidden">
            <div className="h-32 bg-linear-to-br from-green-50 to-emerald-100 flex items-center justify-center relative">
                <Package size={40} className="text-green-400 group-hover:scale-110 transition-transform" />
                <div className="absolute top-3 right-3 bg-white rounded-lg px-2 py-0.5 text-xs font-semibold text-yellow-600 shadow-sm">⭐ {product.rating}</div>
            </div>
            <div className="p-4">
                <p className="text-xs text-green-600 font-semibold mb-1 uppercase tracking-wide">{product.category}</p>
                <h3 className="font-bold text-gray-800 text-sm mb-3 leading-snug" style={{display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{product.name}</h3>
                <div className="flex items-center justify-between">
                    <div>
                        <span className="font-bold text-green-700 text-base">₱{product.price.toFixed(2)}</span>
                        <p className="text-xs text-gray-400 mt-0.5">{product.sold} sold</p>
                    </div>
                    <button onClick={() => onAdd(product)} className="w-9 h-9 rounded-xl bg-green-600 hover:bg-green-700 flex items-center justify-center text-white transition-colors cursor-pointer border-none shadow-sm">
                        <ShoppingCart size={15} />
                    </button>
                </div>
            </div>
        </div>
    );
}

function FeaturedSlider({ products, onAdd }) {
    const [idx, setIdx] = useState(0);
    const perPage = 3;
    const max = Math.max(0, products.length - perPage);
    return (
        <div>
            <div className="overflow-hidden rounded-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.slice(idx, idx + perPage).map(p => <ProductCard key={p.id} product={p} onAdd={onAdd} />)}
                </div>
            </div>
            <div className="flex justify-center gap-2 mt-6">
                <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0} className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-green-50 hover:border-green-200 disabled:opacity-40 transition-colors cursor-pointer">
                    <ChevronLeft size={18} />
                </button>
                <button onClick={() => setIdx(i => Math.min(max, i + 1))} disabled={idx >= max} className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-green-50 hover:border-green-200 disabled:opacity-40 transition-colors cursor-pointer">
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
}

function SectionHeading({ tag, title, subtitle }) {
    return (
        <div className="text-center mb-10">
            {tag && <div className="inline-block px-4 py-1 rounded-full mb-3 bg-green-100 text-green-700 text-xs font-mono font-semibold tracking-wider uppercase">{tag}</div>}
            <h2 className="font-bold text-3xl md:text-4xl text-green-900 mb-3">{title}</h2>
            {subtitle && <p className="text-gray-500 text-base max-w-xl mx-auto">{subtitle}</p>}
        </div>
    );
}

export default function Home() {
    const { isAuthenticated } = useAuth();
    const { addItem } = useCart();
    const { message } = App.useApp();
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);

    const handleSearch = (e) => {
        const q = e.target.value;
        setSearch(q);
        if (q.trim()) {
            const results = MOCK_PRODUCTS.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || p.category.toLowerCase().includes(q.toLowerCase()));
            setSearchResults(results.slice(0, 5));
            setShowResults(true);
        } else { setShowResults(false); }
    };

    const handleAdd = (product) => { addItem(product); message.success(`${product.name} added to cart!`); };
    const popular = [...MOCK_PRODUCTS].sort((a, b) => b.sold - a.sold).slice(0, 6);
    const latest = [...MOCK_PRODUCTS].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 4);
    const featured = MOCK_PRODUCTS.slice(0, 9);

    return (
        <div className="font-body bg-gray-50">
            <HeroSlider isAuthenticated={isAuthenticated} />

            {/* Search Bar */}
            <section className="py-8 px-4 bg-gray-50">
                <div className="max-w-2xl mx-auto relative">
                    <div className="flex items-center bg-white rounded-2xl border border-gray-200 shadow-md px-4 py-3 gap-3 focus-within:border-green-400 focus-within:shadow-lg transition-all">
                        <Search size={20} className="text-green-500 flex-shrink-0" />
                        <input type="text" placeholder="Search for products, categories…" value={search} onChange={handleSearch} onBlur={() => setTimeout(() => setShowResults(false), 150)} onFocus={() => search && setShowResults(true)} className="flex-1 outline-none text-gray-700 text-sm placeholder-gray-400 bg-transparent" />
                        {search && <button onClick={() => { setSearch(""); setShowResults(false); }} className="text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-none text-xl leading-none">×</button>}
                    </div>
                    {showResults && searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-100 shadow-xl z-50 overflow-hidden">
                            {searchResults.map(p => (
                                <div key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-green-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0" onClick={() => handleAdd(p)}>
                                    <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center"><Package size={15} className="text-green-600" /></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-gray-800 truncate">{p.name}</div>
                                        <div className="text-xs text-gray-400">{p.category}</div>
                                    </div>
                                    <span className="text-green-700 font-bold text-sm">₱{p.price.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Value Props */}
            <section className="py-6 px-4 sm:px-6 bg-gray-50">
                <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { icon: Truck, label: "Free Delivery", sub: "On orders over ₱500" },
                        { icon: Leaf, label: "Fresh Daily", sub: "Sourced from local farms" },
                        { icon: Shield, label: "Secure Checkout", sub: "Your data is protected" },
                        { icon: Star, label: "Top Rated", sub: "Trusted by 10k+ sukis" },
                    ].map((item) => {
                        const IconComp = item.icon;
                        return (
                            <div key={item.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col items-center text-center gap-2">
                                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0"><IconComp size={18} className="text-green-600" /></div>
                                <span className="font-semibold text-gray-800 text-sm">{item.label}</span>
                                <span className="text-xs text-gray-400">{item.sub}</span>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Shop by Category */}
            <section className="py-16 px-4 sm:px-6 bg-white">
                <div className="max-w-6xl mx-auto">
                    <SectionHeading tag="Categories" title="Shop by Category" subtitle="Find exactly what you need from fresh local stores" />
                    <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                        {MOCK_CATEGORIES.map(cat => (
                            <button key={cat.key} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-green-50 hover:border-green-200 transition-all group cursor-pointer border-none">
                                <div className="text-2xl sm:text-3xl">{cat.icon}</div>
                                <span className="text-xs font-semibold text-gray-700 text-center leading-tight group-hover:text-green-700">{cat.label}</span>
                                <span className="text-[10px] text-gray-400 hidden sm:block">{cat.count} items</span>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Popular Products */}
            <section className="py-16 px-4 sm:px-6 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <SectionHeading tag="Trending" title="Popular Products" subtitle="Best-selling items loved by your community" />
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {popular.map(p => <ProductCard key={p.id} product={p} onAdd={handleAdd} />)}
                    </div>
                </div>
            </section>

            {/* Latest Products */}
            <section className="py-16 px-4 sm:px-6 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <div className="inline-block px-4 py-1 rounded-full mb-2 bg-green-100 text-green-700 text-xs font-mono font-semibold tracking-wider uppercase">New Arrivals</div>
                            <h2 className="font-bold text-3xl text-green-900">Latest Products</h2>
                        </div>
                        <Link to={isAuthenticated ? "/customer/dashboard" : "/register/customer"} className="text-green-600 font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all">
                            View all <ChevronRight size={16} />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {latest.map(p => <ProductCard key={p.id} product={p} onAdd={handleAdd} />)}
                    </div>
                </div>
            </section>

            {/* Featured Slider */}
            <section className="py-16 px-4 sm:px-6 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <SectionHeading tag="Curated" title="Featured Products" subtitle="Hand-picked selections from our best local sellers" />
                    <FeaturedSlider products={featured} onAdd={handleAdd} />
                </div>
            </section>

            {/* CTA Banner */}
            <section className="py-20 px-4 sm:px-6 bg-linear-to-br from-green-900 to-green-700 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-20%] right-[-5%] w-96 h-96 rounded-full bg-white/5" />
                    <div className="absolute bottom-[-20%] left-[-5%] w-72 h-72 rounded-full bg-green-400/10" />
                </div>
                <div className="max-w-3xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 bg-white/10 border border-white/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-emerald-200 text-xs font-mono font-medium tracking-widest">JOIN FREE TODAY</span>
                    </div>
                    <h2 className="font-bold text-white text-3xl sm:text-4xl mb-4">Ready to start shopping?</h2>
                    <p className="text-green-200 text-base mb-8 max-w-lg mx-auto">Join thousands of Filipinos shopping fresh, local, and affordable every day.</p>
                    <div className="flex flex-wrap gap-3 justify-center">
                        <Link to="/register/customer" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white text-green-800 font-bold shadow-xl hover:-translate-y-0.5 transition-all">
                            <ShoppingBag size={18} /> Create Free Account
                        </Link>
                        <Link to="/register/seller" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white/10 text-white font-semibold border border-white/20 hover:bg-white/20 transition-all">
                            Sell on SukiCart
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
