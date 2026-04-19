import React, { useState, useRef } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { Badge, App, Spin } from "antd";
import { ShoppingBag, Menu, X, ShoppingCart, Package } from "lucide-react";
import { searchPublicProducts } from "../services/productService";
import SearchBar from "../components/SearchBar";

export default function HomeLayout() {
    const { isAuthenticated, isCustomer } = useAuth();
    const { totalItems } = useCart();
    const navigate = useNavigate();
    const location = useLocation();
    const { message } = App.useApp();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [searching, setSearching] = useState(false);
    const debounceTimer = useRef(null);

    const handleSearch = async (e) => {
        const q = e.target.value;
        setSearch(q);

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        if (q.trim()) {
            setSearching(true);
            setShowResults(true);
            debounceTimer.current = setTimeout(async () => {
                try {
                    const response = await searchPublicProducts({
                        search: q,
                        per_page: 5,
                    });
                    const results = response.data || [];
                    setSearchResults(results);
                } catch (error) {
                    console.error("Error searching products:", error);
                    setSearchResults([]);
                    message.error("Failed to search products");
                } finally {
                    setSearching(false);
                }
            }, 300);
        } else {
            setShowResults(false);
            setSearchResults([]);
            setSearching(false);
        }
    };

    const handleResultClick = (product) => {
        navigate(`/products/${product.id}`, {
            state: { searchKeyword: search },
        });
        setShowResults(false);
    };

    const handleSearchSubmit = (e) => {
        if (e.key === "Enter" && search.trim()) {
            navigate(`/search?q=${encodeURIComponent(search)}`);
            setShowResults(false);
        }
    };

    const isActiveRoute = (path) => location.pathname === path;

    const btnGradient = "rounded-xl font-semibold px-5 py-2 transition-all shadow text-white bg-gradient-to-br from-green-700 to-green-500 hover:opacity-90 hover:-translate-y-0.5";

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
                {/* Desktop Layout (lg and above): 4-column grid */}
                <div className="hidden lg:grid grid-cols-4 items-center px-6 sm:px-8 h-20 max-w-7xl mx-auto gap-4">
                    {/* Column 1: Logo */}
                    <Link to="/" className="no-underline flex items-center gap-1 shrink-0">
                        <div className="w-14 h-14  bg-white flex items-center justify-center">
                            <img src="/suki-cart-logo-home.png" alt="SukiCart Logo" className="w-10 h-10 rounded-xl object-contain" />
                        </div>
                        <div>
                            <div className="font-display font-bold text-green-900 text-[1rem]">SukiCart</div>
                        </div>
                    </Link>

                    {/* Columns 2-3: Search Bar (spans 2 columns) */}
                    <div className="col-span-2 relative">
                        <SearchBar
                            search={search}
                            setSearch={(value) => {
                                setSearch(value);
                                if (!value.trim()) {
                                    setShowResults(false);
                                    setSearchResults([]);
                                }
                            }}
                            handleSearch={handleSearch}
                            handleSearchSubmit={handleSearchSubmit}
                            searching={searching}
                            navMode={true}
                        >
                            {showResults && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden">
                                    {searching ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Spin />
                                        </div>
                                    ) : searchResults.length > 0 ? (
                                        <div>
                                            {searchResults.map(p => {
                                                const price = typeof (p.variants?.[0]?.price) === 'number' ? p.variants[0].price : Number(p.variants?.[0]?.price || 0);
                                                return (
                                                <div
                                                    key={p.id}
                                                    className="flex items-center gap-3 px-4 py-3 hover:bg-green-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0"
                                                    onMouseDown={() => handleResultClick(p)}
                                                >
                                                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                                                        <Package size={18} className="text-green-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-semibold text-gray-800 truncate">{p.name}</div>
                                                        <div className="text-xs text-gray-500">{p.category?.name || "Unknown"}</div>
                                                    </div>
                                                    <div className="flex flex-col items-end shrink-0">
                                                        <span className="text-green-600 font-semibold text-sm">₱{price.toFixed(2)}</span>
                                                        <span className="text-xs text-gray-400"> {(p.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0)} in stock</span>
                                                    </div>
                                                </div>
                                                );
                                            })}
                                            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-center">
                                                <button
                                                    onClick={() => navigate(`/search?q=${encodeURIComponent(search)}`)}
                                                    className="text-sm font-semibold text-green-600 hover:text-green-700 transition-colors"
                                                >
                                                    View all results →
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="px-4 py-12 text-center">
                                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                                                <Package size={24} className="text-gray-400" />
                                            </div>
                                            <p className="text-gray-600 font-medium text-sm">No products found</p>
                                            <p className="text-xs text-gray-500 mt-1">Try different keywords</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </SearchBar>
                    </div>

                    {/* Column 4: CTA Buttons */}
                    <div className="flex items-center gap-3 justify-end">
                        {isAuthenticated ? (
                            <>
                                {isCustomer && (
                                    <Link to="/customer/cart" className="relative flex items-center justify-center">
                                        <Badge count={totalItems} size="small" color="#16a34a" offset={[2, -2]}>
                                            <div className="w-9 h-9 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-green-700 hover:bg-green-100 transition-colors">
                                                <ShoppingCart size={18} />
                                            </div>
                                        </Badge>
                                    </Link>
                                )}
                                <button className={btnGradient} onClick={() => navigate("/dashboard")}>Dashboard</button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="px-4 py-2 rounded-xl border border-gray-200 font-semibold text-green-700 hover:bg-green-50 transition text-sm">Sign in</Link>
                                <Link to="/register/customer" className={btnGradient + " text-sm"}>Get Started</Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Mobile/Tablet Layout (< lg): Flex row */}
                <div className="lg:hidden flex items-center px-6 sm:px-8 h-20 max-w-7xl mx-auto gap-4">
                    {/* Logo */}

                    <Link to="/" className="no-underline flex items-center gap-2.5 shrink-0">
                        <div className="w-12 h-12 rounded-[9px] bg-white flex items-center justify-center">
                            <img src="/suki-cart-logo-home.png" alt="SukiCart Logo" className="w-10 h-10 rounded-xl object-contain" />
                        </div>
                        <div className="hidden sm:block">
                            <div className="font-display font-bold text-green-900 text-[1rem]">SukiCart</div>
                        </div>
                    </Link>
                    
                    

                    {/* Search Bar - grows to fill space */}
                    <div className="flex-1 relative">
                        <SearchBar
                            search={search}
                            setSearch={(value) => {
                                setSearch(value);
                                if (!value.trim()) {
                                    setShowResults(false);
                                    setSearchResults([]);
                                }
                            }}
                            handleSearch={handleSearch}
                            handleSearchSubmit={handleSearchSubmit}
                            searching={searching}
                            navMode={true}
                        >
                            {showResults && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden">
                                    {searching ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Spin />
                                        </div>
                                    ) : searchResults.length > 0 ? (
                                        <div>
                                            {searchResults.map(p => {
                                                const price = typeof (p.variants?.[0]?.price) === 'number' ? p.variants[0].price : Number(p.variants?.[0]?.price || 0);
                                                return (
                                                <div
                                                    key={p.id}
                                                    className="flex items-center gap-3 px-4 py-3 hover:bg-green-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0"
                                                    onMouseDown={() => handleResultClick(p)}
                                                >
                                                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                                                        <Package size={18} className="text-green-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-semibold text-gray-800 truncate">{p.name}</div>
                                                        <div className="text-xs text-gray-500">{p.category?.name || "Unknown"}</div>
                                                    </div>
                                                    <div className="flex flex-col items-end shrink-0">
                                                        <span className="text-green-600 font-semibold text-sm">₱{price.toFixed(2)}</span>
                                                        <span className="text-xs text-gray-400"> {(p.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0)} in stock</span>
                                                    </div>
                                                </div>
                                                );
                                            })}
                                            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-center">
                                                <button
                                                    onClick={() => navigate(`/search?q=${encodeURIComponent(search)}`)}
                                                    className="text-sm font-semibold text-green-600 hover:text-green-700 transition-colors"
                                                >
                                                    View all results →
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="px-4 py-12 text-center">
                                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                                                <Package size={24} className="text-gray-400" />
                                            </div>
                                            <p className="text-gray-600 font-medium text-sm">No products found</p>
                                            <p className="text-xs text-gray-500 mt-1">Try different keywords</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </SearchBar>
                    </div>

                    {/* Mobile: Only Get Started button visible */}
                    <div className="shrink-0">
                        {!isAuthenticated && (
                            <Link to="/register/customer" className={btnGradient + " text-sm"}>Get Started</Link>
                        )}
                        {isCustomer && (
                            <Link to="/customer/cart" className="relative flex items-center justify-center">
                                <Badge count={totalItems} size="small" color="#16a34a" offset={[2, -2]}>
                                    <div className="w-9 h-9 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-green-700 hover:bg-green-100 transition-colors">
                                        <ShoppingCart size={18} />
                                    </div>
                                </Badge>
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            {mobileOpen && (
                <div className="sm:hidden fixed top-20 left-0 right-0 bg-white border-b border-gray-200 shadow-md flex flex-col items-center gap-3 py-4 z-40 px-6">
                    {isAuthenticated ? (
                        <button className={btnGradient + " w-full text-center"} onClick={() => { navigate("/dashboard"); setMobileOpen(false); }}>Dashboard</button>
                    ) : (
                        <>
                            <Link to="/login" className="w-full text-center px-4 py-2 rounded-xl border border-gray-200 font-semibold text-green-700 hover:bg-green-50 transition text-sm" onClick={() => setMobileOpen(false)}>Sign in</Link>
                            <Link to="/register/customer" className={btnGradient + " text-center w-full text-sm"} onClick={() => setMobileOpen(false)}>Get Started</Link>
                        </>
                    )}
                </div>
            )}

            <main className="flex-1"><Outlet /></main>

            {/* Mobile Bottom Nav */}
            <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex items-center justify-around py-2 px-4 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
                <Link to="/" className={`flex flex-col items-center gap-0.5 min-w-12 transition-colors ${isActiveRoute("/") ? "text-green-600" : "text-gray-500 hover:text-gray-700"}`}>
                    <ShoppingBag size={20} />
                    <span className="text-[10px] font-medium">Home</span>
                </Link>
                <Link to={isAuthenticated ? "/customer/dashboard" : "/register/customer"} className={`flex flex-col items-center gap-0.5 min-w-12 transition-colors ${isActiveRoute("/customer/dashboard") ? "text-green-600" : "text-gray-500 hover:text-gray-700"}`}>
                    <Menu size={20} />
                    <span className="text-[10px] font-medium">Browse</span>
                </Link>
                {isCustomer && (
                    <Link to="/customer/cart" className={`flex flex-col items-center gap-0.5 min-w-12 relative transition-colors ${isActiveRoute("/customer/cart") ? "text-green-600" : "text-gray-500 hover:text-gray-700"}`}>
                        <Badge count={totalItems} size="small" color="#16a34a" offset={[6, -2]}>
                            <ShoppingCart size={20} />
                        </Badge>
                        <span className="text-[10px] font-medium">Cart</span>
                    </Link>
                )}
                <Link to={isAuthenticated ? "/dashboard" : "/login"} className={`flex flex-col items-center gap-0.5 min-w-12 transition-colors ${isAuthenticated && isActiveRoute("/dashboard") ? "text-green-600" : !isAuthenticated && isActiveRoute("/login") ? "text-green-600" : "text-gray-500 hover:text-gray-700"}`}>
                    <ShoppingBag size={20} />
                    <span className="text-[10px] font-medium">{isAuthenticated ? "Account" : "Sign In"}</span>
                </Link>
            </nav>

            {/* Spacer for mobile bottom nav */}
            <div className="sm:hidden h-16" />

            <footer className="bg-green-950 text-white py-12 px-6">
                <div className="max-w-7xl mx-auto flex flex-col gap-10">
                    <div className="flex flex-wrap justify-between gap-8">
                        <div className="max-w-xs">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/20"><ShoppingBag size={20} /></div>
                                <span className="font-bold text-lg">SukiCart</span>
                            </div>
                            <p className="text-green-200 text-sm leading-relaxed">Your trusted online palengke. Fresh groceries from local farmers, delivered to your door.</p>
                        </div>
                        <div>
                            <p className="font-semibold text-xs text-green-300 uppercase tracking-wide mb-3">Shop</p>
                            <div className="flex flex-col gap-2">
                                {[["Home", "/"], ["Sign In", "/login"], ["Register as Customer", "/register/customer"], ["Register as Seller", "/register/seller"]].map(([label, to]) => (
                                    <Link key={label} to={to} className="text-green-200 hover:text-white text-sm transition">{label}</Link>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col justify-center">
                            <p className="font-bold text-white mb-4">Ready to shop?</p>
                            <Link to="/register/customer" className="rounded-xl font-semibold px-5 py-2.5 text-center text-white bg-gradient-to-br from-green-700 to-green-500 hover:opacity-90 transition shadow-md text-sm">Create Free Account</Link>
                        </div>
                    </div>
                    <div className="border-t border-white/20 pt-6 flex flex-wrap justify-between items-center gap-4">
                        <p className="text-gray-400 text-xs">© {new Date().getFullYear()} SukiCart. Connecting communities with fresh local produce.</p>
                        <div className="flex gap-6">
                            {["Privacy Policy", "Terms of Service"].map(l => <span key={l} className="text-gray-400 text-xs cursor-pointer hover:text-gray-200 transition">{l}</span>)}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
