// ============================================
// FIREBASE CLIENT — loads config from backend, initializes once
// Port of Frontend/Js/firebase-init.js
// ============================================

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

/**
 * Returns a Promise that resolves once Firebase is initialized.
 * Safe to call multiple times — it will resolve immediately if already ready.
 */
export function initFirebase() {
    return new Promise((resolve) => {
        if (initialized && window.firebase?.apps?.length) {
            resolve(window.firebase);
            return;
        }

        const attempt = async () => {
            if (!window.firebase) {
                // SDK not loaded yet — retry soon
                if (retryCount++ < MAX_RETRIES) {
                    setTimeout(attempt, 300);
                } else {
                    console.error('❌ Firebase SDK never loaded');
                    resolve(null);
                }
                return;
            }

            const config = await loadFirebaseConfig();
            if (!config) {
                if (retryCount++ < MAX_RETRIES) {
                    const delay = Math.min(30000, 3000 * Math.pow(1.2, retryCount));
                    setTimeout(attempt, delay);
                } else {
                    console.error('❌ Firebase config could not be loaded');
                    resolve(null);
                }
                return;
            }

            retryCount = 0;
            if (!window.firebase.apps.length) {
                window.firebase.initializeApp(config);
                console.log('✅ Firebase client initialized');
            }
            initialized = true;
            resolve(window.firebase);
        };

        attempt();
    });
}

export { API_BASE_URL };
