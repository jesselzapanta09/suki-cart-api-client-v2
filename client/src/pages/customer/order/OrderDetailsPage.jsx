import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Button, Empty, App, Modal, Input, Spin, Tag } from "antd"
import { ArrowLeft, Clock, CheckCircle, Truck, X, AlertCircle, Package, Store, ShoppingBag, MapPin } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"
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
const canCancelOrder = (order) => ["pending", "processing"].includes(order?.status)
const canCancelItem = (order, item) => canCancelOrder(order) && item?.status !== "cancelled"

export default function OrderDetailsPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { message } = App.useApp()

    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [cancelTarget, setCancelTarget] = useState(null)
    const [cancellationReason, setCancellationReason] = useState("")
    const [cancellationLoading, setCancellationLoading] = useState(false)

    const fetchOrderDetails = useCallback(async () => {
        setLoading(true)
        try {
            const data = await orderService.getOrder(id)
            setOrder(data?.data)
        } catch (err) {
            message.error(err.message || "Failed to fetch order details")
        } finally {
            setLoading(false)
        }
    }, [id, message])

    useEffect(() => {
        fetchOrderDetails()
    }, [fetchOrderDetails])

    const itemGroups = useMemo(() => order?.item_groups || [], [order])

    const closeCancelModal = () => {
        setCancelTarget(null)
        setCancellationReason("")
    }

    const handleCancel = async () => {
        if (!cancellationReason.trim()) {
            message.warning("Please provide a cancellation reason")
            return
        }

        setCancellationLoading(true)
        try {
            if (cancelTarget?.type === "item") {
                const data = await orderService.cancelOrderItem(order.id, cancelTarget.item.id, cancellationReason)
                setOrder(data?.data)
                message.success("Item cancelled and totals recalculated")
            } else {
                const data = await orderService.cancelOrder(order.id, cancellationReason)
                setOrder(data?.data)
                message.success("Order cancelled successfully")
            }

            closeCancelModal()
        } catch (err) {
            message.error(err.message || "Failed to cancel")
        } finally {
            setCancellationLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Spin size="large" />
            </div>
        )
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="text-center">
                    <Empty description="Order not found" />
                    <Button type="primary" size="large" onClick={() => navigate("/customer/orders")} className="mt-4">
                        Back to Orders
                    </Button>
                </div>
            </div>
        )
    }

    const statusInfo = statusConfig[order.status] || statusConfig.pending
    const StatusIcon = statusInfo.icon || AlertCircle

    return (
        <div className="min-h-screen bg-gray-50 py-6 md:py-8">
            <div className="max-w-6xl mx-auto px-4">
                <div className="mb-6 flex items-center gap-3">
                    <button
                        onClick={() => navigate("/customer/orders")}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={20} className="text-gray-700" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Order #{order.id}</h1>
                        <p className="text-sm text-gray-500 mt-1">{new Date(order.created_at).toLocaleString()}</p>
                    </div>
                    <Tag color={statusInfo.color} className="flex items-center gap-1 w-fit">
                        <StatusIcon size={14} />
                        {statusInfo.label}
                    </Tag>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                    <div className="space-y-5">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 ring-1 ring-blue-100 flex items-center justify-center shrink-0">
                                    <MapPin size={20} className="text-blue-700" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Delivery Information</h2>
                                    <p className="text-sm text-gray-700 mt-2">
                                        {order.location?.barangay}, {order.location?.city_municipality}, {order.location?.province}
                                    </p>
                                    {order.address_extra && (
                                        <p className="text-sm text-gray-500 mt-1">{order.address_extra}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {itemGroups.map((group, index) => (
                                <div key={group.store?.id || index} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="p-4 md:p-5 border-b border-gray-100 bg-gray-50/70 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                                                <Store size={20} className="text-green-700" />
                                            </div>
                                            <div className="min-w-0">
                                                <h2 className="font-bold text-green-950 truncate">{getStoreName(group.store)}</h2>
                                                <p className="text-xs text-gray-500">{group.items?.length || 0} item(s)</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500">Active subtotal</p>
                                            <p className="font-bold text-green-700">{formatMoney(group.subtotal)}</p>
                                        </div>
                                    </div>

                                    <div className="divide-y divide-gray-100">
                                        {(group.items || []).map(item => (
                                            <div key={item.id} className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-[80px_1fr_auto] gap-4">
                                                <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
                                                    {item.product?.images?.length ? (
                                                        <img
                                                            src={item.product.images[0].full_url || item.product.images[0].image_path}
                                                            alt={item.product.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <Package size={28} className="text-gray-400" />
                                                    )}
                                                </div>

                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="font-semibold text-gray-900 truncate">{item.product?.name}</h3>
                                                        {item.status === "cancelled" && <Tag color="red">Cancelled</Tag>}
                                                    </div>
                                                    {item.variant && <p className="text-xs text-gray-500 mt-1">{item.variant.name}</p>}
                                                    <p className="text-sm text-gray-600 mt-2">
                                                        {formatMoney(item.price)} x {item.quantity}
                                                    </p>
                                                    {item.cancellation_reason && (
                                                        <p className="text-xs text-red-600 mt-2">Reason: {item.cancellation_reason}</p>
                                                    )}
                                                </div>

                                                <div className="flex md:flex-col items-center md:items-end justify-between gap-3">
                                                    <p className={`font-bold ${item.status === "cancelled" ? "text-gray-400 line-through" : "text-gray-900"}`}>
                                                        {formatMoney(Number(item.price || 0) * item.quantity)}
                                                    </p>
                                                    {canCancelItem(order, item) && (
                                                        <Button
                                                            danger
                                                            size="small"
                                                            icon={<X size={14} />}
                                                            onClick={() => setCancelTarget({ type: "item", item })}
                                                        >
                                                            Cancel Item
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {order.message && (
                            <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5">
                                <h3 className="font-semibold text-gray-900 mb-2">Message</h3>
                                <p className="text-sm text-gray-800">{order.message}</p>
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-4">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-xl bg-green-50 ring-1 ring-green-100 flex items-center justify-center shrink-0">
                                    <ShoppingBag size={20} className="text-green-700" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Order Summary</h3>
                                    <p className="text-xs text-gray-500">
                                        {order.active_items_count || 0} active · {order.cancelled_items_count || 0} cancelled
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-medium text-gray-800">{formatMoney(order.price)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Shipping</span>
                                    <span className="font-medium text-gray-800">{formatMoney(order.shipping_cost)}</span>
                                </div>
                                <div className="border-t border-gray-200 pt-3 flex justify-between">
                                    <span className="font-bold text-gray-900">Total</span>
                                    <span className="text-2xl font-bold text-green-600">{formatMoney(order.total_price)}</span>
                                </div>
                            </div>

                            {order.cancelled_by && (
                                <div className="rounded-xl bg-red-50 border border-red-100 p-3 mb-4 text-sm">
                                    <p className="font-semibold text-red-800">Cancellation Details</p>
                                    <p className="text-red-700 capitalize">By: {order.cancelled_by}</p>
                                    {order.cancellation_reason && <p className="text-red-700">Reason: {order.cancellation_reason}</p>}
                                </div>
                            )}

                            <div className="space-y-2">
                                {canCancelOrder(order) && (
                                    <Button danger block onClick={() => setCancelTarget({ type: "order" })}>
                                        Cancel Entire Order
                                    </Button>
                                )}
                                <Button block onClick={() => navigate("/customer/orders")}>
                                    Back to Orders
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                title={cancelTarget?.type === "item" ? "Cancel Item" : "Cancel Entire Order"}
                open={Boolean(cancelTarget)}
                onCancel={closeCancelModal}
                onOk={handleCancel}
                okText={cancelTarget?.type === "item" ? "Cancel Item" : "Cancel Order"}
                okButtonProps={{ danger: true, loading: cancellationLoading }}
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        {cancelTarget?.type === "item"
                            ? `Please provide a reason for cancelling ${cancelTarget.item?.product?.name || "this item"}.`
                            : "Please provide a reason for cancelling the entire order."}
                    </p>
                    <Input.TextArea
                        placeholder="Enter cancellation reason..."
                        value={cancellationReason}
                        onChange={(e) => setCancellationReason(e.target.value)}
                        rows={4}
                        maxLength={1000}
                    />
                </div>
            </Modal>
        </div>
    )
}
