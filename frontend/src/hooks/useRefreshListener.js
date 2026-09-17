import { useEffect, useRef } from 'react';
import { REFRESH_EVENT } from '../context/RefreshContext.jsx';

/**
 * Runs `callback` whenever a global UI refresh happens.
 *
 *   useRefreshListener(() => {
 *     console.log('Refreshing...');
 *     updateStats();
 *   });
 */
export default function useRefreshListener(callback) {
    const cbRef = useRef(callback);

    // Keep ref updated so we don't re-attach on every render
    useEffect(() => {
        cbRef.current = callback;
    }, [callback]);

    useEffect(() => {
        const handler = () => {
            try {
                cbRef.current?.();
            } catch (err) {
                console.warn('[useRefreshListener] callback error:', err);
            }
        };
        window.addEventListener(REFRESH_EVENT, handler);
        return () => window.removeEventListener(REFRESH_EVENT, handler);
    }, []);
}