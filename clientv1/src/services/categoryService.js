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

export function getCategories({ page = 1, perPage = 10, search, sortField, sortOrder, status } = {}) {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('per_page', perPage);
    if (search) params.set('search', search);
    if (sortField) params.set('sort_field', sortField);
    if (sortOrder) params.set('sort_order', sortOrder);
    if (status !== undefined && status !== null) params.set('status', status);
    return request(`${BASE}/categories?${params}`, { headers: authHeaders() });
}

export function getCategory(id) {
    return request(`${BASE}/categories/${id}`, { headers: authHeaders() });
}

export function createCategory(values) {
    return request(`${BASE}/categories`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
            name: values.name ?? '',
            description: values.description ?? '',
            status: values.status ?? 1,
        }),
    });
}

export function updateCategory(id, values) {
    return request(`${BASE}/categories/${id}`, {
        method: 'PUT',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
            name: values.name ?? '',
            description: values.description ?? '',
            status: values.status ?? 1,
        }),
    });
}

export function deleteCategory(id) {
    return request(`${BASE}/categories/${id}`, { method: 'DELETE', headers: authHeaders() });
}
