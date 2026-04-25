import React, { useCallback, useEffect, useMemo, useState } from "react"
import { App, Button, Empty, Form, Input, Modal, Select, Spin, Tag } from "antd"
import { ArrowLeft, CheckCircle, Clock, Package, Truck, User, X, MapPin, ShoppingBag } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"
import {
    cancelSellerOrderItem,
    getSellerOrder,
    updateSellerOrderStatus,
} from "../../../services/sellerService"

const statusConfig = {
    pending: { color: "orange", icon: Clock, label: "Order placed" },
    processing: { color: "blue", icon: Package, label: "Preparing to ship" },
    shipped: { color: "cyan", icon: Truck, label: "Shipped out" },
    delivered: { color: "green", icon: CheckCircle, label: "Delivered" },
    cancelled: { color: "red", icon: X, label: "Cancelled" },
}

const statusSteps = ["pending", "processing", "shipped", "delivered"]

const statusOptions = [
    { value: "pending", label: "Order placed" },
    { value: "processing", label: "Preparing to ship" },
    { value: "shipped", label: "Shipped out" },
    { value: "cancelled", label: "Cancel store order" },
]

const formatMoney = (value) => `₱${Number(value || 0).toFixed(2)}`
const customerName = (customer) => `${customer?.firstname || ""} ${customer?.lastname || ""}`.trim() || customer?.email || "Customer"
const canCancelItem = (item) => !["cancelled", "shipped", "delivered"].includes(item?.status)
const getCancelledByLabel = (cancelledBy) => ({
    customer: "Customer",
    seller: "Seller",
    admin: "Admin",
}[cancelledBy] || "Unknown")

