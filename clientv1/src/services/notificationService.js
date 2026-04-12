const BASE = '/api/notifications';

function getToken() {
    return localStorage.getItem('token');
}

function authHeaders(extra = {}) {
    return {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
        ...extra,
    };
}

async function safeJson(res) {
    const text = await res.text();
    if (!text) return {};
    try { return JSON.parse(text); } catch { return { message: `Server error (${res.status})` }; }
}

export async function request(url, options = {}) {
    const res = await fetch(url, options);
    const json = await safeJson(res);
    if (!res.ok) {
        const error = new Error(json.message ?? 'Request failed');
        error.status = res.status;
        throw error;
    }
    return json;
}

// ── Notifications ──────────────────────────────────────────────────────────────

export function getNotifications(page = 1, perPage = 20) {
    return request(`${BASE}?page=${page}&per_page=${perPage}`, {
        headers: authHeaders(),
    });
}

export function getUnreadCount() {
    return request(`${BASE}/unread-count`, {
        headers: authHeaders(),
    });
}

export function markRead(id) {
    return request(`${BASE}/${id}/mark-read`, {
        method: 'POST',
        headers: authHeaders(),
    });
}

export function markAllRead() {
    return request(`${BASE}/mark-all-read`, {
        method: 'POST',
        headers: authHeaders(),
    });
}

export function deleteNotification(id) {
    return request(`${BASE}/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
}

// ── Push Subscription ──────────────────────────────────────────────────────────

export async function getVapidPublicKey() {
    const json = await request(`${BASE}/vapid-public-key`, {
        headers: authHeaders(),
    });
    return json.vapid_public_key;
}

export function savePushSubscription(subscription) {
    const json = subscription.toJSON();
    return request(`${BASE}/push-subscription`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
            endpoint:   json.endpoint,
            public_key: json.keys.p256dh,
            auth_token: json.keys.auth,
        }),
    });
}

export function deletePushSubscription(endpoint) {
    return request(`${BASE}/push-subscription`, {
        method: 'DELETE',
        headers: authHeaders(),
        body: JSON.stringify({ endpoint }),
    });
}

// ── Service worker registration & push subscribe ───────────────────────────────

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export async function registerPushSubscription() {
    // Service workers aren't available in Cordova WebView the same way,
    // but this still works when wrapped with cordova-plugin-service-worker or similar.
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('[Push] Not supported in this environment.');
        return null;
    }

    try {
        const reg = await navigator.serviceWorker.ready;
        const vapidKey = await getVapidPublicKey();
        if (!vapidKey) return null;

        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
            sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey),
            });
        }

        await savePushSubscription(sub);
        return sub;
    } catch (err) {
        console.error('[Push] Failed to subscribe:', err);
        return null;
    }
}

export async function unregisterPushSubscription() {
    if (!('serviceWorker' in navigator)) return;
    try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
            await deletePushSubscription(sub.endpoint);
            await sub.unsubscribe();
        }
    } catch (err) {
        console.error('[Push] Failed to unsubscribe:', err);
    }
}
