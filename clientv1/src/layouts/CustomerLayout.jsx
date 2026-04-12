import React, { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { App, Badge } from "antd";
import { ShoppingBag, LayoutDashboard, ShoppingCart, User, LogOut, Menu, X, Home } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import Avatar from "../components/Avatar";
import NotificationBell from "../components/NotificationBell";

const NAV = [
    { label: "Dashboard", to: "/customer/dashboard", icon: LayoutDashboard },
    { label: "Cart", to: "/cart", icon: ShoppingCart, cartBadge: true },
    { label: "Edit Profile", to: "/customer/edit-profile", icon: User },
];

export default function CustomerLayout() {
    const { user, logoutUser } = useAuth();
    const { totalItems } = useCart();
    const { message } = App.useApp();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => setMenuOpen(false), [location.pathname]);

    const handleLogout = async () => {
        await logoutUser();
        message.success("Logged out successfully");
        navigate("/");
    };

    const isActive = (to) => location.pathname === to;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Navbar */}
            <nav className="sticky top-0 z-50 h-16 bg-white border-b border-gray-100 shadow-sm flex items-center justify-between px-4 sm:px-6">
                <Link to="/" className="flex items-center gap-2 no-underline">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-700 to-green-500 flex items-center justify-center text-white shadow">
                        <ShoppingBag size={16} />
                    </div>
                    <span className="font-bold text-green-900">SukiCart</span>
                </Link>

                {/* Desktop nav */}
                <div className="hidden sm:flex items-center gap-1">
                    {NAV.map(n => {
                        const Icon = n.icon;
                        const active = isActive(n.to);
                        return (
                            <Link key={n.to} to={n.to} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all no-underline ${active ? "bg-green-100 text-green-700" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"}`}>
                                {n.cartBadge ? (
                                    <Badge count={totalItems} size="small" color="#16a34a" offset={[4, -2]}><Icon size={16} /></Badge>
                                ) : <Icon size={16} />}
                                {n.label}
                            </Link>
                        );
                    })}
                </div>

                <div className="flex items-center gap-2">
                    <NotificationBell />
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-50 border border-green-100">
                        <Avatar user={user} />
                        <div>
                            <div className="text-xs font-semibold text-green-900">{user?.username}</div>
                            <div className="text-[10px] text-green-600 font-mono">CUSTOMER</div>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer bg-transparent text-sm font-medium">
                        <LogOut size={14} /> Logout
                    </button>
                    <button onClick={() => setMenuOpen(v => !v)} className="sm:hidden w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 cursor-pointer border-none">
                        {menuOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>
                </div>
            </nav>

            {/* Mobile menu */}
            {menuOpen && (
                <>
                    <div onClick={() => setMenuOpen(false)} className="fixed inset-0 z-40 bg-black/25" />
                    <div className="fixed top-16 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-lg px-4 py-3">
                        <div className="flex items-center gap-2.5 p-3 bg-green-50 rounded-xl mb-3">
                            <Avatar user={user} />
                            <div><div className="font-semibold text-green-900 text-sm">{user?.username}</div><div className="text-[10px] text-green-600 font-mono">CUSTOMER</div></div>
                        </div>
                        {NAV.map(n => { const Icon = n.icon; return (
                            <Link key={n.to} to={n.to} className={`flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-medium mb-1 no-underline ${isActive(n.to) ? "bg-green-100 text-green-700" : "text-gray-600 hover:bg-gray-50"}`}>
                                <Icon size={16} /> {n.label} {n.cartBadge && totalItems > 0 && <span className="ml-auto bg-green-600 text-white text-xs rounded-full px-2 py-0.5">{totalItems}</span>}
                            </Link>
                        ); })}
                        <div className="border-t border-gray-100 mt-2 pt-2">
                            <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm text-red-500 font-medium cursor-pointer bg-transparent border-none hover:bg-red-50">
                                <LogOut size={16} /> Logout
                            </button>
                        </div>
                    </div>
                </>
            )}

            <main className="flex-1"><Outlet /></main>

            {/* Mobile Bottom Nav */}
            <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex items-center justify-around py-2 px-2 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
                <Link to="/" className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-green-600 min-w-[48px]"><Home size={20} /><span className="text-[10px]">Home</span></Link>
                <Link to="/customer/dashboard" className={`flex flex-col items-center gap-0.5 min-w-[48px] ${isActive("/customer/dashboard") ? "text-green-600" : "text-gray-400"}`}><LayoutDashboard size={20} /><span className="text-[10px]">Shop</span></Link>
                <Link to="/cart" className={`flex flex-col items-center gap-0.5 min-w-[48px] ${isActive("/cart") ? "text-green-600" : "text-gray-400"}`}>
                    <Badge count={totalItems} size="small" color="#16a34a" offset={[6, -2]}><ShoppingCart size={20} /></Badge>
                    <span className="text-[10px]">Cart</span>
                </Link>
                <Link to="/customer/edit-profile" className={`flex flex-col items-center gap-0.5 min-w-[48px] ${isActive("/customer/edit-profile") ? "text-green-600" : "text-gray-400"}`}><User size={20} /><span className="text-[10px]">Profile</span></Link>
            </nav>
            <div className="sm:hidden h-16" />
        </div>
    );
}
