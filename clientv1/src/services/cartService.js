import api from './api';

// Cart operations (authenticated customer only)
export function getCart() {
    return api.get('/customer/cart');
}

export function addToCart(productId, quantity = 1, variantId = null) {
    return api.post('/customer/cart', {
        product_id: productId,
        product_variant_id: variantId,
        quantity,
    });
}

export function updateCartItem(cartId, quantity) {
    return api.put(`/customer/cart/${cartId}`, {
        quantity,
    });
}

export function removeCartItem(cartId) {
    return api.delete(`/customer/cart/${cartId}`);
}

export function clearCart() {
    return api.delete('/customer/cart');
}
