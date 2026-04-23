import React, { useEffect, useState } from "react";
import { Card, Button, Tag, Spin, Empty, App, Modal, Input } from "antd";
import { ArrowLeft, Clock, CheckCircle, Truck, X, AlertCircle, Package } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import * as orderService from "../../../services/orderService";

const statusConfig = {
    pending: { color: "orange", icon: Clock, label: "Pending" },
    processing: { color: "blue", icon: Truck, label: "Processing" },
    shipped: { color: "cyan", icon: Truck, label: "Shipped" },
    delivered: { color: "green", icon: CheckCircle, label: "Delivered" },
    cancelled: { color: "red", icon: X, label: "Cancelled" },
};

export default function OrderDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { message } = App.useApp();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cancelModalVisible, setCancelModalVisible] = useState(false);
    const [cancellationReason, setCancellationReason] = useState("");
    const [cancellationLoading, setCancellationLoading] = useState(false);

    useEffect(() => {
        fetchOrderDetails();
    }, [id]);

    const fetchOrderDetails = async () => {
        setLoading(true);
        try {
            const data = await orderService.getOrder(id);
            setOrder(data?.data);
        } catch (err) {
            message.error(err.message || "Failed to fetch order details");
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!cancellationReason.trim()) {
            message.warning("Please provide a cancellation reason");
            return;
        }

        setCancellationLoading(true);
        try {
            await orderService.updateOrder(order.id, {
                status: "cancelled",
                cancelled_by: "customer",
                cancellation_reason: cancellationReason,
            });
            message.success("Order cancelled successfully");
            setCancelModalVisible(false);
            setCancellationReason("");
            fetchOrderDetails();
        } catch (err) {
            message.error(err.message || "Failed to cancel order");
        } finally {
            setCancellationLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Spin size="large" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="text-center">
                    <Empty description="Order not found" />
                    <Button 
                        type="primary" 
                        size="large" 
                        onClick={() => navigate("/customer/orders")}
                        className="mt-4"
                    >
                        Back to Orders
                    </Button>
                </div>
            </div>
        );
    }

    const statusInfo = statusConfig[order.status];
    const StatusIcon = statusInfo?.icon || AlertCircle;

    const canCancel = order.status === "pending" || order.status === "processing";

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8 flex items-center gap-3">
                    <button 
                        onClick={() => navigate("/customer/orders")}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={20} className="text-gray-700" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
                        <p className="text-sm text-gray-500 mt-1">Order #{order.id}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Status Card */}
                        <Card className="rounded-xl shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                                        <StatusIcon size={24} className={`text-${statusInfo?.color}-600`} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 font-medium">Order Status</p>
                                        <p className="text-lg font-bold text-gray-900 capitalize">{order.status}</p>
                                    </div>
                                </div>
                                <Tag color={statusInfo?.color}>{statusInfo?.label}</Tag>
                            </div>
                        </Card>

                        {/* Delivery Information */}
                        <Card className="rounded-xl shadow-sm">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Delivery Information</h2>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs text-gray-500 font-medium uppercase">Location</p>
                                    <p className="text-sm text-gray-800 font-medium">
                                        {order.location?.barangay}, {order.location?.city_municipality}, {order.location?.province}
                                    </p>
                                </div>
                                {order.address_extra && (
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium uppercase">Additional Address</p>
                                        <p className="text-sm text-gray-800">{order.address_extra}</p>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Order Items */}
                        <Card className="rounded-xl shadow-sm">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Order Items</h2>
                            <div className="space-y-3">
                                {order.items?.map((item) => (
                                    <div key={item.id} className="flex gap-4 pb-3 border-b border-gray-200 last:border-b-0">
                                        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                                            {item.product?.images && item.product.images.length > 0 ? (
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
                                            <p className="font-semibold text-gray-800 truncate">{item.product?.name}</p>
                                            {item.variant && (
                                                <p className="text-xs text-gray-500">{item.variant?.name}</p>
                                            )}
                                            <p className="text-sm text-gray-600 mt-1">
                                                ₱{parseFloat(item.price).toFixed(2)} x {item.quantity}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900">
                                                ₱{(parseFloat(item.price) * item.quantity).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Order Message */}
                        {order.message && (
                            <Card className="rounded-xl shadow-sm bg-blue-50 border-blue-200">
                                <h3 className="font-semibold text-gray-900 mb-2">Message</h3>
                                <p className="text-sm text-gray-800">{order.message}</p>
                            </Card>
                        )}

                        {/* Cancellation Info */}
                        {order.cancelled_by && (
                            <Card className="rounded-xl shadow-sm bg-red-50 border-red-200">
                                <h3 className="font-semibold text-gray-900 mb-2">Cancellation Details</h3>
                                <div className="space-y-2 text-sm">
                                    <p><span className="text-gray-600">Cancelled By:</span> <span className="font-medium capitalize text-gray-800">{order.cancelled_by}</span></p>
                                    {order.cancellation_reason && (
                                        <p><span className="text-gray-600">Reason:</span> <span className="text-gray-800">{order.cancellation_reason}</span></p>
                                    )}
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <Card className="rounded-xl shadow-sm sticky top-4">
                            <h3 className="font-bold text-gray-900 mb-4">Order Summary</h3>
                            
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-medium text-gray-800">
                                        ₱{order.items?.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0).toFixed(2) || "0.00"}
                                    </span>
                                </div>
                                {order.shipping_cost !== undefined && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Shipping</span>
                                        <span className="font-medium text-gray-800">₱{parseFloat(order.shipping_cost).toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="border-t border-gray-200 pt-3 flex justify-between">
                                    <span className="font-bold text-gray-900">Total</span>
                                    <span className="text-2xl font-bold text-green-600">₱{parseFloat(order.total_price).toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="space-y-2 text-xs text-gray-500 mb-6">
                                <p>Order placed on {new Date(order.created_at).toLocaleDateString()}</p>
                                <p>at {new Date(order.created_at).toLocaleTimeString()}</p>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-2">
                                {canCancel && (
                                    <Button
                                        danger
                                        block
                                        onClick={() => setCancelModalVisible(true)}
                                    >
                                        Cancel Order
                                    </Button>
                                )}
                                <Button
                                    block
                                    onClick={() => navigate("/customer/orders")}
                                >
                                    Back to Orders
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Cancel Order Modal */}
            <Modal
                title="Cancel Order"
                open={cancelModalVisible}
                onCancel={() => {
                    setCancelModalVisible(false);
                    setCancellationReason("");
                }}
                onOk={handleCancelOrder}
                okText="Cancel Order"
                okButtonProps={{ danger: true, loading: cancellationLoading }}
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Please provide a reason for cancelling this order:
                    </p>
                    <Input.TextArea
                        placeholder="Enter cancellation reason..."
                        value={cancellationReason}
                        onChange={(e) => setCancellationReason(e.target.value)}
                        rows={4}
                        maxLength={500}
                    />
                </div>
            </Modal>
        </div>
    );
}
