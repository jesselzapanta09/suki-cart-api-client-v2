import React, { useState, useEffect } from "react";
import { Card, Tag, Button, Input, App } from "antd";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { ShoppingBag, Package, Clock, Star, Search, ShoppingCart, TrendingUp } from "lucide-react";
import { MOCK_PRODUCTS, MOCK_ORDERS } from "../../services/mockData";
import { Link } from "react-router-dom";

const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "☀️ Good Morning";
    if (h < 18) return "🌤️ Good Afternoon";
    return "🌙 Good Evening";
};

const statusColor = { delivered: "green", shipped: "blue", processing: "orange" };

export default function CustomerDashboard() {
    const { user } = useAuth();
    const { addItem, totalItems } = useCart();
    const { message } = App.useApp();
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => { setProducts(MOCK_PRODUCTS); setLoading(false); }, 400);
    }, []);

    const filtered = products.filter(p =>
        !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase())
    );

    const handleAddToCart = (product) => {
        addItem(product);
        message.success(`${product.name} added to cart!`);
    };

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <p className="text-sm font-medium text-green-600 mb-1">{greeting()}</p>
                        <h1 className="text-2xl font-bold text-green-900">Welcome back, {user?.username}!</h1>
                        <p className="text-gray-500 text-sm mt-1">Browse fresh products from your local stores</p>
                    </div>
                    <Link to="/customer/cart">
                        <Button type="primary" size="large" className="rounded-xl font-semibold" icon={<ShoppingCart size={16} />}>
                            Cart ({totalItems})
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                    { label: "Total Orders", value: MOCK_ORDERS.length, icon: ShoppingBag, bg: "bg-green-100", color: "text-green-700" },
                    { label: "Delivered", value: MOCK_ORDERS.filter(o => o.status === "delivered").length, icon: Package, bg: "bg-emerald-100", color: "text-emerald-700" },
                    { label: "Pending", value: MOCK_ORDERS.filter(o => o.status !== "delivered").length, icon: Clock, bg: "bg-orange-100", color: "text-orange-700" },
                    { label: "In Cart", value: totalItems, icon: ShoppingCart, bg: "bg-blue-100", color: "text-blue-700" },
                ].map(({ label, value, icon: Icon, bg, color }) => (
                    <Card key={label} className="rounded-xl border-gray-200 shadow-sm" hoverable>
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${bg} ${color}`}>
                            <Icon size={18} />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{value}</div>
                        <div className="text-gray-400 text-xs mt-1">{label}</div>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Recent Orders */}
                <div className="lg:col-span-1">
                    <Card className="rounded-2xl border-gray-200 shadow-sm h-full" title={<span className="font-semibold text-green-900">Recent Orders</span>}>
                        <div className="space-y-3">
                            {MOCK_ORDERS.map(order => (
                                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <div>
                                        <div className="font-semibold text-gray-800 text-sm">Order #{order.id}</div>
                                        <div className="text-xs text-gray-400">{order.date} · {order.items} items</div>
                                    </div>
                                    <div className="text-right">
                                        <Tag color={statusColor[order.status]} className="rounded-lg text-xs">{order.status}</Tag>
                                        <div className="text-xs font-semibold text-gray-700 mt-1">₱{order.total}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Product Browse */}
                <div className="lg:col-span-2">
                    <Card className="rounded-2xl border-gray-200 shadow-sm" title={
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <span className="font-semibold text-green-900">Browse Products</span>
                            <Input placeholder="Search products..." prefix={<Search size={13} className="text-gray-400" />} value={search} onChange={e => setSearch(e.target.value)} allowClear className="w-52 rounded-xl" size="small" />
                        </div>
                    }>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {loading ? (
                                <div className="text-center text-gray-400 py-8">Loading products…</div>
                            ) : filtered.map(p => (
                                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center text-green-700">
                                            <Package size={16} />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-800 text-sm">{p.name}</div>
                                            <div className="text-xs text-gray-400">{p.category} · ⭐ {p.rating}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-green-700">₱{(p.variants?.[0]?.price || p.price || 0).toFixed(2)}</span>
                                        <Button type="primary" size="small" className="rounded-lg" onClick={() => handleAddToCart(p)} icon={<ShoppingCart size={12} />}>Add</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
