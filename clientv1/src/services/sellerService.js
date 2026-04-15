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
