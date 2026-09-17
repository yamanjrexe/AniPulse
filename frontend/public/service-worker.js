const CACHE_NAME = 'anipulse-v12';
const VERSION = '3.0.0';

const APP_SHELL = [
    '/',
    '/index.html',
    '/manifest.json',
    '/offline.html',
    '/icon/Anipulse.png',
    '/icon/icon-192x192.png',
    '/icon/icon-512x512.png'
];

self.addEventListener('install', (event) => {
    console.log('[SW] Installing', VERSION);
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            for (const asset of APP_SHELL) {
                try {
                    const res = await fetch(asset);
                    if (res.ok) await cache.put(asset, res);
                } catch (e) { console.warn('[SW] Failed to cache', asset); }
            }
            return self.skipWaiting();
        })
    );
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Activating', VERSION);
    event.waitUntil(
        caches.keys().then((names) =>
            Promise.all(names.map((name) => {
                if (name !== CACHE_NAME) return caches.delete(name);
            }))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (request.method !== 'GET') return;
    if (!url.protocol.startsWith('http')) return;

    // Skip CDNs / APIs
    if (
        url.hostname.includes('cdn.jsdelivr.net') ||
        url.hostname.includes('cdnjs.cloudflare.com') ||
        url.hostname.includes('fonts.googleapis.com') ||
        url.hostname.includes('fonts.gstatic.com') ||
        url.hostname.includes('firebase') ||
        url.hostname.includes('googleapis.com') ||
        url.hostname.includes('gstatic.com') ||
        url.hostname.includes('anilist.co')
    ) return;

    if (url.pathname.startsWith('/api/')) return;

    // Navigation → network first, offline fallback
    if (request.mode === 'navigate' || url.pathname.endsWith('.html')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    }
                    return response;
                })
                .catch(async () => {
                    const cached = await caches.match(request);
                    if (cached) return cached;
                    const offline = await caches.match('/offline.html');
                    if (offline) return offline;
                    return new Response('You are offline.', {
                        status: 200, headers: { 'Content-Type': 'text/plain' }
                    });
                })
        );
        return;
    }

    // Static → cache first
    if (url.hostname === location.hostname) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    }
                    return response;
                })
                .catch(async () => {
                    const cached = await caches.match(request);
                    if (cached) return cached;
                    if (/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(url.pathname)) {
                        return new Response('', { status: 200, headers: { 'Content-Type': 'image/png' } });
                    }
                    return new Response('', { status: 200 });
                })
        );
    }
});