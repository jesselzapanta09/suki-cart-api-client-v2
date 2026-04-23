import React, { useMemo, useState } from "react";
import { Button, InputNumber, Empty, App, Checkbox, Tooltip, Popconfirm } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Trash2, Package, ShoppingBag, Store } from "lucide-react";
import { useCart } from "../../../context/CartContext";

export default function CartIndex() {
    const { items, removeItem, updateQty, clearCart, totalItems } = useCart();
    const { message } = App.useApp();
    const navigate = useNavigate();
    const [checkedItems, setCheckedItems] = useState({});

    const getPrice = (item) => {
        const price = item.price ?? item.variant?.price ?? 0;
        return typeof price === "number" ? price : Number(price || 0);
    };

    const getItemKey = (item) => item.itemKey || item.cartId || `${item.uuid}-${item.variant_id || "none"}`;
    const getStoreKey = (item) => item.store?.id || item.store?.uuid || "unknown";
    const getStoreName = (store) => store?.store_name || store?.name || "Unknown Seller";

    const cartGroups = useMemo(() => {
        const groups = new Map();

        items.forEach((item) => {
            const storeKey = getStoreKey(item);

            if (!groups.has(storeKey)) {
                groups.set(storeKey, {
                    key: storeKey,
                    store: item.store || null,
                    items: [],
                });
            }

            groups.get(storeKey).items.push(item);
        });

        return Array.from(groups.values()).map(group => ({
            ...group,
            subtotal: group.items.reduce((sum, item) => sum + (getPrice(item) * item.qty), 0),
        }));
    }, [items]);

    const getCheckedItems = () => {
        return items.filter(item => checkedItems[getItemKey(item)]);
    };

    const getCheckedTotal = () => {
        return getCheckedItems().reduce((sum, item) => sum + (getPrice(item) * item.qty), 0);
    };

    const handleRemoveItem = async (item, itemName) => {
        try {
            await removeItem(getItemKey(item));
            message.success(`${itemName} removed from cart`);
        } catch (error) {
            console.error("Error removing item:", error);
        }
    };

    const handleProceedToCheckout = () => {
        const checkedItemsList = getCheckedItems();

        if (checkedItemsList.length === 0) {
            message.warning("Please select items to order");
            return;
        }

        navigate("/customer/checkout", {
            state: {
                items: checkedItemsList,
                total: getCheckedTotal(),
            },
        });
    };

    const handleProductClick = (uuid) => {
        navigate(`/products/${uuid}`);
    };

    const toggleItemCheck = (item) => {
        const key = getItemKey(item);

        setCheckedItems(prev => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const toggleStoreCheck = (group, checked) => {
        setCheckedItems(prev => {
            const next = { ...prev };

            group.items.forEach(item => {
                const key = getItemKey(item);

                if (checked) {
                    next[key] = true;
                } else {
                    delete next[key];
                }
            });

            return next;
        });
    };

    const handleCheckAll = (checked) => {
        if (checked) {
            const newCheckedItems = {};
            items.forEach(item => {
                newCheckedItems[getItemKey(item)] = true;
            });
            setCheckedItems(newCheckedItems);
            return;
        }

        setCheckedItems({});
    };

    const isAllChecked = items.length > 0 && items.every(item => checkedItems[getItemKey(item)]);
    const isIndeterminate = items.some(item => checkedItems[getItemKey(item)]) && !isAllChecked;

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
                <div className="mb-6 bg-linear-to-br from-green-50 to-emerald-50 rounded-2xl p-3 md:p-4 border border-green-100">
                    <div className="flex items-start gap-3 md:gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                            <ShoppingCart size={20} className="text-green-700 md:w-6 md:h-6" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl md:text-2xl font-bold text-green-900">Your SukiCart</h1>
                            <p className="text-gray-500 text-xs md:text-sm">
                                {totalItems} item{totalItems !== 1 ? "s" : ""} ready for checkout
                            </p>
                        </div>
                    </div>
                </div>

                <div className="w-full space-y-4">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between gap-4">
                        <Checkbox
                            checked={isAllChecked}
                            indeterminate={isIndeterminate}
                            onChange={(e) => handleCheckAll(e.target.checked)}
                        >
                            <span className="font-semibold text-gray-800">Select all items</span>
                        </Checkbox>
                        <span className="text-xs md:text-sm text-gray-500">
                            {cartGroups.length} store{cartGroups.length !== 1 ? "s" : ""}
                        </span>
                    </div>

                    {cartGroups.map(group => {
                        const storeChecked = group.items.every(item => checkedItems[getItemKey(item)]);
                        const storeIndeterminate = group.items.some(item => checkedItems[getItemKey(item)]) && !storeChecked;

                        return (
                            <div key={group.key} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="p-4 md:p-5 border-b border-gray-100 bg-gray-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
                                    <div className="flex items-start gap-3 min-w-0">
                                        <Checkbox
                                            checked={storeChecked}
                                            indeterminate={storeIndeterminate}
                                            onChange={(e) => toggleStoreCheck(group, e.target.checked)}
                                        />
                                        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                                            <Store size={20} className="text-green-700" />
                                        </div>
                                        <div className="min-w-0">
                                            <h2 className="font-bold text-green-950 truncate">{getStoreName(group.store)}</h2>
                                            <p className="text-xs text-gray-500">
                                                {group.items.length} item{group.items.length !== 1 ? "s" : ""} from this store
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-left md:text-right pl-8 md:pl-0">
                                        <p className="text-xs text-gray-500">Store subtotal</p>
                                        <p className="font-bold text-green-700">₱{group.subtotal.toFixed(2)}</p>
                                    </div>
                                </div>

                                <div className="hidden md:grid p-4 gap-4 items-center grid-cols-[20px_1fr_150px_150px_150px_60px] border-b border-gray-100">
                                    <div />
                                    <div className="text-xs md:text-sm font-semibold text-gray-700">Products</div>
                                    <div className="text-xs md:text-sm font-semibold text-gray-700 text-center">Unit Price</div>
                                    <div className="text-xs md:text-sm font-semibold text-gray-700 text-center">Quantity</div>
                                    <div className="text-xs md:text-sm font-semibold text-gray-700 text-center">Total Price</div>
                                    <div className="text-xs md:text-sm font-semibold text-gray-700 text-right">Action</div>
                                </div>

                                <div className="divide-y divide-gray-100">
                                    {group.items.map(item => {
                                        const itemKey = getItemKey(item);

                                        return (
                                            <div
                                                key={itemKey}
                                                className="p-4 gap-4 items-center grid grid-cols-1 md:grid-cols-[20px_1fr_150px_150px_150px_60px]"
                                            >
                                                <div className="flex justify-start md:justify-center items-center">
                                                    <Checkbox
                                                        checked={checkedItems[itemKey] || false}
                                                        onChange={() => toggleItemCheck(item)}
                                                    />
                                                </div>

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

                                                <div className="flex justify-between md:justify-center items-center">
                                                    <span className="md:hidden text-xs font-medium text-gray-500">Unit Price</span>
                                                    <span className="text-sm font-semibold text-green-700">
                                                        ₱{getPrice(item).toFixed(2)}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between md:justify-center items-center gap-4">
                                                    <span className="md:hidden text-xs font-medium text-gray-500">Quantity</span>
                                                    <div className="w-28" onKeyDown={(e) => e.stopPropagation()}>
                                                        <InputNumber
                                                            mode="spinner"
                                                            min={1}
                                                            max={item.stock || item.variant?.stock || 999}
                                                            value={item.qty}
                                                            onChange={v => {
                                                                if (v === null || v === undefined || v < 1) return;
                                                                updateQty(itemKey, v);
                                                            }}
                                                            className="w-full"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex justify-between md:justify-center items-center">
                                                    <span className="md:hidden text-xs font-medium text-gray-500">Total Price</span>
                                                    <span className="text-sm font-bold text-gray-800">
                                                        ₱{(getPrice(item) * item.qty).toFixed(2)}
                                                    </span>
                                                </div>

                                                <div className="flex md:justify-end items-center">
                                                    <Tooltip title="Delete">
                                                        <Popconfirm
                                                            title={`Delete ${item.name}?`}
                                                            onConfirm={() => handleRemoveItem(item, item.name)}
                                                            okText="Delete"
                                                            cancelText="Cancel"
                                                            okButtonProps={{ danger: true }}
                                                        >
                                                            <Button size="small" danger className="rounded-md" icon={<Trash2 size={14} />} />
                                                        </Popconfirm>
                                                    </Tooltip>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    <button
                        onClick={async () => { await clearCart(); message.success("Cart cleared"); }}
                        className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1.5 mt-2"
                    >
                        <Trash2 size={14} /> Clear cart
                    </button>
                </div>

                <div className="fixed bottom-0 left-0 right-0 bg-linear-to-r from-green-50 to-emerald-50 border-t-2 border-green-200 shadow-2xl">
                    <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
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
                                    onClick={handleProceedToCheckout}
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
