import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "./AuthContext";
import * as cartService from "../services/cartService";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user, loading: authLoading } = useAuth();

    // Fetch cart from API after auth is restored
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
                    price: item.product_variant_id && item.variant ? item.variant.price : item.product.price,
                    qty: item.quantity,
                    stock: item.product_variant_id && item.variant ? item.variant.stock : item.product.stock,
                    category: item.product.category?.name || "Unknown",
                    rating: item.product.rating || 4.5,
                    sold: item.product.sold || 0,
                    images: item.product.images || [],
                    store: item.product.store || {},
                    description: item.product.description || "",
                    variant_id: item.product_variant_id,
                    variant: item.variant || null,
                }));
                
                setItems(transformedItems);
            } catch (error) {
                // Silently fail on auth error (user not logged in)
                if (error?.status === 401 || error?.status === 403) {
                    setItems([]);
                } else if (error?.status !== 404) {
                    console.error("Error fetching cart:", error);
                }
            } finally {
                setLoading(false);
            }
        };

        // Only fetch cart when auth loading is done and user is authenticated
        if (!authLoading && user) {
            fetchCart();
        } else if (!authLoading && !user) {
            // User is not authenticated, clear cart
            setItems([]);
        }
    }, [authLoading, user]);

    const addItem = useCallback(async (product, qty = 1) => {
        try {
            const response = await cartService.addToCart(product.id, qty, product.variant_id || null);
            const cartItem = response.data;
            
            // Check if item with same product and variant already exists
            const key = product.variant_id ? `${product.id}-${product.variant_id}` : product.id;
            const existingKey = item => item.variant_id ? `${item.id}-${item.variant_id}` : item.id;
            
            setItems(prev => {
                const existingIndex = prev.findIndex(i => existingKey(i) === key);
                if (existingIndex !== -1) {
                    // Update the quantity
                    const updated = [...prev];
                    updated[existingIndex] = { 
                        ...updated[existingIndex], 
                        qty: cartItem.quantity, 
                        cartId: cartItem.id 
                    };
                    return updated;
                }
                // Add new item
                return [...prev, {
                    id: product.id,
                    cartId: cartItem.id,
                    name: product.name,
                    price: product.price || product.variant?.price || 0,
                    qty: cartItem.quantity,
                    stock: product.stock || product.variant?.stock || 0,
                    category: product.category || "Unknown",
                    rating: product.rating || 4.5,
                    sold: product.sold || 0,
                    images: product.images || [],
                    store: product.store || {},
                    description: product.description || "",
                    variant_id: product.variant_id || null,
                    variant: product.variant || null,
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
