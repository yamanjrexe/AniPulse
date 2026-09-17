import { useEffect, useState } from 'react';

let deferredPrompt = null;

if (typeof window !== 'undefined') {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        window.dispatchEvent(new CustomEvent('pwaInstallable'));
    });
}

export default function usePWAInstall() {
    const [installable, setInstallable] = useState(!!deferredPrompt);
    const [installed, setInstalled] = useState(
        window.matchMedia?.('(display-mode: standalone)').matches || false
    );

    useEffect(() => {
        const onInstallable = () => setInstallable(true);
        const onInstalled = () => { setInstalled(true); setInstallable(false); };
        window.addEventListener('pwaInstallable', onInstallable);
        window.addEventListener('appinstalled', onInstalled);
        return () => {
            window.removeEventListener('pwaInstallable', onInstallable);
            window.removeEventListener('appinstalled', onInstalled);
        };
    }, []);

    const promptInstall = async () => {
        if (!deferredPrompt) return false;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
        setInstallable(false);
        return outcome === 'accepted';
    };

    return { installable, installed, promptInstall };
}