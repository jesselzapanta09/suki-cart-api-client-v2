import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button, Empty, Input, Pagination, Spin, Tag, App } from "antd"
import { useNavigate } from "react-router-dom"
import { Package, Search, Eye, X, Clock, CheckCircle, Truck, Store, ShoppingBag } from "lucide-react"
import * as orderService from "../../../services/orderService"

const statusConfig = {
    pending: { color: "orange", icon: Clock, label: "Order placed" },
    processing: { color: "blue", icon: Package, label: "Preparing to ship" },
    shipped: { color: "cyan", icon: Truck, label: "Shipped out" },
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

    const itemRows = useMemo(() => {
        const rows = orders.flatMap(order =>
            (order.order_items || order.item_groups?.flatMap(group => group.items || []) || []).map(item => ({
                ...order,
                order_item: item,
            }))
        )
        const keyword = search.trim().toLowerCase()

        if (!keyword) return rows

        return rows.filter(order => {
            const item = order.order_item
            const store = getStoreName(item?.store || item?.product?.store).toLowerCase()
            const product = (item?.product?.name || "").toLowerCase()

            return String(order.id || "").toLowerCase().includes(keyword) || item?.status?.includes(keyword) || store.includes(keyword) || product.includes(keyword)
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
                <div className="mb-6 bg-linear-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 md:p-6 border border-blue-100">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-blue-900 mb-1">My Product Orders</h1>
                            <p className="text-gray-600 text-sm">Each product has its own status and actions.</p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-blue-900">{itemRows.length}</div>
                            <p className="text-gray-600 text-xs">Visible Items</p>
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
                ) : itemRows.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-10">
                        <Empty description="No product orders found" />
                    </div>
                ) : (
                    <div className="space-y-5">
                        {itemRows.map(order => {
                            const item = order.order_item
                            const statusInfo = statusConfig[item?.status] || statusConfig.pending
                            const StatusIcon = statusInfo.icon
                            const store = item?.store || item?.product?.store
                            const itemTotal = item?.item_total ?? ((Number(item?.price || 0) * Number(item?.quantity || 0)) + Number(item?.shipping_cost || 0))

                            return (
                                <div key={`${order.id}-${item?.id}`} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="p-4 md:p-5 border-b border-gray-100 bg-gray-50/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-start gap-3 min-w-0">
                                            <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                                                <ShoppingBag size={20} className="text-blue-700" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h2 className="font-bold text-gray-950">Checkout #{String(order.id || "").slice(0, 8)}</h2>
                                                    <Tag color={statusInfo.color} className="flex items-center gap-1 w-fit">
                                                        <StatusIcon size={14} />
                                                        {statusInfo.label}
                                                    </Tag>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">{new Date(order.created_at).toLocaleString()} · Qty {item?.quantity || 0}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500">Item total</p>
                                                <p className="text-xl font-bold text-green-700">{formatMoney(itemTotal)}</p>
                                            </div>
                                            <Button
                                                type="primary"
                                                icon={<Eye size={16} />}
                                                onClick={() => navigate(`/customer/orders/items/${item?.id}`)}
                                                className="rounded-lg"
                                            >
                                                Details
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="p-4 md:p-5">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                                                <Store size={18} className="text-green-700" />
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
                                                    Price {formatMoney(item?.price)} · Shipping {formatMoney(item?.shipping_cost)}
                                                </p>
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
                        showSizeChanger
                        pageSizeOptions={["10", "20", "50"]}
                        onChange={handlePageChange}
                    />
                </div>
            </div>
        </div>
    )
}
