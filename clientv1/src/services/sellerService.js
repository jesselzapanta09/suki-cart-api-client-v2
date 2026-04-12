const BASE = '/api';

function getToken() {
    return localStorage.getItem('token');
}

function authHeaders(extra = {}) {
    return {
        'Accept': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
        ...extra,
    };
}

async function safeJson(res) {
    const text = await res.text();
    if (!text) return {};
    try { return JSON.parse(text); } catch { return { message: `Server error (${res.status})` }; }
}

export async function getStoreStatus() {
    const res = await fetch(`${BASE}/seller/store-status`, { headers: authHeaders() });
    const json = await safeJson(res);
    if (!res.ok) {
        const error = new Error(json.message ?? 'Request failed');
        error.status = res.status;
        throw error;
    }
    return json;
}

export async function resubmitStore() {
    const res = await fetch(`${BASE}/seller/resubmit-store`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
    });
    const json = await safeJson(res);
    if (!res.ok) {
        const error = new Error(json.message ?? 'Request failed');
        error.status = res.status;
        throw error;
    }
    return json;
}

export async function addProduct(formData) {
    const res = await fetch(`${BASE}/seller/products`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${getToken()}`,
            // 'Content-Type' should NOT be set for FormData
        },
        body: formData,
    });
    const json = await safeJson(res);
    if (!res.ok) {
        const error = new Error(json.message ?? 'Request failed');
        error.status = res.status;
        error.errors = json.errors;
        throw error;
    }
    return json;
}
