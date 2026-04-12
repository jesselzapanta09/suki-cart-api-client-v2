import React, { useState, useEffect } from "react"
import { Skeleton, Card } from "antd"
import { Link } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { ShoppingBag, DollarSign, Package, ChevronRight, User, Tag } from "lucide-react"
import { MOCK_PRODUCTS } from "../../services/mockData"

// TODO: Replace MOCK_PRODUCTS with API call: getProducts() -> res.data.data
export default function AdminDashboard() {
    const { user } = useAuth()
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setTimeout(() => {
            setProducts(MOCK_PRODUCTS)
            setLoading(false)
        }, 500)
    }, [])

    const total = products.length
    const avgPrice = total ? (products.reduce((s, p) => s + p.price, 0) / total).toFixed(2) : "0.00"
    const maxPrice = total ? Math.max(...products.map(p => p.price)).toFixed(2) : "0.00"
    const categories = new Set(products.map(p => p.category)).size

    const stats = [
        { label: "Total Products", value: total, icon: <Package className="w-5 h-5" />, color: "text-green-800", bg: "bg-green-100" },
        { label: "Avg. Price", value: `₱${avgPrice}`, icon: <DollarSign className="w-5 h-5" />, color: "text-emerald-700", bg: "bg-emerald-100" },
        { label: "Highest Price", value: `₱${maxPrice}`, icon: <DollarSign className="w-5 h-5" />, color: "text-orange-700", bg: "bg-orange-100" },
        { label: "Categories", value: categories, icon: <Tag className="w-5 h-5" />, color: "text-purple-700", bg: "bg-purple-100" },
    ]

    return (
        <div className="max-w-6xl mx-auto p-6">
            {/* Header Card */}
            <div className="mb-6 from-green-50 to-emerald-50 rounded-2xl p-6 shadow-sm border border-green-100">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-green-600 mb-1">
                            {new Date().getHours() < 12 ? "☀️ Good Morning" : new Date().getHours() < 18 ? "🌤️ Good Afternoon" : "🌙 Good Evening"}
                        </p>
                        <h1 className="text-3xl font-bold text-green-900 mb-2">Welcome back, {user?.firstname}</h1>
                        <p className="text-gray-600 flex items-center gap-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                {user?.role || "Administrator"}
                            </span>
                            <span className="text-sm text-gray-500">
                                • {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                            </span>
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-bold text-green-900">
                            {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Current Time</p>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-green-200">
                    <p className="text-sm text-gray-600">Here's an overview of your product catalog.</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                {stats.map(s => (
                    <Card key={s.label} hoverable className="rounded-xl shadow-sm border-gray-200">
                        <div className={`w-11 h-11 rounded-lg flex items-center justify-center mb-3 ${s.bg} ${s.color}`}>{s.icon}</div>
                        <div className="text-xl font-bold text-gray-900">
                            {loading ? <Skeleton.Input active size="small" style={{ width: 60 }} /> : s.value}
                        </div>
                        <div className="text-gray-400 text-sm mt-1">{s.label}</div>
                    </Card>
                ))}
            </div>

            {/* Quick Actions & Recent */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mb-6">
                <Card className="rounded-xl shadow-sm border-gray-200">
                    <h2 className="text-lg font-semibold text-green-900 mb-4">Quick Actions</h2>
                    <div className="flex flex-col gap-2">
                        <Link to="/admin/users" className="flex items-center justify-between px-4 py-2 rounded-lg bg-linear-to-br from-green-800 to-green-600 text-white font-medium text-sm">
                            <span className="flex items-center gap-2"><User className="w-5 h-5" /> Manage Users</span>
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                        <Link to="/admin/trains" className="flex items-center justify-between px-4 py-2 rounded-lg bg-linear-to-br from-green-800 to-green-600 text-white font-medium text-sm">
                            <span className="flex items-center gap-2"><ShoppingBag className="w-5 h-5" /> Manage Products</span>
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </Card>

                <Card className="rounded-xl shadow-sm border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-green-900">Recently Added</h2>
                        <Link to="/admin/trains" className="text-green-600 text-xs font-semibold">View all</Link>
                    </div>
                    {loading ? (
                        <Skeleton active paragraph={{ rows: 3 }} />
                    ) : products.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-4">No products yet.</p>
                    ) : (
                        products.slice(0, 4).map(p => (
                            <div key={p.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                                <div>
                                    <div className="text-sm font-medium text-gray-900">{p.name}</div>
                                    <div className="text-xs text-gray-400 mt-0.5">{p.category}</div>
                                </div>
                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-md font-mono text-xs font-semibold">
                                    ₱{parseFloat(p.price).toFixed(2)}
                                </span>
                            </div>
                        ))
                    )}
                </Card>
            </div>
        </div>
    )
}
