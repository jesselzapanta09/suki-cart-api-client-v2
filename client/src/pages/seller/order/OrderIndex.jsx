import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { App, Button, Empty, Input, Pagination, Select, Spin, Tag } from "antd"
import { useNavigate } from "react-router-dom"
import { CheckCircle, Clock, Eye, Package, Search, ShoppingBag, Truck, User, X } from "lucide-react"
import { getSellerOrders } from "../../../services/sellerService"

const statusConfig = {
    pending: { color: "orange", icon: Clock, label: "Order placed" },
    processing: { color: "blue", icon: Package, label: "Preparing to ship" },
    shipped: { color: "cyan", icon: Truck, label: "Shipped out" },
    delivered: { color: "green", icon: CheckCircle, label: "Delivered" },
    cancelled: { color: "red", icon: X, label: "Cancelled" },
}

const formatMoney = (value) => `₱${Number(value || 0).toFixed(2)}`
const customerName = (customer) => `${customer?.firstname || ""} ${customer?.lastname || ""}`.trim() || customer?.email || "Customer"

export default function OrderIndex() {
    const navigate = useNavigate()
    const { message } = App.useApp()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(false)
    const [total, setTotal] = useState(0)
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState(null)
    const searchTimer = useRef(null)

    const fetchOrders = useCallback(async (page = 1, pageSize = 10, status = statusFilter) => {
        setLoading(true)
        try {
            const data = await getSellerOrders({
                page,
                per_page: pageSize,
                status: status || undefined,
            })
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
    }, [message, statusFilter])

    useEffect(() => {
        fetchOrders(1, pagination.pageSize, statusFilter)
        return () => clearTimeout(searchTimer.current)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const filteredOrders = useMemo(() => {
        const keyword = search.trim().toLowerCase()

        if (!keyword) {
            return orders
        }

        return orders.filter(order => {
            const customer = customerName(order.customer).toLowerCase()
            const products = (order.store_order?.items || [])
                .map(item => item.product?.name || "")
                .join(" ")
                .toLowerCase()

            return `#${order.id}`.includes(keyword) || customer.includes(keyword) || products.includes(keyword)
        })
    }, [orders, search])

    const handleSearch = (value) => {
        clearTimeout(searchTimer.current)
        searchTimer.current = setTimeout(() => setSearch(value), 200)
    }

    const handleStatusFilter = (status) => {
        const nextStatus = status || null
        setStatusFilter(nextStatus)
        fetchOrders(1, pagination.pageSize, nextStatus)
    }

    const handlePageChange = (page, pageSize) => {
        fetchOrders(page, pageSize, statusFilter)
    }

    if (!loading && orders.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="text-center">
                    <div className="w-20 h-20 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                        <ShoppingBag size={36} className="text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-green-900 mb-2">No store orders yet</h2>
                    <p className="text-gray-500 text-sm">New customer orders for your store will appear here.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 md:p-6 border border-green-100">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-green-900 mb-1">Store Orders</h1>
                            <p className="text-gray-600 text-sm">Manage customer orders for your store.</p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-green-900">{total}</div>
                            <p className="text-gray-600 text-xs">Total Orders</p>
                        </div>
                    </div>
                </div>

                <div className="mb-6 grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3">
                    <Input
                        placeholder="Search by order, customer, or product"
                        prefix={<Search size={16} className="text-gray-400" />}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="rounded-xl h-10"
                        size="large"
                    />
                    <Select
                        allowClear
                        placeholder="Filter status"
                        value={statusFilter}
                        onChange={handleStatusFilter}
                        size="large"
                        options={Object.entries(statusConfig).map(([value, config]) => ({
                            value,
                            label: config.label,
                        }))}
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
                            const storeOrder = order.store_order || {}
                            const statusInfo = statusConfig[storeOrder.status] || statusConfig.pending
                            const StatusIcon = statusInfo.icon

                            return (
                                <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="p-4 md:p-5 border-b border-gray-100 bg-gray-50/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                                                <User size={20} className="text-green-700" />
                                            </div>
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h2 className="font-bold text-gray-950">Order #{order.id}</h2>
                                                    <Tag color={statusInfo.color} className="flex items-center gap-1 w-fit">
                                                        <StatusIcon size={14} />
                                                        {statusInfo.label}
                                                    </Tag>
                                                </div>
                                                <p className="text-sm font-semibold text-gray-800 mt-1">{customerName(order.customer)}</p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(order.created_at).toLocaleString()} · {storeOrder.active_items_count || 0} active item(s)
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500">Store subtotal</p>
                                                <p className="text-xl font-bold text-green-700">{formatMoney(storeOrder.subtotal)}</p>
                                            </div>
                                            <Button
                                                type="primary"
                                                icon={<Eye size={16} />}
                                                onClick={() => navigate(`/seller/orders/${order.id}`)}
                                                className="rounded-lg"
                                            >
                                                Details
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 md:p-5">
                                        {(storeOrder.items || []).slice(0, 4).map(item => (
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
                                                    <p className="text-xs text-gray-500">Qty {item.quantity} · {formatMoney(item.price)}</p>
                                                </div>
                                                {item.status === "cancelled" && <Tag color="red">Cancelled</Tag>}
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
