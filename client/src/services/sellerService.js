import api from './api';

export function getStoreStatus() {
    return api.get('/seller/store-status');
}

export function resubmitStore() {
    return api.post('/seller/resubmit-store');
}

export function addProduct(formData) {
    return api.post('/seller/products', formData);
}

export function getSellerOrders(params = {}) {
    return api.get('/seller/orders', { params });
}

export function getSellerOrder(orderId) {
    return api.get(`/seller/orders/${orderId}`);
}

export function updateSellerOrderStatus(orderId, data) {
    return api.put(`/seller/orders/${orderId}/status`, data);
}

export function updateSellerOrderShipment(orderId, data) {
    return api.put(`/seller/orders/${orderId}/shipment`, data);
}

export function cancelSellerOrderItem(orderId, itemId, reason) {
    return api.put(`/seller/orders/${orderId}/items/${itemId}/cancel`, {
        cancellation_reason: reason,
    });
}
