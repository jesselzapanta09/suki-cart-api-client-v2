import api from './api';

// Seller Products (authenticated)
export function getProducts(params = {}) {
    return api.get('/seller/products', { params });
}

export function getProduct(id) {
    return api.get(`/seller/products/${id}`);
}

export function addProduct(formData) {
    return api.post('/seller/products', formData);
}

export function updateProduct(id, formData) {
    return api.post(`/seller/products/${id}`, formData, {
        headers: { 'X-HTTP-Method-Override': 'PUT' },
    });
}

export function deleteProduct(id) {
    return api.delete(`/seller/products/${id}`);
}

// Public Products (no authentication required)
export function searchPublicProducts(params = {}) {
    return api.get('/products/search', { params });
}

export function getPublicProduct(id) {
    return api.get(`/products/${id}`);
}
