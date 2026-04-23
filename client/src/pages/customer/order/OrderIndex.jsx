import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button, Empty, Input, Pagination, Spin, Tag, App } from "antd"
import { useNavigate } from "react-router-dom"
import { Package, Search, Eye, X, Clock, CheckCircle, Truck, Store, ShoppingBag } from "lucide-react"
import * as orderService from "../../../services/orderService"

const statusConfig = {
    pending: { color: "orange", icon: Clock, label: "Pending" },
    processing: { color: "blue", icon: Truck, label: "Processing" },
    shipped: { color: "cyan", icon: Truck, label: "Shipped" },
    delivered: { color: "green", icon: CheckCircle, label: "Delivered" },
    cancelled: { color: "red", icon: X, label: "Cancelled" },
}

const formatMoney = (value) => `₱${Number(value || 0).toFixed(2)}`
const getStoreName = (store) => store?.store_name || store?.name || "Unknown Seller"

export default function OrderIndex() {
    const navigate = useNavigate()
    const { message } = App.useApp()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(false)
    const [total, setTotal] = useState(0)
    const [search, setSearch] = useState("")
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
    const searchTimer = useRef(null)

    const fetchOrders = useCallback(async (page = 1, pageSize = 10) => {
        setLoading(true)
        try {
            const data = await orderService.getOrders({ page, per_page: pageSize })
            setOrders(data?.data || [])
            setTotal(data?.pagination?.total || 0)
            setPagination({
                current: data?.pagination?.current_page || page,
                pageSize: data?.pagination?.per_page || pageSize,
            })
        } catch (err) {
            message.error(err.message || "Failed to fetch orders")
        } finally {
            setLoading(false)
        }
    }, [message])

    useEffect(() => {
        fetchOrders(1, pagination.pageSize)
        return () => clearTimeout(searchTimer.current)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const filteredOrders = useMemo(() => {
        const keyword = search.trim().toLowerCase()

        if (!keyword) {
            return orders
        }

        return orders.filter(order => {
            const stores = (order.item_groups || [])
                .map(group => getStoreName(group.store))
                .join(" ")
                .toLowerCase()

            const products = (order.items || [])
                .map(item => item.product?.name || "")
                .join(" ")
                .toLowerCase()

            return `#${order.id}`.includes(keyword) || order.status?.includes(keyword) || stores.includes(keyword) || products.includes(keyword)
        })
    }, [orders, search])

    const handleSearch = (value) => {
        clearTimeout(searchTimer.current)
        searchTimer.current = setTimeout(() => setSearch(value), 200)
    }

    const handlePageChange = (page, pageSize) => {
        fetchOrders(page, pageSize)
    }

    if (!loading && orders.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="text-center">
                    <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
                        <Package size={36} className="text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-blue-900 mb-2">No orders yet</h2>
                    <p className="text-gray-500 text-sm mb-6">Start shopping to create your first order.</p>
                    <Button type="primary" size="large" className="rounded-xl font-semibold" onClick={() => navigate("/")}>
                        Continue Shopping
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 md:p-6 border border-blue-100">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-blue-900 mb-1">My Orders</h1>
                            <p className="text-gray-600 text-sm">Track orders grouped by seller.</p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-blue-900">{total}</div>
                            <p className="text-gray-600 text-xs">Total Orders</p>
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <Input
                        placeholder="Search by order, store, product, or status"
                        prefix={<Search size={16} className="text-gray-400" />}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="rounded-xl h-10"
                        size="large"
                    />
                </div>

                {loading ? (
                    <div className="min-h-64 flex items-center justify-center">
                        <Spin size="large" />
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-10">
                        <Empty description="No orders found" />
                    </div>
                ) : (
                    <div className="space-y-5">
                        {filteredOrders.map(order => {
                            const statusInfo = statusConfig[order.status] || statusConfig.pending
                            const StatusIcon = statusInfo.icon

                            return (
                                <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="p-4 md:p-5 border-b border-gray-100 bg-gray-50/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                                                <ShoppingBag size={20} className="text-blue-700" />
                                            </div>
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h2 className="font-bold text-gray-950">Order #{order.id}</h2>
                                                    <Tag color={statusInfo.color} className="flex items-center gap-1 w-fit">
                                                        <StatusIcon size={14} />
                                                        {statusInfo.label}
                                                    </Tag>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {new Date(order.created_at).toLocaleString()} · {order.active_items_count ?? order.items?.length ?? 0} active item(s)
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500">Total Amount</p>
                                                <p className="text-xl font-bold text-green-700">{formatMoney(order.total_price)}</p>
                                            </div>
                                            <Button
                                                type="primary"
                                                icon={<Eye size={16} />}
                                                onClick={() => navigate(`/customer/orders/${order.id}`)}
                                                className="rounded-lg"
                                            >
                                                Details
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="divide-y divide-gray-100">
                                        {(order.item_groups || []).map((group, index) => (
                                            <div key={group.store?.id || index} className="p-4 md:p-5">
                                                <div className="flex items-center justify-between gap-3 mb-3">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                                                            <Store size={18} className="text-green-700" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-gray-900 truncate">{getStoreName(group.store)}</p>
                                                            <p className="text-xs text-gray-500">{group.items?.length || 0} item(s)</p>
                                                        </div>
                                                    </div>
                                                    <p className="font-bold text-green-700">{formatMoney(group.subtotal)}</p>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {(group.items || []).slice(0, 4).map(item => (
                                                        <div key={item.id} className="flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-100 p-3">
                                                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                                                                {item.product?.images?.length ? (
                                                                    <img
                                                                        src={item.product.images[0].full_url || item.product.images[0].image_path}
                                                                        alt={item.product.name}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <Package size={20} className="text-gray-400" />
                                                                )}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm font-semibold text-gray-900 truncate">{item.product?.name}</p>
                                                                <p className="text-xs text-gray-500">
                                                                    Qty {item.quantity} · {formatMoney(item.price)}
                                                                </p>
                                                            </div>
                                                            {item.status === "cancelled" && <Tag color="red">Cancelled</Tag>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                <div className="mt-6 flex justify-end">
                    <Pagination
                        current={pagination.current}
                        pageSize={pagination.pageSize}
                        total={total}
                        showSizeChanger
                        pageSizeOptions={["10", "20", "50"]}
                        onChange={handlePageChange}
                    />
                </div>
            </div>
        </div>
    )
}
