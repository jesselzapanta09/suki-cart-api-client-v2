/* global clients */
// SukiCart Service Worker — handles background push notifications
// Compatible with Cordova when wrapped with a plugin that registers this SW.

const CACHE_NAME = 'sukicart-v1';

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener('install', () => {
    // Activate immediately without waiting for old SW to finish
    self.skipWaiting();
});

// ── Activate ──────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// ── Push received ─────────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
    let payload = {
        title: 'SukiCart',
        message: 'You have a new notification.',
        type: 'system',
        data: {},
    };

    if (event.data) {
        try {
            payload = { ...payload, ...event.data.json() };
        } catch {
            payload.message = event.data.text();
        }
    }

    const options = {
        body: payload.message,
        icon: '/suki-cart-logo.png',
        badge: '/suki-cart-logo.png',
        tag: payload.type || 'sukicart',
        data: {
            url: '/notifications',
            ...payload.data,
        },
        // Android vibration pattern (works in Cordova)
        vibrate: [100, 50, 100],
        requireInteraction: false,
    };

    event.waitUntil(
        // Send message to all active clients (pages/tabs that are open)
        clients.matchAll({ type: 'window', includeUncontrolled: false }).then((windowClients) => {
            console.log('[SW Push] Found', windowClients.length, 'active clients');
            
            // If any clients are open, send them a message about the push
            if (windowClients.length > 0) {
                windowClients.forEach((client) => {
                    console.log('[SW Push] Sending message to client:', client.url);
                    client.postMessage({
                        type: 'PUSH_NOTIFICATION',
                        payload,
                    });
                });
            }
            
            // Always show system notification too (OS may suppress if page is active, but we tried)
            console.log('[SW Push] Showing notification:', payload.title);
            return self.registration.showNotification(payload.title, options);
        }).catch((err) => {
            console.error('[SW Push] Error:', err);
            return self.registration.showNotification(payload.title, options);
        })
    );
});

// ── Notification click ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetUrl = (event.notification.data && event.notification.data.url)
        ? event.notification.data.url
        : '/notifications';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // If app window is already open, focus it and navigate
            for (const client of windowClients) {
                if ('focus' in client) {
                    client.focus();
                    client.navigate(targetUrl);
                    return;
                }
            }
            // Otherwise open a new window
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
