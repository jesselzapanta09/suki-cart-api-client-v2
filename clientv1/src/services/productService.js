import api from './api';

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
