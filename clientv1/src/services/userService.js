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

export function getUsers({ page = 1, perPage = 10, search, sortField, sortOrder, role, verified } = {}) {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('per_page', perPage);
    if (search) params.set('search', search);
    if (sortField) params.set('sort_field', sortField);
    if (sortOrder) params.set('sort_order', sortOrder);
    if (role) params.set('role', role);
    if (verified !== undefined && verified !== null) params.set('verified', verified);
    return request(`${BASE}/users?${params}`, { headers: authHeaders() });
}

export function getUser(id) {
    return request(`${BASE}/users/${id}`, { headers: authHeaders() });
}

export function createUser(values) {
    const fd = new FormData();
    fd.append('firstname', values.firstname ?? '');
    fd.append('lastname', values.lastname ?? '');
    fd.append('email', values.email ?? '');
    fd.append('role', values.role ?? '');
    fd.append('contact_number', values.contact_number ?? '');
    fd.append('password', values.password ?? '');
    if (values.profile_picture instanceof File) {
        fd.append('profile_picture', values.profile_picture);
    }
    // Address
    if (values.region) fd.append('region', values.region);
    if (values.province) fd.append('province', values.province);
    if (values.city) fd.append('city', values.city);
    if (values.barangay) fd.append('barangay', values.barangay);
    // Store (seller)
    if (values.store_name) fd.append('store_name', values.store_name);
    if (values.store_category) fd.append('store_category', values.store_category);
    if (values.store_description) fd.append('store_description', values.store_description);
    if (values.store_banner instanceof File) {
        fd.append('store_banner', values.store_banner);
    }
    return request(`${BASE}/users`, { method: 'POST', headers: authHeaders(), body: fd });
}

export function updateUser(id, values) {
    const fd = new FormData();
    fd.append('firstname', values.firstname ?? '');
    fd.append('lastname', values.lastname ?? '');
    fd.append('email', values.email ?? '');
    fd.append('role', values.role ?? '');
    fd.append('contact_number', values.contact_number ?? '');
    if (values.password) fd.append('password', values.password);
    if (values.profile_picture instanceof File) {
        fd.append('profile_picture', values.profile_picture);
    }
    if (values.remove_picture) {
        fd.append('remove_picture', '1');
    }
    // Address
    if (values.region) fd.append('region', values.region);
    if (values.province) fd.append('province', values.province);
    if (values.city) fd.append('city', values.city);
    if (values.barangay) fd.append('barangay', values.barangay);
    // Store (seller)
    if (values.store_name) fd.append('store_name', values.store_name);
    if (values.store_category) fd.append('store_category', values.store_category);
    if (values.store_description !== undefined) fd.append('store_description', values.store_description ?? '');
    if (values.store_banner instanceof File) {
        fd.append('store_banner', values.store_banner);
    }
    return request(`${BASE}/users/${id}`, { method: 'POST', headers: authHeaders(), body: fd });
}

export function deleteUser(id) {
    return request(`${BASE}/users/${id}`, { method: 'DELETE', headers: authHeaders() });
}
