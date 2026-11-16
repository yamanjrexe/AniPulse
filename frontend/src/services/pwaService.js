export function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    const isBot = /bot|crawler|spider|prerender|netlify|discord|google/i.test(navigator.userAgent);
    if (isBot) {
        console.log('🤖 Bot detected. Skipping Service Worker registration for SEO.');
        return;
    }

    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then((reg) => {
                console.log('✅ SW registered:', reg.scope);
                reg.update().catch((err) => console.warn('SW update check failed:', err));

                reg.addEventListener('updatefound', () => {
                    const newSW = reg.installing;
                    if (!newSW) return;
                    newSW.addEventListener('statechange', () => {
                        if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
                            window.dispatchEvent(new CustomEvent('swUpdateAvailable'));
                        }
                    });
                });
            })
            .catch((err) => console.warn('SW registration failed:', err));
    });

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
    });
}

export function applyUpdate() {
    navigator.serviceWorker.getRegistration().then((reg) => {
        reg?.waiting?.postMessage({ type: 'SKIP_WAITING' });
    });
}