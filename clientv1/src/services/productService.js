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

// Product Variants (authenticated)
export function getProductVariants(productId) {
    return api.get(`/seller/products/${productId}/variants`);
}

export function getProductVariant(productId, variantId) {
    return api.get(`/seller/products/${productId}/variants/${variantId}`);
}

export function addProductVariant(productId, data) {
    return api.post(`/seller/products/${productId}/variants`, data);
}

export function updateProductVariant(productId, variantId, data) {
    return api.put(`/seller/products/${productId}/variants/${variantId}`, data);
}

export function deleteProductVariant(productId, variantId) {
    return api.delete(`/seller/products/${productId}/variants/${variantId}`);
}

// Public Products (no authentication required)
export function searchPublicProducts(params = {}) {
    return api.get('/products/search', { params });
}

export function getPublicProduct(id) {
    return api.get(`/products/${id}`);
}
