import React from "react";
import { Button, InputNumber, Empty, App } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { ShoppingCart, Trash2, ArrowLeft, Package, ShoppingBag } from "lucide-react";

export default function CartPage() {
    const { items, removeItem, updateQty, clearCart, totalItems, totalPrice } = useCart();
    const { message } = App.useApp();
    const navigate = useNavigate();

    const handleCheckout = () => {
        message.success("Order placed! (Mock) Thank you for shopping at SukiCart.");
        clearCart();
        navigate("/customer/dashboard");
    };

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="text-center">
                    <div className="w-20 h-20 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                        <ShoppingCart size={36} className="text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-green-900 mb-2">Your cart is empty</h2>
                    <p className="text-gray-500 text-sm mb-6">Add some products to get started.</p>
                    <Link to="/customer/dashboard">
                        <Button type="primary" size="large" className="rounded-xl font-semibold" icon={<ShoppingBag size={16} />}>
                            Browse Products
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-colors cursor-pointer">
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-green-900">Your Cart</h1>
                        <p className="text-gray-500 text-sm">{totalItems} item{totalItems !== 1 ? "s" : ""}</p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Items */}
                    <div className="lg:col-span-2 space-y-3">
                        {items.map(item => (
                            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center flex-shrink-0">
                                    <Package size={22} className="text-green-700" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-800 text-sm truncate">{item.name}</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">{item.category}</p>
                                    <p className="text-green-700 font-bold text-sm mt-1">₱{item.price.toFixed(2)}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer">
                                        <Trash2 size={15} />
                                    </button>
                                    <InputNumber
                                        min={1}
                                        max={item.stock}
                                        value={item.qty}
                                        onChange={v => updateQty(item.id, v)}
                                        size="small"
                                        className="w-20"
                                    />
                                    <span className="text-xs font-semibold text-gray-600">₱{(item.price * item.qty).toFixed(2)}</span>
                                </div>
                            </div>
                        ))}

                        <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1.5 mt-2 cursor-pointer bg-transparent border-none">
                            <Trash2 size={14} /> Clear cart
                        </button>
                    </div>

                    {/* Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-6">
                            <h2 className="font-bold text-green-900 text-lg mb-4">Order Summary</h2>
                            <div className="space-y-2 mb-4">
                                {items.map(item => (
                                    <div key={item.id} className="flex justify-between text-sm text-gray-600">
                                        <span className="truncate max-w-[65%]">{item.name} ×{item.qty}</span>
                                        <span className="font-medium">₱{(item.price * item.qty).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-gray-100 pt-3 mb-4">
                                <div className="flex justify-between text-sm text-gray-500 mb-1">
                                    <span>Subtotal</span>
                                    <span>₱{totalPrice.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-500 mb-1">
                                    <span>Delivery</span>
                                    <span className="text-green-600 font-medium">Free</span>
                                </div>
                                <div className="flex justify-between font-bold text-green-900 text-base mt-2">
                                    <span>Total</span>
                                    <span>₱{totalPrice.toFixed(2)}</span>
                                </div>
                            </div>
                            <Button type="primary" size="large" block className="h-12 rounded-xl font-semibold" onClick={handleCheckout}>
                                Place Order
                            </Button>
                            <Link to="/customer/dashboard">
                                <Button size="large" block className="h-10 rounded-xl font-semibold mt-2">
                                    Continue Shopping
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
