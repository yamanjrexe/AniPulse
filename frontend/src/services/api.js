// ============================================
// API SERVICE — centralized fetch wrapper
// ============================================

export const API_BASE_URL =
    process.env.REACT_APP_API_URL ||
    (typeof window !== 'undefined' && window.API_BASE_URL) ||
    (typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:3000'
        : 'https://anipulse-63jv.onrender.com');

// Smart URL builder — handles all endpoint formats
function buildUrl(endpoint) {
    if (typeof endpoint !== 'string') return endpoint;
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) return endpoint;
    if (endpoint.startsWith('/api/')) return API_BASE_URL + endpoint;
    if (endpoint.startsWith('/')) return API_BASE_URL + '/api' + endpoint;
    return API_BASE_URL + '/api/' + endpoint;
}

async function request(endpoint, options = {}) {
    const url = buildUrl(endpoint);
    const token = localStorage.getItem('authToken');

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
    };

    let res;
    try {
        res = await fetch(url, { ...options, headers });
    } catch (e) {
        throw new Error('Failed to fetch');
    }

    // 401 → refresh token or redirect to /login
    if (res.status === 401) {
        const fbUser = window.firebase?.auth?.().currentUser;
        if (fbUser) {
            try {
                const newToken = await fbUser.getIdToken(true);
                localStorage.setItem('authToken', newToken);
                const retry = await fetch(url, {
                    ...options,
                    headers: { ...headers, Authorization: `Bearer ${newToken}` },
                });
                if (retry.ok) return retry.json();
            } catch (_) { /* fall through */ }
        }
        localStorage.removeItem('authToken');
        if (!window.location.pathname.startsWith('/login')) {
            window.location.href = '/login';
        }
        throw new Error('Session expired');
    }

    // 429 rate-limited
    if (res.status === 429) {
        return { queued: true, message: 'Rate limited' };
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
}

export const api = {
    get: (ep) => request(ep, { method: 'GET' }),
    post: (ep, body) => request(ep, { method: 'POST', body: JSON.stringify(body) }),
    put: (ep, body) => request(ep, { method: 'PUT', body: JSON.stringify(body) }),
    del: (ep) => request(ep, { method: 'DELETE' }),
};