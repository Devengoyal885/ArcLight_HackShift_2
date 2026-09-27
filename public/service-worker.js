/**
 * service-worker.js
 * ──────────────────────────────────────────────────────────────
 * CapAble PWA Service Worker
 * Provides offline caching and push notification support.
 * Strategy: Cache First for static assets, Network First for API calls.
 */

const CACHE_NAME = 'capable-v2';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.svg',
];

// ── Install: cache static shell ────────────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

// ── Activate: clean old caches ─────────────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            )
        )
    );
    self.clients.claim();
});

// ── Fetch: cache strategy ──────────────────────────────────────
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET and cross-origin requests (Firebase, etc.)
    if (event.request.method !== 'GET') return;
    if (!url.origin.includes(self.location.origin)) return;

    // Network first for API/Firestore
    if (url.pathname.startsWith('/api/') || url.host.includes('firestore')) {
        event.respondWith(
            fetch(event.request).catch(() => caches.match(event.request))
        );
        return;
    }

    // Cache first for static assets
    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;
            return fetch(event.request).then(response => {
                if (!response || response.status !== 200 || response.type === 'opaque') return response;
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                return response;
            });
        }).catch(() => caches.match('/index.html'))
    );
});

// ── Push Notifications ─────────────────────────────────────────
self.addEventListener('push', (event) => {
    if (!event.data) return;

    let data;
    try { data = event.data.json(); }
    catch { data = { title: 'CapAble Update', body: event.data.text() }; }

    const options = {
        body: data.body || 'You have a new notification.',
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: data.tag || 'capable-notification',
        data: { url: data.url || '/' },
        actions: [
            { action: 'view', title: 'View', icon: '/favicon.svg' },
            { action: 'dismiss', title: 'Dismiss' },
        ],
        requireInteraction: data.important || false,
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'CapAble', options)
    );
});

// ── Notification click ─────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'dismiss') return;

    const url = event.notification.data?.url || '/';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            const existingClient = clientList.find(c => c.url === url && 'focus' in c);
            if (existingClient) return existingClient.focus();
            return clients.openWindow(url);
        })
    );
});
