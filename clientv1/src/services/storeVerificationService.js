const BASE = '/api/admin';

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

async function request(url, options = {}) {
    const res = await fetch(url, options);
    const json = await safeJson(res);
    if (!res.ok) {
        const error = new Error(json.message ?? 'Request failed');
        error.errors = json.errors ?? {};
        error.status = res.status;
        error.data = json;
        throw error;
    }
    return json;
}

export function getStoreVerifications({ page = 1, perPage = 10, search, sortField, sortOrder, status } = {}) {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('per_page', perPage);
    if (search) params.set('search', search);
    if (sortField) params.set('sort_field', sortField);
    if (sortOrder) params.set('sort_order', sortOrder);
    if (status) params.set('status', status);
    return request(`${BASE}/store-verifications?${params}`, { headers: authHeaders() });
}

export function getStoreVerification(id) {
    return request(`${BASE}/store-verifications/${id}`, { headers: authHeaders() });
}

export function approveStore(id) {
    return request(`${BASE}/store-verifications/${id}/approve`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
    });
}

export function rejectStore(id, rejectionReason) {
    return request(`${BASE}/store-verifications/${id}/reject`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ rejection_reason: rejectionReason }),
    });
}

export function setStorePending(id) {
    return request(`${BASE}/store-verifications/${id}/pending`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
    });
}

export function getStoreLogs(storeId) {
    return request(`${BASE}/store-verifications/${storeId}/logs`, { headers: authHeaders() });
}

export function getAllLogs({ page = 1, perPage = 15, search } = {}) {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('per_page', perPage);
    if (search) params.set('search', search);
    return request(`${BASE}/store-verification-logs?${params}`, { headers: authHeaders() });
}

export function revertLog(logId) {
    return request(`${BASE}/store-verification-logs/${logId}/revert`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
    });
}
