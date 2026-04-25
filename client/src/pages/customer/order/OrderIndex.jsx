import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button, Empty, Input, Pagination, Spin, Tag, App } from "antd"
import { useNavigate } from "react-router-dom"
import { Package, Search, Eye, X, Clock, CheckCircle, Truck, Store, ShoppingBag } from "lucide-react"
import * as orderService from "../../../services/orderService"

const statusConfig = {
    pending: { color: "orange", icon: Clock, label: "Order placed" },
    processing: { color: "blue", icon: Package, label: "Preparing" },
    shipped: { color: "cyan", icon: Truck, label: "Shipped out" },
    delivered: { color: "green", icon: CheckCircle, label: "Delivered" },
    cancelled: { color: "red", icon: X, label: "Cancelled" },
}

const statusTabs = ["all", "pending", "processing", "shipped", "delivered", "cancelled"]

const formatMoney = (value) => `\u20b1${Number(value || 0).toFixed(2)}`
const getStoreName = (store) => store?.store_name || store?.name || "Unknown Seller"

export default function OrderIndex() {
    const navigate = useNavigate()
    const { message } = App.useApp()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(0)
    const [counts, setCounts] = useState({})
    const [search, setSearch] = useState("")
    const [activeStatus, setActiveStatus] = useState("all")
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
    const searchTimer = useRef(null)

    const fetchOrders = useCallback(async (page = 1, pageSize = 10, status = activeStatus) => {
        setLoading(true)
        try {
            const data = await orderService.getOrders({
                page,
                per_page: pageSize,
                ...(status !== "all" ? { status } : {}),
            })
            setOrders(data?.data || [])
            setTotal(data?.pagination?.total || 0)
            setCounts(data?.counts || {})
            setPagination({
                current: data?.pagination?.current_page || page,
                pageSize: data?.pagination?.per_page || pageSize,
            })
        } catch (err) {
            message.error(err.message || "Failed to fetch orders")
        } finally {
            setLoading(false)
        }
    }, [activeStatus, message])

    useEffect(() => {
        fetchOrders(1, pagination.pageSize, activeStatus)
        return () => clearTimeout(searchTimer.current)
    }, [activeStatus, fetchOrders, pagination.pageSize])

    const itemRows = useMemo(() => {
        const rows = orders.flatMap((order) =>
            (order.order_items || order.item_groups?.flatMap((group) => group.items || []) || []).map((item) => ({
                ...order,
                order_item: item,
            }))
        )
        const keyword = search.trim().toLowerCase()

        if (!keyword) return rows

        return rows.filter((order) => {
            const item = order.order_item
            const store = getStoreName(item?.store || item?.product?.store).toLowerCase()
            const product = (item?.product?.name || "").toLowerCase()

            return (
                String(order.id || "").toLowerCase().includes(keyword) ||
                item?.status?.includes(keyword) ||
                store.includes(keyword) ||
                product.includes(keyword)
            )
        })
    }, [orders, search])

    const totalItems = search.trim() ? itemRows.length : total

    const handleSearch = (value) => {
        clearTimeout(searchTimer.current)
        searchTimer.current = setTimeout(() => setSearch(value), 200)
    }

    const handlePageChange = (page, pageSize) => {
        fetchOrders(page, pageSize, activeStatus)
    }

    const handleStatusChange = (status) => {
        setActiveStatus(status)
        setPagination((prev) => ({
            ...prev,
            current: 1,
        }))
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 pb-24 md:pb-28">
                <div className="mb-6 bg-linear-to-br from-green-50 to-emerald-50 rounded-2xl p-3 md:p-4 border border-green-100">
                    <div className="flex items-start gap-3 md:gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                            <ShoppingBag size={20} className="text-green-700 md:w-6 md:h-6" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl md:text-2xl font-bold text-green-900">Your Orders</h1>
                            <p className="text-gray-500 text-xs md:text-sm">
                                {totalItems} order item{totalItems !== 1 ? "s" : ""}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mb-6 bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-5">
                    <div className="flex flex-col gap-4">
                        <Input
                            placeholder="Search by order, store, product, or status"
                            prefix={<Search size={16} className="text-gray-400" />}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="rounded-lg h-11"
                            size="large"
                        />

                        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
                            {statusTabs.map((status) => {
                                const isActive = activeStatus === status
                                const label = status === "all" ? "All" : statusConfig[status]?.label || status

                                return (
                                    <button
                                        key={status}
                                        type="button"
                                        onClick={() => handleStatusChange(status)}
                                        className={`flex w-full items-center justify-between gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                                            isActive
                                                ? "border-green-600 bg-green-600 text-white"
                                                : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 hover:bg-gray-100"
                                        }`}
                                    >
                                        <span className="truncate text-left">{label}</span>
                                        <span className={`rounded-full px-2 py-0.5 text-xs ${isActive ? "bg-white/15 text-white" : "bg-white text-gray-500"}`}>
                                            {counts[status] || 0}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="min-h-64 flex items-center justify-center">
                        <Spin size="large" />
                    </div>
                ) : orders.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-100 p-10">
                        <div className="text-center">
                            <div className="w-20 h-20 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                                <Package size={36} className="text-green-600" />
                            </div>
                            <h2 className="text-xl font-bold text-green-900 mb-2">No orders yet</h2>
                            <p className="text-gray-500 text-sm mb-6">Start shopping to create your first order.</p>
                            <Button type="primary" size="large" className="rounded-lg font-semibold" onClick={() => navigate("/")}>
                                Continue Shopping
                            </Button>
                        </div>
                    </div>
                ) : itemRows.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-100 p-10">
                        <Empty description={activeStatus === "all" ? "No product orders found" : `No ${statusConfig[activeStatus]?.label?.toLowerCase() || activeStatus} items found`} />
                    </div>
                ) : (
                    <div className="space-y-5">
                        {itemRows.map((order) => {
                            const item = order.order_item
                            const statusInfo = statusConfig[item?.status] || statusConfig.pending
                            const StatusIcon = statusInfo.icon
                            const store = item?.store || item?.product?.store
                            const itemTotal = item?.item_total ?? ((Number(item?.price || 0) * Number(item?.quantity || 0)) + Number(item?.shipping_cost || 0))

                            return (
                                <div key={`${order.id}-${item?.id}`} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="p-4 md:p-5 border-b border-gray-100 bg-gray-50/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-start gap-3 min-w-0 flex-1">
                                            <div className="w-11 h-11 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                                                <ShoppingBag size={20} className="text-green-700" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex flex-col items-start gap-2">
                                                    <h2 className="font-bold text-gray-950">Checkout #{String(order.id || "").slice(0, 8)}</h2>
                                                    <Tag color={statusInfo.color} className="w-fit">
                                                        <span className="inline-flex items-center gap-1 whitespace-nowrap">
                                                            <StatusIcon size={14} />
                                                            <span>{statusInfo.label}</span>
                                                        </span>
                                                    </Tag>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">{new Date(order.created_at).toLocaleString()} | Qty {item?.quantity || 0}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 md:shrink-0">
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500">Item total</p>
                                                <p className="text-xl font-bold text-green-700">{formatMoney(itemTotal)}</p>
                                            </div>
                                            <Button
                                                type="primary"
                                                icon={<Eye size={16} />}
                                                onClick={() => navigate(`/customer/orders/items/${order?.checkout_no || order?.id}`)}
                                                className="rounded-lg"
                                            >
                                                Details
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="p-4 md:p-5">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center overflow-hidden shrink-0 border border-green-100">
                                                {store?.banner ? (
                                                    <img
                                                        src={`/${store.banner}`}
                                                        alt={getStoreName(store)}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Store size={18} className="text-green-700" />
                                                )}
                                            </div>
                                            <p className="font-semibold text-gray-900 truncate">{getStoreName(store)}</p>
                                        </div>

                                        <div className="flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-100 p-3">
                                            <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                                                {item?.product?.images?.length ? (
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
                                                <p className="text-sm font-semibold text-gray-900 truncate">{item?.product?.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    Price {formatMoney(item?.price)} | Shipping {formatMoney(item?.shipping_cost)}
                                                </p>
                                                {item?.variant?.name && (
                                                    <p className="text-xs text-gray-500 mt-1">Variant: {item.variant.name}</p>
                                                )}
                                            </div>
                                        </div>
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
                        onChange={handlePageChange}
                    />
                </div>
            </div>
        </div>
    )
}
