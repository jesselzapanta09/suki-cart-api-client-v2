import React, { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { App } from "antd";
import { ShoppingBag, LayoutDashboard, Users, KeyRound, LogOut, Menu, X, Package, LayoutGrid, ShieldCheck, Store } from "lucide-react";
import NotificationBell from "../components/NotificationBell";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/Avatar";

const SIDEBAR_W = 240;
const BREAKPOINT = 1024;

const NAV = [
    { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Users", to: "/admin/users", icon: Users },
    { label: "Categories", to: "/admin/categories", icon: LayoutGrid },
    { label: "Seller Verify", to: "/admin/seller-verify", icon: ShieldCheck },
    { label: "Manage Sellers", to: "/admin/sellers", icon: Store },
    { label: "Edit Profile", to: "/admin/edit-profile", icon: KeyRound },
];

function useIsDesktop() {
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= BREAKPOINT);
    useEffect(() => {
        const handler = () => setIsDesktop(window.innerWidth >= BREAKPOINT);
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    }, []);
    return isDesktop;
}

function SidebarContent({ user, location, handleLogout }) {
    return (
        <div className="w-60 h-screen bg-rail-950 flex flex-col shadow-[2px_0_20px_rgba(0,0,0,0.18)]">
            {/* Brand */}
            <div className="px-5 py-6 border-b border-white/8">
                <Link to="/" className="no-underline flex items-center gap-2.5">
                    <div className="w-8.5 h-8.5 rounded-[9px] bg-white flex items-center justify-center">
                        <img src="/suki-cart-logo.png" alt="SukiCart Logo" className="w-7 h-7 rounded-xl object-contain" />
                    </div>
                    <div>
                        <div className="font-display font-bold text-white text-[0.95rem]">SukiCart</div>
                        <div className="text-[0.68rem] text-[#86efac] font-mono">ADMIN PANEL</div>
                    </div>
                </Link>
            </div>

            {/* Nav items */}
            <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
                {NAV.map((n) => {
                    const active = location.pathname === n.to;
                    const IconComponent = n.icon;
                    return (
                        <Link key={n.to} to={n.to}
                            className={`flex items-center gap-2.5 px-3 py-2.75 rounded-[9px] no-underline font-body text-[0.9rem] mb-1 transition-[background] duration-150 ${active ? 'font-semibold' : 'font-normal'}`}
                            style={{
                                color: active ? "white" : "rgba(255,255,255,0.7)",
                                background: active ? "rgba(34,197,94,0.25)" : "transparent",
                            }}>
                            <IconComponent size={18} className={active ? "text-[#86efac]" : "text-white/40"} />
                            {n.label}
                        </Link>
                    );
                })}
            </nav>

            {/* User + logout */}
            <div className="px-3 py-4 border-t border-white/8">
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 mb-1.5 rounded-[10px] bg-white/5">
                    <Avatar user={user} />
                    <div className="overflow-hidden">
                        <div className="text-white font-body font-semibold text-[0.85rem] whitespace-nowrap overflow-hidden text-ellipsis">{user?.username}</div>
                        <div className="text-[#86efac] text-[0.68rem] font-mono">
                            {user?.firstname && user?.lastname ? `${user.firstname} ${user.lastname}` : ""}
                        </div>
                    </div>
                </div>
                <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-[10px] border-none bg-transparent text-white/50 font-body text-[0.875rem] cursor-pointer transition-all duration-150 hover:bg-[rgba(231,74,74,0.15)] hover:text-[rgba(255,130,130,0.9)]">
                    <LogOut size={16} /> Logout
                </button>
            </div>
        </div>
    );
}

export default function AdminLayout() {
    const { user, logoutUser } = useAuth();
    const { message } = App.useApp();
    const navigate = useNavigate();
    const location = useLocation();
    const isDesktop = useIsDesktop();
    const [menuOpen, setMenuOpen] = useState(false);

    const [prevPathname, setPrevPathname] = useState(location.pathname);
    if (location.pathname !== prevPathname) {
        setPrevPathname(location.pathname);
        setMenuOpen(false);
    }

    const [prevIsDesktop, setPrevIsDesktop] = useState(isDesktop);
    if (isDesktop !== prevIsDesktop) {
        setPrevIsDesktop(isDesktop);
        if (isDesktop) setMenuOpen(false);
    }

    const handleLogout = async () => {
        await logoutUser();
        message.success("Logged out successfully");
        navigate("/");
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* DESKTOP: fixed sidebar */}
            {isDesktop && (
                <div className="w-60 shrink-0">
                    <div className="fixed top-0 left-0 z-40"><SidebarContent user={user} location={location} handleLogout={handleLogout} /></div>
                </div>
            )}

            {/* MOBILE: top navbar */}
            {!isDesktop && (
                <nav className="fixed top-0 left-0 right-0 z-50 h-15.5 bg-rail-950 flex items-center justify-between px-5 shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
                    <Link to="/admin/dashboard" className="no-underline flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-[9px] bg-white flex items-center justify-center">
                            <img src="/suki-cart-logo.png" alt="SukiCart Logo" className="w-6 h-6 rounded-xl object-contain" />
                        </div>
                        <div>
                            <div className="font-display font-bold text-white text-[0.9rem]">SukiCart</div>
                            <div className="text-[0.6rem] text-[#86efac] font-mono">ADMIN</div>
                        </div>
                    </Link>
                    <div className="flex items-center gap-2.5">
                        <NotificationBell />
                        <Avatar user={user}/>
                        <button onClick={() => setMenuOpen(v => !v)} className="bg-white/10 border border-white/20 rounded-lg px-1.5 py-1 text-white cursor-pointer flex items-center">
                            {menuOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </nav>
            )}

            {/* MOBILE: dropdown menu */}
            {!isDesktop && menuOpen && (
                <>
                    <div onClick={() => setMenuOpen(false)} className="fixed inset-0 z-44 bg-black/35" />
                    <div className="fixed top-15.5 left-0 right-0 z-45 bg-rail-950 border-b border-white/8 shadow-[0_8px_24px_rgba(0,0,0,0.3)] px-4 py-3">
                        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] bg-white/6 mb-3">
                            <Avatar user={user}/>
                            <div>
                                <div className="text-white font-body font-semibold text-[0.9rem]">{user?.username}</div>
                                <div className="text-[#86efac] text-[0.65rem] font-mono">
                                    {user?.firstname && user?.lastname ? `${user.firstname} ${user.lastname}` : ""}
                                </div>
                            </div>
                        </div>
                        {NAV.map((n) => {
                            const active = location.pathname === n.to;
                            const IconComponent = n.icon;
                            return (
                                <Link key={n.to} to={n.to}
                                    className={`flex items-center gap-2.5 px-3 py-2.75 rounded-[9px] no-underline font-body text-[0.9rem] mb-1 transition-[background] duration-150 ${active ? 'font-semibold' : 'font-normal'}`}
                                    style={{
                                        color: active ? "white" : "rgba(255,255,255,0.7)",
                                        background: active ? "rgba(34,197,94,0.25)" : "transparent",
                                    }}>
                                    <IconComponent size={18} className={active ? "text-[#86efac]" : "text-white/40"} />
                                    {n.label}
                                </Link>
                            );
                        })}
                        <div className="border-t border-white/8 my-2" />
                        <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-3 rounded-[9px] border-none bg-transparent text-[rgba(255,120,120,0.85)] font-body font-medium text-[0.9rem] cursor-pointer transition-colors duration-150 hover:bg-[rgba(231,74,74,0.15)]">
                            <LogOut size={16} /> Logout
                        </button>
                    </div>
                </>
            )}

            <main className={`flex-1 min-w-0 ${isDesktop ? 'pt-0' : 'pt-15.5'}`}>
                {/* Desktop topbar */}
                {isDesktop && (
                    <div className="sticky top-0 z-30 h-14 bg-white border-b border-gray-100 shadow-sm flex items-center justify-end px-6 gap-3">
                        <NotificationBell />
                        <Avatar  user={user} />
                    </div>
                )}
                <Outlet />
            </main>
        </div>
    );
}
