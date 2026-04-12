const BASE = '/api/seller';

function getToken() {
    return localStorage.getItem('token');
}

function buildQuery(params = {}) {
    const search = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        search.append(key, value);
    });

    const query = search.toString();
    return query ? `?${query}` : '';
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

export function getProducts(params = {}) {
    return request(`${BASE}/products${buildQuery(params)}`, { headers: authHeaders() });
}

export function getProduct(id) {
    return request(`${BASE}/products/${id}`, { headers: authHeaders() });
}

export async function addProduct(formData) {
    const res = await fetch(`${BASE}/products`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${getToken()}`,
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

export async function updateProduct(id, formData) {
    const res = await fetch(`${BASE}/products/${id}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${getToken()}`,
            'X-HTTP-Method-Override': 'PUT',
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

export function deleteProduct(id) {
    return request(`${BASE}/products/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
}
