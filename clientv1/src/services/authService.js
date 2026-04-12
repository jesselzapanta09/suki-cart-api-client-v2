const BASE = '/api';

function extractFile(uploadValue) {
    // Ant Design Upload stores files as fileList array; originFileObj is the actual File
    if (!uploadValue) return null;
    const list = Array.isArray(uploadValue) ? uploadValue : uploadValue.fileList ?? [];
    return list[0]?.originFileObj ?? null;
}

async function safeJson(res) {
    const text = await res.text();
    if (!text) return {};
    try { return JSON.parse(text); } catch { return { message: `Server error (${res.status})` }; }
}

async function postForm(url, formData) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
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

async function postJson(url, payload) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
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

export function registerCustomer(values) {
    const fd = new FormData();
    fd.append('firstname', values.firstName ?? '');
    fd.append('lastname', values.lastName ?? '');
    fd.append('contact_number', values.contactNumber ?? '');
    fd.append('region', values.region ?? '');
    fd.append('province', values.province ?? '');
    fd.append('city', values.city ?? '');
    fd.append('barangay', values.barangay ?? '');
    fd.append('email', values.email ?? '');
    fd.append('password', values.password ?? '');
    fd.append('password_confirmation', values.passwordConfirmation ?? '');

    const pic = extractFile(values.profilePicture);
    if (pic) fd.append('profile_picture', pic);

    return postForm(`${BASE}/register/customer`, fd);
}

export function registerSeller(values) {
    const fd = new FormData();
    fd.append('firstname', values.firstName ?? '');
    fd.append('lastname', values.lastName ?? '');
    fd.append('contact_number', values.contactNumber ?? '');
    fd.append('store_name', values.storeName ?? '');
    fd.append('store_category', values.storeCategory ?? '');
    fd.append('store_description', values.storeDescription ?? '');
    fd.append('region', values.region ?? '');
    fd.append('province', values.province ?? '');
    fd.append('city', values.city ?? '');
    fd.append('barangay', values.barangay ?? '');
    fd.append('email', values.email ?? '');
    fd.append('password', values.password ?? '');
    fd.append('password_confirmation', values.passwordConfirmation ?? '');

    const pic = extractFile(values.profilePicture);
    if (pic) fd.append('profile_picture', pic);

    const banner = extractFile(values.storeBanner);
    if (banner) fd.append('store_banner', banner);

    return postForm(`${BASE}/register/seller`, fd);
}

export function login(email, password) {
    return postJson(`${BASE}/login`, { email, password });
}

export function resendVerification(email) {
    return postJson(`${BASE}/resend-verification`, { email });
}

export async function verifyEmail(token) {
    const res = await fetch(`${BASE}/verify-email?token=${encodeURIComponent(token)}`, {
        headers: { 'Accept': 'application/json' },
    });
    const json = await safeJson(res);
    if (!res.ok) {
        const error = new Error(json.message ?? 'Verification failed');
        error.status = res.status;
        throw error;
    }
    return json;
}

export function forgotPassword(email) {
    return postJson(`${BASE}/forgot-password`, { email });
}

export function resetPassword(token, password, password_confirmation) {
    return postJson(`${BASE}/reset-password`, { token, password, password_confirmation });
}

export async function getCategories() {
    const res = await fetch(`${BASE}/categories`, {
        headers: { 'Accept': 'application/json' },
    });
    const json = await safeJson(res);
    if (!res.ok) {
        const error = new Error(json.message ?? 'Failed to load categories');
        error.status = res.status;
        throw error;
    }
    return json;
}

