import React, { useState, useEffect, useMemo } from "react";
import { Button, Select, Input, Empty, App, Form } from "antd";
import { MapPin, MessageSquare, ShoppingBag, ShoppingCart, Package } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../../../context/CartContext";
import { useAuth } from "../../../context/AuthContext";
import * as orderService from "../../../services/orderService";

export default function CheckoutPage() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { clearCart } = useCart();
    const { user } = useAuth();
    const { message } = App.useApp();
    const [form] = Form.useForm();

    const [selectedLocation, setSelectedLocation] = useState(null);
    const [addressExtra, setAddressExtra] = useState("");
    const [orderMessage, setOrderMessage] = useState("");
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [locations, setLocations] = useState([]);

    // Get items from location state
    const items = useMemo(() => state?.items || [], [state?.items]);
    const totalItems = items.length;
    const checkedTotal = state?.total || 0;

    useEffect(() => {
        if (items.length === 0) {
            navigate("/customer/cart");
            return;
        }
        
        if (user?.locations) {
            setLocations(user.locations);
        }
    }, [user, items, navigate]);

    const getPrice = (item) => {
        const price = item.price ?? item.variant?.price ?? 0;
        return typeof price === 'number' ? price : Number(price || 0);
    };

    const getVariantAttributes = (variant) => {
        if (!variant?.attributes || typeof variant.attributes !== "object") {
            return [];
        }

        return Object.entries(variant.attributes).filter(([, value]) => value !== null && value !== "");
    };

    const handlePlaceOrder = async () => {
        if (!selectedLocation) {
            message.warning("Please select a delivery location");
            return;
        }

        if (items.length === 0) {
            message.warning("No items to order");
            return;
        }

        setCheckoutLoading(true);
        try {
            const orderData = {
                location_id: selectedLocation,
                address_extra: addressExtra || null,
                message: orderMessage || null,
                items: items.map(item => ({
                    product_id: item.id,
                    product_variant_id: item.variant_id || null,
                    quantity: item.qty,
                })),
            };

            const response = await orderService.createOrder(orderData);

            if (response?.data?.id) {
                message.success("Order placed successfully!");
                clearCart();
                
                // Redirect to order details
                setTimeout(() => {
                    navigate(`/customer/orders/${response.data.id}`);
                }, 500);
            }
        } catch (err) {
            message.error(err.message || "Failed to place order");
        } finally {
            setCheckoutLoading(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="text-center">
                    <Empty description="No items in checkout" />
                    <Button 
                        type="primary" 
                        size="large" 
                        onClick={() => navigate("/customer/cart")}
                        className="mt-4"
                    >
                        Back to Cart
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-5">
                {/* Header */}
                <div className="mb-6 bg-linear-to-br from-green-50 to-emerald-50 rounded-2xl p-3 md:p-4 border border-green-100">
                    <div className="flex items-start gap-3 md:gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                            <ShoppingCart size={20} className="text-green-700 md:w-6 md:h-6" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl md:text-2xl font-bold text-green-900">Complete Order</h1>
                            <p className="text-gray-500 text-xs md:text-sm">{totalItems} item{totalItems !== 1 ? "s" : ""} ready for checkout</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-5">
                    {/* Order Summary */}
                    <div className="space-y-6">
                        {/* Delivery Information */}
                        <div className="rounded-2xl border border-gray-200 shadow-sm p-6 bg-white space-y-5">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 ring-1 ring-blue-100 flex items-center justify-center shrink-0">
                                    <MapPin size={20} className="text-blue-700" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Delivery Information</h2>
                                    <p className="text-sm text-gray-400 mt-1">Select where you want your order delivered.</p>
                                </div>
                            </div>

                            <Form
                                form={form}
                                layout="vertical"
                                requiredMark={false}
                                size="large"
                            >
                                <Form.Item
                                    name="delivery_location"
                                    label="Delivery Location"
                                    rules={[{ required: true, message: "Delivery location is required" }]}
                                    initialValue={selectedLocation}
                                >
                                    <Select
                                        placeholder="Select delivery location"
                                        onChange={(value) => {
                                            setSelectedLocation(value);
                                            form.setFieldValue('delivery_location', value);
                                        }}
                                        options={locations.map(loc => ({
                                            value: loc.id,
                                            label: `${loc.barangay}, ${loc.city_municipality}, ${loc.province}`,
                                        }))}
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="address_extra"
                                    label="Additional Address Info"
                                    initialValue={addressExtra}
                                >
                                    <Input
                                        placeholder="Street/Landmark/House number (optional)"
                                        onChange={(e) => {
                                            setAddressExtra(e.target.value);
                                            form.setFieldValue('address_extra', e.target.value);
                                        }}
                                        maxLength={500}
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="message"
                                    label="Message for Seller (Optional)"
                                    initialValue={orderMessage}
                                >
                                    <Input.TextArea
                                        placeholder="Add a message or special instructions"
                                        onChange={(e) => {
                                            setOrderMessage(e.target.value);
                                            form.setFieldValue('message', e.target.value);
                                        }}
                                        maxLength={1000}
                                        rows={3}
                                    />
                                </Form.Item>
                            </Form>
                        </div>

                        {/* Order Items Review */}
                        <div className="rounded-2xl border border-gray-200 shadow-sm p-6 bg-white space-y-5">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 ring-1 ring-purple-100 flex items-center justify-center shrink-0">
                                    <ShoppingCart size={20} className="text-purple-700" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Order Items</h2>
                                    <p className="text-sm text-gray-400 mt-1">Review the items in your order.</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {items.map((item, index) => {
                                    const attributes = getVariantAttributes(item.variant);

                                    return (
                                        <div key={item.uuid || `${item.id}-${index}`} className="bg-gray-50 rounded-xl border border-gray-100 p-4 md:p-5">
                                            <div className="flex flex-col md:flex-row gap-6">
                                                <div className="w-full md:w-40 h-40 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                                                    {item.images && item.images.length > 0 ? (
                                                        <img
                                                            src={item.images[0].full_url || item.images[0].image_path}
                                                            alt={item.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                                                            <Package size={28} />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 text-sm">
                                                    <div>
                                                        <p className="text-gray-500 text-xs uppercase tracking-wide">Product</p>
                                                        <p className="font-semibold text-gray-900">{item.name}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 text-xs uppercase tracking-wide">Category</p>
                                                        <p className="font-medium text-gray-700">{item.category || "Uncategorized"}</p>
                                                    </div>

                                                    <div>
                                                        <p className="text-gray-500 text-xs uppercase tracking-wide">Seller</p>
                                                        <p className="font-medium text-gray-700">{item.store?.store_name || "Unknown Seller"}</p>
                                                    </div>

                                                    <div>
                                                        <p className="text-gray-500 text-xs uppercase tracking-wide">Variant</p>
                                                        <p className="font-medium text-gray-700">{item.variant?.name || "No variant selected"}</p>
                                                    </div>

                                                    <div>
                                                        <p className="text-gray-500 text-xs uppercase tracking-wide">Quantity</p>
                                                        <p className="font-medium text-gray-700">{item.qty}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 text-xs uppercase tracking-wide">Unit Price</p>
                                                        <p className="font-medium text-gray-700">₱{getPrice(item).toFixed(2)}</p>
                                                    </div>

                                                    <div className="md:col-span-2">
                                                        <p className="text-gray-500 text-xs uppercase tracking-wide">Description</p>
                                                        <p className="font-medium text-gray-700">{item.description || "No description available"}</p>
                                                    </div>

                                                    {attributes.length > 0 && (
                                                        <div className="md:col-span-2">
                                                            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Variant Attributes</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {attributes.map(([key, value]) => (
                                                                    <span key={`${key}-${value}`} className="px-2.5 py-1 rounded-full text-xs bg-white border border-gray-200 text-gray-700">
                                                                        {key}: {String(value)}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="rounded-2xl border border-gray-200 shadow-sm p-6 bg-white space-y-5">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 ring-1 ring-blue-100 flex items-center justify-center shrink-0">
                                    <ShoppingBag size={20} className="text-blue-700" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Payment Method</h2>
                                    <p className="text-sm text-gray-400 mt-1">Choose how you want to pay for your order.</p>
                                </div>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 flex items-center gap-4">
                                <div className="shrink-0">
                                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100">
                                        <ShoppingBag size={20} className="text-blue-600" />
                                    </div>
                                </div>
                                <div className="grow">
                                    <p className="font-semibold text-gray-900">Cash on Delivery (COD)</p>
                                    <p className="text-sm text-gray-600">Pay when your order arrives</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Total and Action */}
                    <div className="rounded-2xl border border-gray-200 shadow-sm p-6 bg-white space-y-5">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-50 ring-1 ring-green-100 flex items-center justify-center shrink-0">
                                <ShoppingBag size={20} className="text-green-700" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Total Amount</h2>
                                <p className="text-sm text-gray-400 mt-1">Complete your purchase.</p>
                            </div>
                        </div>

                        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                            <p className="text-sm text-gray-700 mb-2 font-medium">Total Amount</p>
                            <p className="text-3xl font-bold text-green-600">₱{checkedTotal.toFixed(2)}</p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <Button
                                size="large"
                                className="flex-1"
                                onClick={() => navigate("/customer/cart")}
                            >
                                Back to Cart
                            </Button>
                            <Button
                                type="primary"
                                size="large"
                                className="flex-1"
                                loading={checkoutLoading}
                                disabled={!selectedLocation}
                                onClick={handlePlaceOrder}
                                icon={<ShoppingBag size={16} />}
                            >
                                Place Order
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
    );
}

