import api from './api';

// ── Notifications ──────────────────────────────────────────────────────────────

export function getNotifications(page = 1, perPage = 20) {
    return api.get('/notifications', { params: { page, per_page: perPage } });
}

export function getUnreadCount() {
    return api.get('/notifications/unread-count');
}

export function markRead(id) {
    return api.post(`/notifications/${id}/mark-read`);
}

export function markAllRead() {
    return api.post('/notifications/mark-all-read');
}

export function deleteNotification(id) {
    return api.delete(`/notifications/${id}`);
}

// ── Push Subscription ──────────────────────────────────────────────────────────

export async function getVapidPublicKey() {
    const json = await api.get('/notifications/vapid-public-key');
    return json.vapid_public_key;
}

export function savePushSubscription(subscription) {
    const json = subscription.toJSON();
    return api.post('/notifications/push-subscription', {
        endpoint: json.endpoint,
        public_key: json.keys.p256dh,
        auth_token: json.keys.auth,
    });
}

export function deletePushSubscription(endpoint) {
    return api.delete('/notifications/push-subscription', {
        data: { endpoint },
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
