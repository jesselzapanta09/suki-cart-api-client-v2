import React, { useState } from "react";
import { Button, InputNumber, Empty, App, Checkbox, Tooltip, Popconfirm } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Trash2, ArrowLeft, Package, ShoppingBag } from "lucide-react";
import { useCart } from "../../../context/CartContext";

export default function CartPage() {
    const { items, removeItem, updateQty, clearCart, totalItems } = useCart();
    const { message } = App.useApp();
    const navigate = useNavigate();
    const [checkedItems, setCheckedItems] = useState({});

    const getPrice = (item) => {
        const price = item.price ?? item.variant?.price ?? 0;
        return typeof price === 'number' ? price : Number(price || 0);
    };

    const handleRemoveItem = async (uuid, itemName) => {
        try {
            await removeItem(uuid);
            message.success(`${itemName} removed from cart`);
        } catch (error) {
            console.error("Error removing item:", error);
        }
    };

    const handleCheckout = () => {
        message.success("Order placed! (Mock) Thank you for shopping at SukiCart.");
        clearCart();
        navigate("/customer/dashboard");
    };

    const handleProductClick = (uuid) => {
        navigate(`/products/${uuid}`);
    };

    const toggleItemCheck = (uuid) => {
        setCheckedItems(prev => ({
            ...prev,
            [uuid]: !prev[uuid]
        }));
    };

    const getCheckedItems = () => {
        return items.filter(item => checkedItems[item.uuid]);
    };

    const getCheckedTotal = () => {
        return getCheckedItems().reduce((sum, item) => sum + (getPrice(item) * item.qty), 0);
    };

    const handleCheckAll = (checked) => {
        if (checked) {
            const newCheckedItems = {};
            items.forEach(item => {
                newCheckedItems[item.uuid] = true;
            });
            setCheckedItems(newCheckedItems);
        } else {
            setCheckedItems({});
        }
    };

    const isAllChecked = items.length > 0 && items.every(item => checkedItems[item.uuid]);
    const isIndeterminate = items.some(item => checkedItems[item.uuid]) && !isAllChecked;

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
            <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 pb-24 md:pb-28">

                {/* Header */}
                <div className="mb-6 bg-linear-to-br from-green-50 to-emerald-50 rounded-2xl p-3 md:p-4 border border-green-100">
                    <div className="flex items-start gap-3 md:gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                            <ShoppingCart size={20} className="text-green-700 md:w-6 md:h-6" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl md:text-2xl font-bold text-green-900">Your SukiCart</h1>
                            <p className="text-gray-500 text-xs md:text-sm">{totalItems} item{totalItems !== 1 ? "s" : ""} ready for checkout</p>
                        </div>
                    </div>
                </div>

                {/* Items */}
                <div className="w-full space-y-3">

                        {/* Header Card */}
                        <div className="hidden md:grid bg-white rounded-2xl border border-gray-100 shadow-sm p-4 gap-4 items-center grid-cols-[20px_1fr_150px_150px_150px_60px]">
                            <div className="flex justify-center items-center h-full">
                                <Checkbox 
                                    checked={isAllChecked}
                                    indeterminate={isIndeterminate}
                                    onChange={(e) => handleCheckAll(e.target.checked)}
                                />
                            </div>
                            <div className="text-xs md:text-sm font-semibold text-gray-700">Products</div>
                            <div className="text-xs md:text-sm font-semibold text-gray-700 text-center">Unit Price</div>
                            <div className="text-xs md:text-sm font-semibold text-gray-700 text-center">Quantity</div>
                            <div className="text-xs md:text-sm font-semibold text-gray-700 text-center">Total Price</div>
                            <div className="text-xs md:text-sm font-semibold text-gray-700 text-right">Action</div>
                        </div>

                        {items.map(item => (
                            <div
                                key={item.uuid}
                                className="
                                    bg-white rounded-2xl border border-gray-100 shadow-sm p-4 gap-4 items-center

                                    grid grid-cols-1
                                    md:grid-cols-[20px_1fr_150px_150px_150px_60px]
                                "
                            >

                                {/* Checkbox */}
                                <div className="flex justify-start md:justify-center items-center">
                                    <Checkbox 
                                        checked={checkedItems[item.uuid] || false}
                                        onChange={() => toggleItemCheck(item.uuid)}
                                    />
                                </div>

                                {/* Product Info */}
                                <div className="flex gap-4 items-start md:items-center cursor-pointer hover:opacity-75 transition-opacity" onClick={() => handleProductClick(item.uuid)}>
                                    <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                                        {item.images && item.images.length > 0 ? (
                                            <img src={item.images[0].full_url || item.images[0].image_path} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Package size={28} className="text-gray-400" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-gray-800 text-sm truncate">{item.name}</h3>
                                        {item.variant && (
                                            <p className="text-xs text-gray-500 mt-1">{item.variant.name}</p>
                                        )}
                                        <p className="text-xs text-gray-400 mt-1">{item.category}</p>
                                    </div>
                                </div>

                                {/* Unit Price */}
                                <div className="flex md:justify-center items-center">
                                    <span className="text-sm font-semibold text-green-700">
                                        ₱{getPrice(item).toFixed(2)}
                                    </span>
                                </div>

                                {/* Quantity */}
                                <div className="flex md:justify-center items-center">
                                    <div className="w-full md:w-28" onKeyDown={(e) => e.stopPropagation()}>
                                        <InputNumber
                                            mode="spinner"
                                            min={1}
                                            max={item.stock || item.variant?.stock || 999}
                                            value={item.qty}
                                            onChange={v => {
                                                if (v === null || v === undefined || v < 1) return;
                                                updateQty(item.uuid, v);
                                            }}
                                            className="w-full"
                                        />
                                    </div>
                                </div>

                                {/* Total Price */}
                                <div className="flex md:justify-center items-center">
                                    <span className="text-sm font-bold text-gray-800">
                                        ₱{(getPrice(item) * item.qty).toFixed(2)}
                                    </span>
                                </div>

                                {/* Delete */}
                                <div className="flex md:justify-end items-center">
                                    <Tooltip title="Delete">
                                        <Popconfirm 
                                            title={`Delete ${item.name}?`}
                                            onConfirm={() => handleRemoveItem(item.uuid, item.name)}
                                            okText="Delete"
                                            cancelText="Cancel"
                                            okButtonProps={{ danger: true }}
                                        >
                                            <Button size="small" danger className="rounded-md" icon={<Trash2 size={14} />} />
                                        </Popconfirm>
                                    </Tooltip>
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={async () => { await clearCart(); message.success("Cart cleared"); }}
                            className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1.5 mt-2"
                        >
                            <Trash2 size={14} /> Clear cart
                        </button>
                    </div>

                {/* Fixed Bottom Summary */}
                <div className="fixed bottom-0 left-0 right-0 bg-linear-to-r from-green-50 to-emerald-50 border-t-2 border-green-200 shadow-2xl">
                    <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                            {/* Left: Total and Item Count */}
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center shrink-0 shadow-md">
                                    <ShoppingBag size={24} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600 font-medium">Order Total</p>
                                    <p className="text-2xl md:text-3xl font-bold text-green-900">
                                        ₱{getCheckedTotal().toFixed(2)}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {getCheckedItems().length} item{getCheckedItems().length !== 1 ? "s" : ""} selected
                                    </p>
                                </div>
                            </div>

                            {/* Right: Buttons */}
                            <div className="flex gap-2 md:gap-3 w-full sm:w-auto">
                                <Button 
                                    size="large" 
                                    className="h-11 rounded-lg font-semibold w-full sm:w-32 border-green-300 hover:bg-green-50 flex-1 sm:flex-initial" 
                                    block
                                    onClick={() => navigate("/")}
                                    icon={<ShoppingBag size={18} />}
                                >
                                    Continue Shopping
                                </Button>
                                <Button
                                    type="primary"
                                    size="large"
                                    className="h-11 rounded-lg font-semibold flex-1 sm:flex-initial bg-green-600 hover:bg-green-700 border-green-600"
                                    onClick={handleCheckout}
                                    disabled={getCheckedItems().length === 0}
                                    icon={<ShoppingCart size={18} />}
                                >
                                    Place Order
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}