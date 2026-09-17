import firebase from "firebase/compat/app";
import "firebase/compat/auth";

const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL ||
    (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000"
        : "https://anipulse-63jv.onrender.com");

let initialized = false;

function buildConfigFromEnv() {
    return {
        apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
        authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
        storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.REACT_APP_FIREBASE_APP_ID,
    };
}

async function fetchConfigFromBackend() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/firebase-config`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.warn("[Firebase] Backend config fetch failed:", err.message);
        return null;
    }
}

export async function initFirebase() {
    if (initialized && firebase.apps.length > 0) return firebase;

    let config = buildConfigFromEnv();

    if (!config.apiKey || !config.projectId) {
        const remote = await fetchConfigFromBackend();
        if (remote) config = { ...config, ...remote };
    }

    const missing = ["apiKey", "authDomain", "projectId", "appId"].filter(
        (k) => !config[k],
    );
    if (missing.length) {
        console.warn(
            "[Firebase] Missing config keys:",
            missing.join(", "),
            "— auth features disabled.",
        );
        initialized = true;
        return null;
    }

    try {
        if (firebase.apps.length === 0) {
            firebase.initializeApp(config);
        }
        initialized = true;
        console.log("[Firebase] Initialized");
        return firebase;
    } catch (err) {
        console.error("[Firebase] init failed:", err);
        initialized = true;
        return null;
    }
}

export { firebase, API_BASE_URL };
export default firebase;