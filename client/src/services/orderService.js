import api from './api'

// Order operations (authenticated customer only)
export function getOrders(params = {}) {
    return api.get('/customer/orders', { params })
}

export function getOrder(orderId) {
    return api.get(`/customer/orders/${orderId}`)
}

export function createOrder(orderData) {
    return api.post('/customer/orders', orderData)
}

export function calculateShipping(shippingData) {
    return api.post('/customer/orders/calculate-shipping', shippingData)
}

export function updateOrder(orderId, data) {
    return api.put(`/customer/orders/${orderId}`, data)
}

export function deleteOrder(orderId) {
    return api.delete(`/customer/orders/${orderId}`)
}

export function cancelOrder(orderId, reason) {
    return api.put(`/customer/orders/${orderId}`, {
        status: 'cancelled',
        cancelled_by: 'customer',
        cancellation_reason: reason,
    })
}

export function markOrderItemDelivered(orderId, itemId) {
    return api.put(`/customer/orders/${orderId}/items/${itemId}/delivered`)
}

export function cancelOrderItem(orderId, itemId, reason) {
    return api.put(`/customer/orders/${orderId}/items/${itemId}/cancel`, {
        cancellation_reason: reason,
    })
}
