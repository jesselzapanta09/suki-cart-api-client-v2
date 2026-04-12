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

async function authGet(url) {
    const res = await fetch(url, { headers: authHeaders() });
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

async function authPostForm(url, formData) {
    const res = await fetch(url, {
        method: 'POST',
        headers: authHeaders(),
        body: formData,
    });
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

async function authPostJson(url, payload) {
    const res = await fetch(url, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
    });
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

export function getProfile() {
    return authGet(`${BASE}/profile`);
}

export function updateInfo(values) {
    const fd = new FormData();
    fd.append('firstname', values.firstname ?? '');
    fd.append('lastname', values.lastname ?? '');
    fd.append('contact_number', values.contact_number ?? '');

    if (values.profile_picture instanceof File) {
        fd.append('profile_picture', values.profile_picture);
    }
    if (values.remove_picture) {
        fd.append('remove_picture', '1');
    }

    return authPostForm(`${BASE}/profile/info`, fd);
}

export function updateAddress(values) {
    return authPostJson(`${BASE}/profile/address`, {
        region: values.region ?? '',
        province: values.province ?? '',
        city: values.city ?? '',
        barangay: values.barangay ?? '',
    });
}

export function updateStore(values) {
    const fd = new FormData();
    fd.append('store_name', values.store_name ?? '');
    fd.append('store_category', values.store_category ?? '');
    fd.append('store_description', values.store_description ?? '');

    if (values.store_banner instanceof File) {
        fd.append('store_banner', values.store_banner);
    }
    if (values.remove_banner) {
        fd.append('remove_banner', '1');
    }

    return authPostForm(`${BASE}/profile/store`, fd);
}

export function changePassword(values) {
    return authPostJson(`${BASE}/profile/password`, {
        current_password: values.current_password,
        password: values.password,
        password_confirmation: values.password_confirmation,
    });
}
