import { firebase, API_BASE_URL } from "../firebaseClient.js";

function buildUrl(endpoint) {
    if (typeof endpoint !== "string") return endpoint;
    if (endpoint.startsWith("http://") || endpoint.startsWith("https://"))
        return endpoint;
    if (endpoint.startsWith("/api/")) return API_BASE_URL + endpoint;
    if (endpoint.startsWith("/")) return API_BASE_URL + "/api" + endpoint;
    return API_BASE_URL + "/api/" + endpoint;
}

async function request(endpoint, options = {}) {
    const url = buildUrl(endpoint);
    const token = localStorage.getItem("authToken");

    const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
    };

    let res;
    try {
        res = await fetch(url, { ...options, headers });
    } catch (e) {
        throw new Error("Failed to fetch");
    }

    if (res.status === 401) {
        const fbUser = firebase?.auth?.().currentUser;
        if (fbUser) {
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
            } catch (_) {
                /* fall through */
            }
        }
        localStorage.removeItem("authToken");
        if (!window.location.pathname.startsWith("/login")) {
            window.location.href = "/login";
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
    get: (ep) => request(ep, { method: "GET" }),
    post: (ep, body) =>
        request(ep, { method: "POST", body: JSON.stringify(body) }),
    put: (ep, body) =>
        request(ep, { method: "PUT", body: JSON.stringify(body) }),
    del: (ep) => request(ep, { method: "DELETE" }),
};

export { API_BASE_URL };