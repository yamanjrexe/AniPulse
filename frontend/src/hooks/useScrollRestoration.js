import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function useScrollRestoration() {
    const location = useLocation();
    const key = `scroll_${location.pathname}`;

    useEffect(() => {
        const saved = parseInt(sessionStorage.getItem(key) || '0');
        if (saved > 0) {
            setTimeout(() => window.scrollTo({ top: saved, behavior: 'auto' }), 50);
        } else {
            window.scrollTo({ top: 0, behavior: 'auto' });
        }
    }, [key]);

    useEffect(() => {
        const onScroll = () => sessionStorage.setItem(key, String(window.scrollY));
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', onScroll);
            sessionStorage.setItem(key, String(window.scrollY));
        };
    }, [key]);
}