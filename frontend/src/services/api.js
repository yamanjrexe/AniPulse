import { firebase, API_BASE_URL } from "../firebaseClient.js";

function buildUrl(endpoint) {
    if (typeof endpoint !== "string") return endpoint;
    if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) return endpoint;
    if (endpoint.startsWith("/api/")) return API_BASE_URL + endpoint;
    if (endpoint.startsWith("/")) return API_BASE_URL + "/api" + endpoint;
    return API_BASE_URL + "/api/" + endpoint;
}

async function waitForFirebaseUser(timeoutMs = 5000) {
    let user = firebase?.auth?.().currentUser;
    if (user) return user;

    return new Promise((resolve) => {
        let resolved = false;
        const done = (u) => {
            if (resolved) return;
            resolved = true;
            resolve(u || firebase?.auth?.().currentUser || null);
        };

        const timeout = setTimeout(() => done(null), timeoutMs);

        try {
            const unsub = firebase.auth().onAuthStateChanged((u) => {
                clearTimeout(timeout);
                unsub();
                done(u);
            });
        } catch (_) {
            clearTimeout(timeout);
            done(null);
        }
    });
}

async function request(endpoint, options = {}) {
    const url = buildUrl(endpoint);
    const token = localStorage.getItem("authToken");

    const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
    };

    const timeoutMs = options.timeout || 10000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let res;
    try {
        res = await fetch(url, { ...options, headers, signal: controller.signal });
    } catch (e) {
        if (e.name === "AbortError") {
            throw new Error("Request timed out. The server is taking too long.");
        }
        throw new Error("Failed to fetch. Check your internet.");
    } finally {
        clearTimeout(timeoutId);
    }

    if (res.status === 401) {
        let fbUser = await waitForFirebaseUser(5000);

        if (fbUser) {
            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    const newToken = await fbUser.getIdToken(true);
                    localStorage.setItem("authToken", newToken);

                    const retry = await fetch(url, {
                        ...options,
                        headers: {
                            ...headers,
                            Authorization: `Bearer ${newToken}`,
                        },
                    });

                    if (retry.ok) return retry.json();

                    if (retry.status !== 401) {
                        const errData = await retry.json().catch(() => ({}));
                        throw new Error(errData.error || `Request failed (${retry.status})`);
                    }
                } catch (err) {
                    if (attempt === 2) {
                        console.warn("[api] Token refresh failed after 3 attempts:", err.message);
                    } else {
                        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
                    }
                }
            }
        }

        const stillHasUser = firebase?.auth?.().currentUser;
        if (!stillHasUser) {
            const hadToken = !!localStorage.getItem("authToken");
            if (hadToken) {
                await new Promise((r) => setTimeout(r, 800));
                const secondCheck = firebase?.auth?.().currentUser;
                if (!secondCheck) {
                    localStorage.removeItem("authToken");
                    localStorage.removeItem("user");
                    if (!window.location.pathname.startsWith("/login")) {
                        window.location.href = "/login";
                    }
                }
            }
        }

        throw new Error("Session expired");
    }

    if (res.status === 429) {
        return { queued: true, message: "Rate limited" };
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
}

export const api = {
    get: (ep, options = {}) => request(ep, { ...options, method: "GET" }),
    post: (ep, body, options = {}) => request(ep, { ...options, method: "POST", body: JSON.stringify(body) }),
    put: (ep, body, options = {}) => request(ep, { ...options, method: "PUT", body: JSON.stringify(body) }),
    del: (ep, options = {}) => request(ep, { ...options, method: "DELETE" }),
};

export { API_BASE_URL };