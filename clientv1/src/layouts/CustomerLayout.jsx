import React from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { App, Badge, Modal, Button } from "antd";
import { ShoppingBag, LayoutDashboard, ShoppingCart, User, LogOut } from "lucide-react";
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
    const [logoutModalOpen, setLogoutModalOpen] = React.useState(false);
    const [logoutLoading, setLogoutLoading] = React.useState(false);

    const handleLogout = async () => {
        setLogoutLoading(true);
        try {
            await logoutUser();
            message.success("Logged out successfully");
            setLogoutModalOpen(false);
            navigate("/");
        } catch (error) {
            console.error("Logout failed:", error);
            message.error("Failed to logout");
        } finally {
            setLogoutLoading(false);
        }
    };

    const isActive = (to) => location.pathname === to;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Navbar */}
            <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
                {/* Desktop Layout (md and above): 3-column grid */}
                <div className="hidden md:grid grid-cols-3 items-center px-4 sm:px-6 lg:px-8 h-16 sm:h-20 max-w-7xl mx-auto gap-2 sm:gap-4">
                    {/* Column 1: Logo */}
                    <Link to="/" className="no-underline flex items-center gap-1 shrink-0">
                        <div className="w-12 sm:w-14 h-12 sm:h-14 bg-white flex items-center justify-center rounded-lg sm:rounded-xl">
                            <img src="/suki-cart-logo-home.png" alt="SukiCart Logo" className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg sm:rounded-xl object-contain" />
                        </div>
                        <div className="hidden sm:block">
                            <div className="font-display font-bold text-green-900 text-sm sm:text-base">SukiCart</div>
                        </div>
                    </Link>

                    {/* Column 2: Desktop nav links */}
                    <div className="flex items-center gap-0.5 sm:gap-1 justify-center">
                        {NAV.map(n => {
                            const Icon = n.icon;
                            const active = isActive(n.to);
                            return (
                                <Link key={n.to} to={n.to} className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all no-underline ${active ? "bg-green-100 text-green-700" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"}`}>
                                    {n.cartBadge ? (
                                        <Badge count={totalItems} size="small" color="#16a34a" offset={[4, -2]}><Icon size={16} /></Badge>
                                    ) : <Icon size={16} />}
                                    <span className="hidden sm:inline">{n.label}</span>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Column 3: Notifications, user info, and logout */}
                    <div className="flex items-center gap-1 sm:gap-2 justify-end">
                        <NotificationBell />
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-50 border border-green-100">
                            <Avatar user={user} />
                            <div>
                                <div className="text-[10px] text-green-600 font-mono">{user?.firstname} {user?.lastname}</div>
                            </div>
                        </div>
                        <button onClick={() => setLogoutModalOpen(true)} className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer bg-transparent text-sm font-medium">
                            <LogOut size={14} /> Logout
                        </button>
                    </div>
                </div>

                {/* Mobile Layout (< md): Logo and notification bell only */}
                <div className="md:hidden flex items-center justify-between px-3 sm:px-4 h-16">
                    <Link to="/" className="no-underline flex items-center gap-1 shrink-0">
                        <div className="w-12 h-12 rounded-lg sm:rounded-[9px] bg-white flex items-center justify-center">
                            <img src="/suki-cart-logo-home.png" alt="SukiCart Logo" className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg object-contain" />
                        </div>
                    </Link>
                    <NotificationBell />
                </div>
            </nav>

            <main className="flex-1"><Outlet /></main>

            {/* Mobile Bottom Nav (< md) */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex items-center justify-around py-2 px-2 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
                <Link to="/customer/dashboard" className={`flex flex-col items-center gap-0.5 min-w-[48px] ${isActive("/customer/dashboard") ? "text-green-600" : "text-gray-400"}`}><LayoutDashboard size={20} /><span className="text-[10px]">Dashboard</span></Link>
                <Link to="/cart" className={`flex flex-col items-center gap-0.5 min-w-[48px] ${isActive("/cart") ? "text-green-600" : "text-gray-400"}`}>
                    <Badge count={totalItems} size="small" color="#16a34a" offset={[6, -2]}><ShoppingCart size={20} /></Badge>
                    <span className="text-[10px]">Cart</span>
                </Link>
                <Link to="/customer/edit-profile" className={`flex flex-col items-center gap-0.5 min-w-[48px] ${isActive("/customer/edit-profile") ? "text-green-600" : "text-gray-400"}`}><User size={20} /><span className="text-[10px]">Profile</span></Link>
                <button onClick={() => setLogoutModalOpen(true)} className="flex flex-col items-center gap-0.5 min-w-[48px] text-gray-400 hover:text-red-500 cursor-pointer bg-transparent border-none">
                    <LogOut size={20} /><span className="text-[10px]">Logout</span>
                </button>
            </nav>
            <div className="md:hidden h-16" />

            {/* Logout Confirmation Modal */}
            <Modal
                title="Logout"
                open={logoutModalOpen}
                onCancel={() => setLogoutModalOpen(false)}
                footer={[
                    <Button key="cancel" onClick={() => setLogoutModalOpen(false)}>
                        Cancel
                    </Button>,
                    <Button
                        key="logout"
                        type="primary"
                        danger
                        loading={logoutLoading}
                        onClick={handleLogout}
                    >
                        Logout
                    </Button>,
                ]}
            >
                Are you sure you want to logout?
            </Modal>
        </div>
    );
}
