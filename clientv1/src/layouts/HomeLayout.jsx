import React, { useState, useEffect } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { Badge } from "antd";
import { ShoppingBag, Menu, X, ShoppingCart } from "lucide-react";

export default function HomeLayout() {
    const { isAuthenticated } = useAuth();
    const { totalItems } = useCart();
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const btnGradient = "rounded-xl font-semibold px-5 py-2 transition-all shadow text-white bg-gradient-to-br from-green-700 to-green-500 hover:opacity-90 hover:-translate-y-0.5";

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <nav className={`sticky top-0 z-50 flex items-center justify-between px-6 sm:px-8 h-16 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm" : "bg-transparent border-b border-transparent"}`}>
                <Link to="/" className="flex items-center gap-2 no-underline">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-green-700 to-green-500 text-white shadow">
                        <ShoppingBag size={20} />
                    </div>
                    <span className="font-bold text-green-900 text-lg">SukiCart</span>
                </Link>

                <div className="hidden sm:flex items-center gap-3">
                    {isAuthenticated ? (
                        <>
                            <Link to="/cart" className="relative flex items-center justify-center">
                                <Badge count={totalItems} size="small" color="#16a34a" offset={[2, -2]}>
                                    <div className="w-9 h-9 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-green-700 hover:bg-green-100 transition-colors">
                                        <ShoppingCart size={18} />
                                    </div>
                                </Badge>
                            </Link>
                            <button className={btnGradient} onClick={() => navigate("/dashboard")}>Dashboard</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="px-4 py-2 rounded-xl border border-gray-200 font-semibold text-green-700 hover:bg-green-50 transition text-sm">Sign in</Link>
                            <Link to="/register/customer" className={btnGradient + " text-sm"}>Get Started</Link>
                        </>
                    )}
                </div>

                <div className="sm:hidden flex items-center gap-2">
                    {isAuthenticated && (
                        <Link to="/cart" className="relative">
                            <Badge count={totalItems} size="small" color="#16a34a" offset={[2, -2]}>
                                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center text-green-700">
                                    <ShoppingCart size={18} />
                                </div>
                            </Badge>
                        </Link>
                    )}
                    <button onClick={() => setMobileOpen(!mobileOpen)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </nav>

            {mobileOpen && (
                <div className="sm:hidden fixed top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-md flex flex-col items-center gap-3 py-4 z-40 px-6">
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
                <Link to="/" className="flex flex-col items-center gap-0.5 text-green-700 min-w-[48px]">
                    <ShoppingBag size={20} />
                    <span className="text-[10px] font-medium">Home</span>
                </Link>
                <Link to={isAuthenticated ? "/customer/dashboard" : "/register/customer"} className="flex flex-col items-center gap-0.5 text-gray-500 min-w-[48px]">
                    <Menu size={20} />
                    <span className="text-[10px] font-medium">Browse</span>
                </Link>
                <Link to="/cart" className="flex flex-col items-center gap-0.5 text-gray-500 min-w-[48px] relative">
                    <Badge count={totalItems} size="small" color="#16a34a" offset={[6, -2]}>
                        <ShoppingCart size={20} />
                    </Badge>
                    <span className="text-[10px] font-medium">Cart</span>
                </Link>
                <Link to={isAuthenticated ? "/dashboard" : "/login"} className="flex flex-col items-center gap-0.5 text-gray-500 min-w-[48px]">
                    <ShoppingBag size={20} />
                    <span className="text-[10px] font-medium">{isAuthenticated ? "Account" : "Sign In"}</span>
                </Link>
            </nav>

            {/* Spacer for mobile bottom nav */}
            <div className="sm:hidden h-16" />

            <footer className="bg-green-950 text-white py-12 px-6">
                <div className="max-w-6xl mx-auto flex flex-col gap-10">
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