export default function OrderDetailsPage() {
    const { checkoutNo } = useParams()
    const navigate = useNavigate()
    const { message } = App.useApp()
    const [form] = Form.useForm()

    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [savingStatus, setSavingStatus] = useState(false)
    const [cancelTarget, setCancelTarget] = useState(null)
    const [cancelReason, setCancelReason] = useState("")
    const [cancelLoading, setCancelLoading] = useState(false)

    const storeOrder = useMemo(() => order?.store_order || {}, [order])
    const selectedItem = useMemo(() => {
        const items = storeOrder.items || []
        return items[0] || null
    }, [storeOrder.items])
    const selectedStatus = Form.useWatch("status", form)

    const fetchOrder = useCallback(async () => {
        setLoading(true)
        try {
            const data = await getSellerOrder(checkoutNo)
            const nextOrder = data?.data
            setOrder(nextOrder)
            const nextItem = nextOrder?.store_order?.items?.[0]
            form.setFieldsValue({
                status: nextItem?.status || "pending",
                courier_name: nextItem?.courier_name || "",
                tracking_number: nextItem?.tracking_number || "",
                cancellation_reason: "",
            })
        } catch (err) {
            message.error(err.message || "Failed to fetch order")
        } finally {
            setLoading(false)
        }
    }, [checkoutNo, form, message])

    useEffect(() => {
        fetchOrder()
    }, [fetchOrder])

    const handleStatusSave = async () => {
        try {
            const values = await form.validateFields()
            setSavingStatus(true)
            const data = await updateSellerOrderStatus(selectedItem?.id, {
                ...values,
            })
            setOrder(data?.data)
            message.success("Order status updated")
        } catch (err) {
            if (!err?.errorFields) {
                message.error(err.message || "Failed to update order status")
            }
        } finally {
            setSavingStatus(false)
        }
    }

    const closeCancelModal = () => {
        setCancelTarget(null)
        setCancelReason("")
    }

    const handleCancelItem = async () => {
        if (!cancelReason.trim()) {
            message.warning("Please provide a cancellation reason")
            return
        }

        setCancelLoading(true)
        try {
            const data = await cancelSellerOrderItem(cancelTarget.id, cancelReason)
            setOrder(data?.data)
            message.success("Item cancelled")
            closeCancelModal()
        } catch (err) {
            message.error(err.message || "Failed to cancel item")
        } finally {
            setCancelLoading(false)
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
                    <Button type="primary" size="large" onClick={() => navigate("/seller/orders")} className="mt-4">
                        Back to Orders
                    </Button>
                </div>
            </div>
        )
    }

    const statusInfo = statusConfig[selectedItem?.status || storeOrder.status] || statusConfig.pending
    const currentStatus = selectedItem?.status || storeOrder.status
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
    const StatusIcon = statusInfo.icon

    return (
        <div className="min-h-screen bg-gray-50 py-6 md:py-8">
            <div className="max-w-6xl mx-auto px-4">
                <div className="mb-6 flex items-center gap-3">
                    <button
                        onClick={() => navigate("/seller/orders")}
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
                                            className={`hidden md:block absolute top-6 left-[calc(50%+2rem)] right-4 h-1 rounded-full ${item.index < currentStep ? "bg-green-400" : "bg-gray-200"
                                                }`}
                                        />
                                    )}

                                    <div
                                        className={`relative h-full rounded-2xl border p-4 transition-all ${item.isCurrent
                                                ? "border-blue-500 bg-blue-50 shadow-sm ring-2 ring-blue-100"
                                                : item.isCompleted
                                                    ? "border-green-200 bg-green-50"
                                                    : "border-gray-200 bg-gray-50"
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${item.isCurrent
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

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
                    <div className="space-y-5">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-green-50 ring-1 ring-green-100 flex items-center justify-center shrink-0">
                                        <User size={20} className="text-green-700" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">Customer</h2>
                                        <p className="text-sm font-semibold text-gray-800 mt-2">{customerName(order.customer)}</p>
                                        <p className="text-sm text-gray-500">{order.customer?.email}</p>
                                        <p className="text-sm text-gray-500">{order.customer?.contact_number}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 ring-1 ring-blue-100 flex items-center justify-center shrink-0">
                                        <MapPin size={20} className="text-blue-700" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">Delivery</h2>
                                        <p className="text-sm text-gray-700 mt-2">
                                            {order.location?.barangay}, {order.location?.city_municipality}, {order.location?.province}
                                        </p>
                                        {order.address_extra && <p className="text-sm text-gray-500 mt-1">{order.address_extra}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-4 md:p-5 border-b border-gray-100 bg-gray-50/70 flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="font-bold text-gray-950">Store Items</h2>
                                    <p className="text-xs text-gray-500">{storeOrder.active_items_count || 0} active · {storeOrder.cancelled_items_count || 0} cancelled</p>
                                </div>
                                <p className="text-xl font-bold text-green-700">{formatMoney(storeOrder.subtotal)}</p>
                            </div>

                            <div className="divide-y divide-gray-100">
                                {([selectedItem].filter(Boolean)).map(item => (
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
                                                <Tag color={statusConfig[item.status]?.color || "default"}>
                                                    {statusConfig[item.status]?.label || item.status}
                                                </Tag>
                                            </div>
                                            {item.variant && <p className="text-xs text-gray-500 mt-1">{item.variant.name}</p>}
                                            <p className="text-sm text-gray-600 mt-2">{formatMoney(item.price)} x {item.quantity}</p>
                                        </div>

                                        <div className="flex md:flex-col items-center md:items-end justify-between gap-3">
                                            <p className={`font-bold ${item.status === "cancelled" ? "text-gray-400 line-through" : "text-gray-900"}`}>
                                                {formatMoney(Number(item.price || 0) * item.quantity)}
                                            </p>
                                            {canCancelItem(item) && (
                                                <Button danger size="small" icon={<X size={14} />} onClick={() => setCancelTarget(item)}>
                                                    Cancel Item
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="space-y-5 sticky top-4">
                            {selectedItem?.status === "delivered" ? (
                                <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-5">
                                    <div className="flex items-start gap-3">
                                        <div className="w-11 h-11 rounded-2xl bg-green-100 flex items-center justify-center shrink-0">
                                            <CheckCircle size={22} className="text-green-700" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">Order Delivered</h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                This product order has already been delivered. No further seller action is needed.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : selectedItem?.status === "cancelled" ? (
                                <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5">
                                    <div className="flex items-start gap-3">
                                        <div className="w-11 h-11 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                                            <X size={22} className="text-red-700" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">Order Cancelled</h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                This product order has already been cancelled. No further seller action is needed.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-10 h-10 rounded-xl bg-green-50 ring-1 ring-green-100 flex items-center justify-center shrink-0">
                                            <ShoppingBag size={20} className="text-green-700" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">Seller Actions</h3>
                                            <p className="text-xs text-gray-500">Update this product order only.</p>
                                        </div>
                                    </div>

                                    <Form form={form} size="large" layout="vertical" requiredMark={false}>
                                        <Form.Item name="status" label="Status" rules={[{ required: true, message: "Status is required" }]}>
                                            <Select options={statusOptions} />
                                        </Form.Item>

                                        {selectedStatus === "shipped" && (
                                            <>
                                                <Form.Item name="courier_name" label="Courier Name" rules={[{ required: true, message: "Courier name is required" }]}>
                                                    <Input placeholder="e.g. LBC, J&T, Flash Express" />
                                                </Form.Item>
                                                <Form.Item name="tracking_number" label="Tracking Number" rules={[{ required: true, message: "Tracking number is required" }]}>
                                                    <Input placeholder="Tracking number" />
                                                </Form.Item>
                                            </>
                                        )}

                                        {selectedStatus === "cancelled" && (
                                            <Form.Item name="cancellation_reason" label="Cancellation Reason" rules={[{ required: true, message: "Cancellation reason is required" }]}>
                                                <Input.TextArea rows={3} maxLength={1000} placeholder="Why is this store order being cancelled?" />
                                            </Form.Item>
                                        )}

                                        <Button type="primary" block loading={savingStatus} disabled={!selectedItem} onClick={handleStatusSave}>
                                            Save Status
                                        </Button>
                                    </Form>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>

            <Modal
                title="Cancel Item"
                open={Boolean(cancelTarget)}
                onCancel={closeCancelModal}
                onOk={handleCancelItem}
                okText="Cancel Item"
                okButtonProps={{ danger: true, loading: cancelLoading }}
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Please provide a reason for cancelling {cancelTarget?.product?.name || "this item"}.
                    </p>
                    <Input.TextArea
                        placeholder="Enter cancellation reason..."
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        rows={4}
                        maxLength={1000}
                    />
                </div>
            </Modal>
        </div>
    )
}
