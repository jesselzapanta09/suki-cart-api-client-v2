import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import * as cartService from "../services/cartService";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch cart from API on mount
    useEffect(() => {
        const fetchCart = async () => {
            try {
                setLoading(true);
                const response = await cartService.getCart();
                const cartItems = response.data || [];
                
                // Transform API response to match cart item structure
                const transformedItems = cartItems.map(item => ({
                    id: item.product_id,
                    cartId: item.id, // Store cart ID for updates/deletes
                    name: item.product.name,
                    price: item.product.price,
                    qty: item.quantity,
                    stock: item.product.stock,
                    category: item.product.category?.name || "Unknown",
                    rating: item.product.rating || 4.5,
                    sold: item.product.sold || 0,
                    images: item.product.images || [],
                    store: item.product.store || {},
                    description: item.product.description || "",
                }));
                
                setItems(transformedItems);
            } catch (error) {
                // Silently fail on auth error (user not logged in)
                if (error.response?.status === 401) {
                    setItems([]);
                } else if (error.response?.status !== 404) {
                    console.error("Error fetching cart:", error);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchCart();
    }, []);

    const addItem = useCallback(async (product, qty = 1) => {
        try {
            const response = await cartService.addToCart(product.id, qty);
            const cartItem = response.data;
            
            // Check if product already exists in local state
            setItems(prev => {
                const existing = prev.find(i => i.id === product.id);
                if (existing) {
                    // Update the cartId reference
                    return prev.map(i => 
                        i.id === product.id 
                            ? { ...i, qty: cartItem.quantity, cartId: cartItem.id }
                            : i
                    );
                }
                // Add new item
                return [...prev, {
                    id: product.id,
                    cartId: cartItem.id,
                    name: product.name,
                    price: product.price,
                    qty: cartItem.quantity,
                    stock: product.stock,
                    category: product.category || "Unknown",
                    rating: product.rating || 4.5,
                    sold: product.sold || 0,
                    images: product.images || [],
                    store: product.store || {},
                    description: product.description || "",
                }];
            });
        } catch (error) {
            console.error("Error adding item to cart:", error);
            throw error;
        }
    }, []);

    const removeItem = useCallback(async (id) => {
        try {
            const item = items.find(i => i.id === id);
            if (item?.cartId) {
                await cartService.removeCartItem(item.cartId);
            }
            setItems(prev => prev.filter(i => i.id !== id));
        } catch (error) {
            console.error("Error removing item from cart:", error);
            throw error;
        }
    }, [items]);

    const updateQty = useCallback(async (id, qty) => {
        if (qty < 1) { 
            await removeItem(id);
            return;
        }

        try {
            const item = items.find(i => i.id === id);
            if (item?.cartId) {
                await cartService.updateCartItem(item.cartId, qty);
            }
            setItems(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
        } catch (error) {
            console.error("Error updating cart item quantity:", error);
            throw error;
        }
    }, [items, removeItem]);

    const clearCart = useCallback(async () => {
        try {
            await cartService.clearCart();
            setItems([]);
        } catch (error) {
            console.error("Error clearing cart:", error);
            throw error;
        }
    }, []);

    const totalItems = items.reduce((s, i) => s + i.qty, 0);
    const totalPrice = items.reduce((s, i) => s + i.price * i.qty, 0);

    return (
        <CartContext.Provider value={{ 
            items, 
            addItem, 
            removeItem, 
            updateQty, 
            clearCart, 
            totalItems, 
            totalPrice, 
            loading 
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
