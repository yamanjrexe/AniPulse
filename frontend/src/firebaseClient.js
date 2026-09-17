const API_BASE_URL = window.API_BASE_URL ||
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'
        : 'https://anipulse-63jv.onrender.com');

let initialized = false;
let retryCount = 0;
const MAX_RETRIES = 20;

async function loadFirebaseConfig() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/firebase-config`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (e) {
        console.error('❌ Failed to load Firebase config:', e.message);
        return null;
    }
}

export function initFirebase() {
    return new Promise((resolve) => {
        if (initialized && window.firebase?.apps?.length) return resolve(window.firebase);

        const attempt = async () => {
            if (!window.firebase) {
                if (retryCount++ < MAX_RETRIES) return setTimeout(attempt, 300);
                console.error('❌ Firebase SDK never loaded');
                return resolve(null);
            }

            const config = await loadFirebaseConfig();
            if (!config) {
                if (retryCount++ < MAX_RETRIES) {
                    const delay = Math.min(30000, 3000 * Math.pow(1.2, retryCount));
                    return setTimeout(attempt, delay);
                }
                return resolve(null);
            }

            retryCount = 0;
            if (!window.firebase.apps.length) {
                window.firebase.initializeApp(config);
                console.log('✅ Firebase initialized');
            }
            initialized = true;
            resolve(window.firebase);
        };

        attempt();
    });
}

export { API_BASE_URL };