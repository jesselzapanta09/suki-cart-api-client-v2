import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Button, Empty, App, Modal, Input, Spin, Tag } from "antd"
import { ArrowLeft, Clock, CheckCircle, Truck, X, Package, Store, ShoppingBag, MapPin } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"
import * as orderService from "../../../services/orderService"

const statusConfig = {
    pending: { color: "orange", icon: Clock, label: "Order placed" },
    processing: { color: "blue", icon: Package, label: "Preparing to ship" },
    shipped: { color: "cyan", icon: Truck, label: "Shipped out" },
    delivered: { color: "green", icon: CheckCircle, label: "Delivered" },
    cancelled: { color: "red", icon: X, label: "Cancelled" },
}

const statusSteps = ["pending", "processing", "shipped", "delivered"]

const formatMoney = (value) => `₱${Number(value || 0).toFixed(2)}`
const getStoreName = (store) => store?.store_name || store?.name || "Unknown Seller"
const canCancelItem = (item) => ["pending", "processing"].includes(item?.status)
const getCancelledByLabel = (cancelledBy) => ({
    customer: "Customer",
    seller: "Seller",
    admin: "Admin",
}[cancelledBy] || "Unknown")

export default function OrderDetailsPage() {
    const { checkoutNo } = useParams()
    const navigate = useNavigate()
    const { message } = App.useApp()

    const [order, setOrder] = useState(null)
    const [selectedItem, setSelectedItem] = useState(null)
    const [loading, setLoading] = useState(true)
    const [cancelTarget, setCancelTarget] = useState(null)
    const [cancellationReason, setCancellationReason] = useState("")
    const [cancellationLoading, setCancellationLoading] = useState(false)
    const [deliveryLoading, setDeliveryLoading] = useState(false)

    const fetchOrderDetails = useCallback(async () => {
        setLoading(true)
        try {
            const data = await orderService.getOrder(checkoutNo)
            setOrder(data?.data?.group || null)
            setSelectedItem(data?.data?.item || null)
        } catch (err) {
            message.error(err.message || "Failed to fetch order details")
        } finally {
            setLoading(false)
        }
    }, [checkoutNo, message])

    useEffect(() => {
        fetchOrderDetails()
    }, [fetchOrderDetails])

    const rawItemGroups = useMemo(() => order?.item_groups || [], [order])
    const itemGroups = useMemo(() => {
        if (!selectedItem) return []
        return rawItemGroups
            .map(group => ({ ...group, items: (group.items || []).filter(item => item.id === selectedItem.id) }))
            .filter(group => group.items.length > 0)
    }, [rawItemGroups, selectedItem])

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
            const data = await orderService.cancelOrderItem(cancelTarget.item.id, cancellationReason)
            setOrder(data?.data?.group || null)
            setSelectedItem(data?.data?.item || null)
            message.success("Item cancelled and totals recalculated")

            closeCancelModal()
        } catch (err) {
            message.error(err.message || "Failed to cancel")
        } finally {
            setCancellationLoading(false)
        }
    }

    const handleMarkDelivered = async () => {
        setDeliveryLoading(true)
        try {
            const data = await orderService.markOrderItemDelivered(selectedItem.id)
            setOrder(data?.data?.group || null)
            setSelectedItem(data?.data?.item || null)
            message.success("Product marked as delivered")
        } catch (err) {
            message.error(err.message || "Failed to mark product delivered")
        } finally {
            setDeliveryLoading(false)
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

    const currentStatus = selectedItem?.status || order.status
    const currentStep = currentStatus === "cancelled" ? 0 : Math.max(statusSteps.indexOf(currentStatus), 0)
    const timelineItems = statusSteps.map((status, index) => {
        const isCompleted = index < currentStep
        const isCurrent = status === currentStatus
        const isUpcoming = index > currentStep
        const Icon = statusConfig[status].icon

        return {
            status,
            index,
            isCompleted,
            isCurrent,
            isUpcoming,
            Icon,
            label: statusConfig[status].label,
        }
    })

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
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Order #{String(order.id || "").slice(0, 8)}</h1>
                        <p className="text-sm text-gray-500 mt-1">{new Date(order.created_at).toLocaleString()}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
                    <div className="flex items-start justify-between gap-4 mb-5">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Product Timeline</h2>
                        </div>
                        {selectedItem?.status === "shipped" && (
                            <Button
                                type="primary"
                                icon={<CheckCircle size={16} />}
                                loading={deliveryLoading}
                                onClick={handleMarkDelivered}
                            >
                                Received Product
                            </Button>
                        )}
                    </div>
                    {selectedItem?.status === "cancelled" ? (
                        <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-700">
                            <p>This product order was cancelled by {getCancelledByLabel(selectedItem?.cancelled_by)}.</p>
                            {selectedItem?.cancellation_reason && (
                                <p className="mt-2 text-xs text-red-600">Reason: {selectedItem.cancellation_reason}</p>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
                            {timelineItems.map((item) => (
                                <div key={item.status} className="relative">
                                    {item.index < timelineItems.length - 1 && (
                                        <div
                                            className={`hidden md:block absolute top-6 left-[calc(50%+2rem)] right-[-1rem] h-1 rounded-full ${
                                                item.index < currentStep ? "bg-green-400" : "bg-gray-200"
                                            }`}
                                        />
                                    )}

                                    <div
                                        className={`relative h-full rounded-2xl border p-4 transition-all ${
                                            item.isCurrent
                                                ? "border-blue-500 bg-blue-50 shadow-sm ring-2 ring-blue-100"
                                                : item.isCompleted
                                                    ? "border-green-200 bg-green-50"
                                                    : "border-gray-200 bg-gray-50"
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                                                    item.isCurrent
                                                        ? "bg-blue-600 text-white"
                                                        : item.isCompleted
                                                            ? "bg-green-600 text-white"
                                                            : "bg-white text-gray-400 border border-gray-200"
                                                }`}
                                            >
                                                <item.Icon size={20} />
                                            </div>

                                            <div className="min-w-0 flex flex-col items-start gap-2">
                                                <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                                                {item.isCurrent && (
                                                    <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                                                        Current
                                                    </span>
                                                )}
                                                {item.isCompleted && (
                                                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                                                        Done
                                                    </span>
                                                )}
                                                {item.isUpcoming && (
                                                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-600">
                                                        Next
                                                    </span>
                                                )}
                                                <p className="text-xs text-gray-500">
                                                    Step {item.index + 1} of {timelineItems.length}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
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
                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                    <p className="text-xs text-gray-500">{group.items?.length || 0} item(s)</p>
                                                    <Tag color={statusConfig[group.status]?.color || "default"} className="m-0">
                                                        {statusConfig[group.status]?.label || group.status}
                                                    </Tag>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500">Active subtotal</p>
                                            <p className="font-bold text-green-700">{formatMoney(group.subtotal)}</p>
                                        </div>
                                    </div>

                                    {(group.shipment?.courier_name || group.items?.[0]?.courier_name) && (
                                        <div className="mx-4 md:mx-5 mt-4 rounded-xl bg-cyan-50 border border-cyan-100 p-3 text-sm text-cyan-800">
                                            <p><span className="font-semibold">Courier:</span> {group.shipment?.courier_name || group.items?.[0]?.courier_name}</p>
                                            {(group.shipment?.tracking_number || group.items?.[0]?.tracking_number) && (
                                                <p><span className="font-semibold">Tracking Number:</span> {group.shipment?.tracking_number || group.items?.[0]?.tracking_number}</p>
                                            )}
                                        </div>
                                    )}

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
                                                    </div>
                                                    {item.variant && <p className="text-xs text-gray-500 mt-1">{item.variant.name}</p>}
                                                    <p className="text-sm text-gray-600 mt-2">
                                                        {formatMoney(item.price)} x {item.quantity}
                                                    </p>
                                                </div>

                                                <div className="flex md:flex-col items-center md:items-end justify-between gap-3">
                                                    <p className={`font-bold ${item.status === "cancelled" ? "text-gray-400 line-through" : "text-gray-900"}`}>
                                                        {formatMoney(Number(item.price || 0) * item.quantity)}
                                                    </p>
                                                    {canCancelItem(item) && (
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
                                <h3 className="font-bold text-gray-900">Receipt Summary</h3>
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

                            <div className="space-y-2">
                                <Button block size="large" onClick={() => navigate("/customer/orders")}>
                                    Back to Orders
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                title="Cancel Product Order"
                open={Boolean(cancelTarget)}
                onCancel={closeCancelModal}
                onOk={handleCancel}
                okText="Cancel Order"
                okButtonProps={{ danger: true, loading: cancellationLoading }}
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Please provide a reason for cancelling {cancelTarget?.item?.product?.name || "this item"}.
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
