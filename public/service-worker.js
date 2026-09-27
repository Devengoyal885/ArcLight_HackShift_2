/**
 * service-worker.js
 * ──────────────────────────────────────────────────────────────
 * CapAble PWA Service Worker
 * Strategy:
 *   - JS/CSS chunks (/assets/*) → NEVER cached (always network)
 *     These have hashed names that change on every deploy.
 *     Caching them causes "Failed to fetch dynamically imported module" crashes.
 *   - App shell (/, /index.html, /manifest.json) → Network first, cache fallback
 *   - API calls → Network only
 *   - Push notifications → Supported
 */

const CACHE_NAME = 'capable-v3';
const SHELL_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.svg',
];

// ── Install: cache only the app shell ─────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_ASSETS))
    );
    self.skipWaiting();
});

// ── Activate: clean ALL old caches immediately ─────────────────
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

// ── Fetch: smart routing ───────────────────────────────────────
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip cross-origin requests (Firebase, Google APIs, etc.)
    if (url.origin !== self.location.origin) return;

    // ❌ NEVER cache JS/CSS asset chunks — always fetch from network
    // These files have hashed names that change on every deploy.
    // Caching them causes crash screens after new deployments.
    if (url.pathname.startsWith('/assets/')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // ❌ Never cache API calls
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // ✅ App shell: Network first, fall back to cache (handles offline)
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Cache successful shell responses
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() => {
                // Offline fallback: return cached shell or index.html for navigation
                return caches.match(event.request)
                    .then(cached => cached || caches.match('/index.html'));
            })
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
