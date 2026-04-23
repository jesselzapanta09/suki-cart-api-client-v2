import React, { useEffect, useState, useCallback, useRef } from "react"
import { Table, Button, Tag, Input, Tooltip, App, Empty, Popconfirm, Modal } from "antd"
import { useNavigate } from "react-router-dom"
import { Package, Search, Eye, X, Clock, CheckCircle, Truck, AlertCircle } from "lucide-react"
import * as orderService from "../../../services/orderService"

const statusConfig = {
    pending: { color: "orange", icon: Clock, label: "Pending" },
    processing: { color: "blue", icon: Truck, label: "Processing" },
    shipped: { color: "cyan", icon: Truck, label: "Shipped" },
    delivered: { color: "green", icon: CheckCircle, label: "Delivered" },
    cancelled: { color: "red", icon: X, label: "Cancelled" },
}

export default function OrderIndex() {
    const { message } = App.useApp()
    const navigate = useNavigate()

    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(false)
    const [total, setTotal] = useState(0)
    const [search, setSearch] = useState("")
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
    const [statusFilter, setStatusFilter] = useState(null)
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [detailsVisible, setDetailsVisible] = useState(false)
    const [cancelModalVisible, setCancelModalVisible] = useState(false)
    const [cancellationReason, setCancellationReason] = useState("")

    const searchTimer = useRef(null)

    const fetchOrders = useCallback(async (page, pageSize, status) => {
        setLoading(true)
        try {
            const data = await orderService.getOrders({
                page,
                per_page: pageSize,
                status: status ?? undefined,
            })
            setOrders(data?.data || [])
            setTotal(data?.pagination?.total || 0)
            setPagination((prev) => ({
                ...prev,
                current: data?.pagination?.current_page || 1,
                pageSize: data?.pagination?.per_page || 10,
            }))
        } catch (err) {
            message.error(err.message || "Failed to fetch orders")
        } finally {
            setLoading(false)
        }
    }, [message])

    useEffect(() => {
        fetchOrders(pagination.current, pagination.pageSize, statusFilter)
        return () => clearTimeout(searchTimer.current)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleTableChange = (nextPagination, filters) => {
        const nextStatus = filters.status?.[0] ?? null
        const page = nextStatus !== statusFilter ? 1 : nextPagination.current

        setStatusFilter(nextStatus)
        setPagination((prev) => ({ ...prev, current: page, pageSize: nextPagination.pageSize }))
        fetchOrders(page, nextPagination.pageSize, nextStatus)
    }

    const handleSearch = (value) => {
        setSearch(value)
        clearTimeout(searchTimer.current)
        searchTimer.current = setTimeout(() => {
            setPagination((prev) => ({ ...prev, current: 1 }))
            // Add search filtering if needed
        }, 300)
    }

    const handleViewDetails = async (order) => {
        try {
            const data = await orderService.getOrder(order.id)
            setSelectedOrder(data?.data)
            setDetailsVisible(true)
        } catch (err) {
            message.error("Failed to fetch order details")
        }
    }

    const handleCancelOrder = async () => {
        if (!selectedOrder || !cancellationReason.trim()) {
            message.warning("Please provide a cancellation reason")
            return
        }

        try {
            await orderService.updateOrder(selectedOrder.id, {
                status: "cancelled",
                cancelled_by: "customer",
                cancellation_reason: cancellationReason,
            })
            message.success("Order cancelled successfully")
            setCancelModalVisible(false)
            setCancellationReason("")
            setDetailsVisible(false)
            fetchOrders(pagination.current, pagination.pageSize, statusFilter)
        } catch (err) {
            message.error(err.message || "Failed to cancel order")
        }
    }

    const columns = [
        {
            title: "Order ID",
            dataIndex: "id",
            key: "id",
            width: 80,
            render: (id) => <span className="font-semibold text-gray-900">#{id}</span>,
        },
        {
            title: "Date",
            dataIndex: "created_at",
            key: "created_at",
            width: 120,
            render: (date) => new Date(date).toLocaleDateString(),
        },
        {
            title: "Total Price",
            dataIndex: "total_price",
            key: "total_price",
            width: 120,
            render: (price) => <span className="font-semibold text-green-600">₱{parseFloat(price).toFixed(2)}</span>,
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 130,
            filters: Object.entries(statusConfig).map(([key, { label }]) => ({
                text: label,
                value: key,
            })),
            filterMultiple: false,
            render: (status) => {
                const config = statusConfig[status]
                const Icon = config.icon
                return (
                    <Tag color={config.color} className="flex items-center gap-1 w-fit">
                        <Icon size={14} />
                        {config.label}
                    </Tag>
                )
            },
        },
        {
            title: "Items",
            dataIndex: "items",
            key: "items",
            width: 80,
            render: (items) => <span>{items?.length || 0} item(s)</span>,
        },
        {
            title: "Actions",
            key: "actions",
            width: 150,
            render: (_, record) => (
                <div className="flex gap-2">
                    <Tooltip title="View Details">
                        <Button
                            type="primary"
                            size="small"
                            icon={<Eye size={16} />}
                            onClick={() => handleViewDetails(record)}
                            className="rounded-lg"
                        />
                    </Tooltip>
                    {record.status === "pending" && (
                        <Tooltip title="Cancel Order">
                            <Button
                                danger
                                size="small"
                                icon={<X size={16} />}
                                onClick={() => {
                                    setSelectedOrder(record)
                                    setCancelModalVisible(true)
                                }}
                                className="rounded-lg"
                            />
                        </Tooltip>
                    )}
                </div>
            ),
        },
    ]

    if (orders.length === 0 && !loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="text-center">
                    <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
                        <Package size={36} className="text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-blue-900 mb-2">No orders yet</h2>
                    <p className="text-gray-500 text-sm mb-6">Start shopping to create your first order.</p>
                    <Button type="primary" size="large" className="rounded-xl font-semibold">
                        Continue Shopping
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 md:p-6 border border-blue-100">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-blue-900 mb-1">My Orders</h1>
                            <p className="text-gray-600 text-sm">Track and manage your orders</p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-blue-900">{total}</div>
                            <p className="text-gray-600 text-xs">Total Orders</p>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <Input
                        placeholder="Search orders..."
                        prefix={<Search size={16} className="text-gray-400" />}
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="rounded-xl h-10"
                        size="large"
                    />
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <Table
                        columns={columns}
                        dataSource={orders}
                        loading={loading}
                        rowKey="id"
                        pagination={{
                            total,
                            pageSize: pagination.pageSize,
                            current: pagination.current,
                            onChange: (page) => {
                                setPagination((prev) => ({ ...prev, current: page }))
                            },
                            showSizeChanger: true,
                            pageSizeOptions: ["10", "20", "50"],
                            showTotal: (total) => `Total ${total} orders`,
                        }}
                        onChange={handleTableChange}
                        locale={{ emptyText: <Empty description="No orders found" /> }}
                    />
                </div>
            </div>

            {/* Order Details Modal */}
            <Modal
                title="Order Details"
                open={detailsVisible}
                onCancel={() => {
                    setDetailsVisible(false)
                    setSelectedOrder(null)
                }}
                footer={null}
                width={700}
                className="rounded-2xl"
            >
                {selectedOrder && (
                    <div className="space-y-6">
                        {/* Order Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-gray-600 text-xs font-semibold mb-1">Order ID</p>
                                <p className="text-gray-900 font-bold">#{selectedOrder.id}</p>
                            </div>
                            <div>
                                <p className="text-gray-600 text-xs font-semibold mb-1">Status</p>
                                <div>
                                    {(() => {
                                        const config = statusConfig[selectedOrder.status]
                                        const Icon = config.icon
                                        return (
                                            <Tag color={config.color} className="flex items-center gap-1 w-fit">
                                                <Icon size={14} />
                                                {config.label}
                                            </Tag>
                                        )
                                    })()}
                                </div>
                            </div>
                            <div>
                                <p className="text-gray-600 text-xs font-semibold mb-1">Order Date</p>
                                <p className="text-gray-900">{new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-gray-600 text-xs font-semibold mb-1">Total Price</p>
                                <p className="text-green-600 font-bold">₱{parseFloat(selectedOrder.total_price).toFixed(2)}</p>
                            </div>
                        </div>

                        {/* Address */}
                        <div>
                            <p className="text-gray-600 text-xs font-semibold mb-2">Delivery Address</p>
                            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                                <p>
                                    {selectedOrder.location?.barangay}, {selectedOrder.location?.city_municipality}
                                </p>
                                <p>
                                    {selectedOrder.location?.province}, {selectedOrder.location?.region}
                                </p>
                                {selectedOrder.address_extra && <p className="mt-1 text-gray-600">{selectedOrder.address_extra}</p>}
                            </div>
                        </div>

                        {/* Message */}
                        {selectedOrder.message && (
                            <div>
                                <p className="text-gray-600 text-xs font-semibold mb-2">Message</p>
                                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">{selectedOrder.message}</div>
                            </div>
                        )}

                        {/* Cancellation Info */}
                        {selectedOrder.status === "cancelled" && (
                            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                                <p className="text-gray-600 text-xs font-semibold mb-1">Cancellation Reason</p>
                                <p className="text-red-700 text-sm">{selectedOrder.cancellation_reason}</p>
                            </div>
                        )}

                        {/* Order Items */}
                        <div>
                            <p className="text-gray-600 text-xs font-semibold mb-3">Items</p>
                            <div className="space-y-3">
                                {selectedOrder.items?.map((item) => (
                                    <div key={item.id} className="flex gap-3 bg-gray-50 rounded-lg p-3">
                                        <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                                            {item.product?.images?.[0] ? (
                                                <img
                                                    src={item.product.images[0].full_url || item.product.images[0].image_path}
                                                    alt={item.product.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <Package size={24} className="text-gray-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-gray-900 text-sm truncate">{item.product?.name}</h4>
                                            {item.variant && (
                                                <p className="text-gray-600 text-xs">
                                                    {Object.entries(item.variant?.attributes || {}).map(([k, v]) => `${k}: ${v}`).join(", ")}
                                                </p>
                                            )}
                                            <p className="text-gray-600 text-xs mt-1">Qty: {item.quantity}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900">₱{parseFloat(item.price).toFixed(2)}</p>
                                            <p className="text-gray-600 text-xs">x{item.quantity}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        {selectedOrder.status === "pending" && (
                            <Button
                                danger
                                block
                                onClick={() => setCancelModalVisible(true)}
                                icon={<X size={16} />}
                            >
                                Cancel Order
                            </Button>
                        )}
                    </div>
                )}
            </Modal>

            {/* Cancel Reason Modal */}
            <Modal
                title="Cancel Order"
                open={cancelModalVisible}
                onCancel={() => setCancelModalVisible(false)}
                onOk={handleCancelOrder}
                okText="Cancel Order"
                okButtonProps={{ danger: true }}
                width={500}
            >
                <div className="space-y-4">
                    <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                        <div className="flex gap-2">
                            <AlertCircle size={18} className="text-orange-600 shrink-0 mt-0.5" />
                            <p className="text-sm text-orange-700">
                                This action cannot be undone. The product stock will be restored.
                            </p>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Reason for cancellation</label>
                        <textarea
                            value={cancellationReason}
                            onChange={(e) => setCancellationReason(e.target.value)}
                            placeholder="Please tell us why you want to cancel this order..."
                            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={4}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    )
}

