const API_BASE_URL = window.API_BASE_URL ||
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'
        : 'https://anipulse-63jv.onrender.com');

class RateLimiter {
    constructor() {
        this.calls = new Map();
        this.defaultLimit = 30;
        this.defaultWindow = 60000;
        this.pendingRequests = new Map();
        this.cache = new Map();
        this.cacheTTL = 30000;
    }

    isAllowed(endpoint, limit = this.defaultLimit, windowMs = this.defaultWindow) {
        const now = Date.now();
        if (!this.calls.has(endpoint)) this.calls.set(endpoint, []);
        const timestamps = this.calls.get(endpoint);
        while (timestamps.length > 0 && timestamps[0] < now - windowMs) timestamps.shift();
        if (timestamps.length >= limit) {
            const waitTime = (timestamps[0] + windowMs) - now;
            if (waitTime > 0) return false;
        }
        timestamps.push(now);
        return true;
    }

    getCache(key) {
        const c = this.cache.get(key);
        return c && Date.now() - c.timestamp < this.cacheTTL ? c.data : null;
    }

    setCache(key, data) {
        this.cache.set(key, { data, timestamp: Date.now() });
        setTimeout(() => {
            const c = this.cache.get(key);
            if (c && Date.now() - c.timestamp >= this.cacheTTL) this.cache.delete(key);
        }, this.cacheTTL);
    }

    clearCache() { this.cache.clear(); }
    reset(endpoint) { this.calls.delete(endpoint); this.pendingRequests.delete(endpoint); }
}

export const rateLimiter = new RateLimiter();

let _fetchOverridden = false;
export function installFetchInterceptors() {
    if (_fetchOverridden || typeof window === 'undefined') return;
    _fetchOverridden = true;
    const originalFetch = window.fetch.bind(window);

    window.fetch = async function (url, options = {}) {
        if (typeof url === 'string' && url.includes('/api/proxy/')) {
            return originalFetch(url, options);
        }

        let finalUrl = url;
        if (typeof url === 'string' && url.startsWith('/')) {
            finalUrl = API_BASE_URL + url;
        } else if (typeof url === 'string' && url.includes('localhost:3000')) {
            finalUrl = url.replace('http://localhost:3000', API_BASE_URL);
        }

        let endpoint = 'unknown';
        if (typeof finalUrl === 'string') {
            const m = finalUrl.match(/\/api\/([^?]+)/);
            endpoint = m ? m[1] : (finalUrl.split('?')[0].split('/').pop() || 'unknown');
        }

        const isApiCall = typeof finalUrl === 'string' && finalUrl.includes('/api/');
        const isStatic = typeof finalUrl === 'string' && /\.(css|js|json|png|jpg|jpeg|svg|webp|ico)$/i.test(finalUrl);
        const isGet = !options.method || options.method === 'GET';

        if (isGet && isApiCall && !isStatic) {
            const cached = rateLimiter.getCache(finalUrl);
            if (cached) {
                return new Response(JSON.stringify(cached), {
                    status: 200, headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        if (isApiCall && !isStatic) {
            let limit = 30, windowMs = 60000;
            if (endpoint.includes('search')) limit = 10;
            else if (endpoint.includes('notifications') || endpoint.includes('requests')) limit = 15;
            else if (['POST', 'PUT', 'DELETE'].includes(options.method)) limit = 20;

            if (!rateLimiter.isAllowed(endpoint, limit, windowMs)) {
                return new Response(JSON.stringify({
                    error: 'Rate limit exceeded. Please try again later.'
                }), { status: 429, headers: { 'Content-Type': 'application/json' } });
            }
        }

        const response = await originalFetch(finalUrl, options);

        if (isGet && response.ok && isApiCall && !isStatic) {
            const clone = response.clone();
            clone.json().then(d => rateLimiter.setCache(finalUrl, d)).catch(() => { });
        }
        return response;
    };
}

export const activeIntervals = new Map();

export function setOptimizedInterval(callback, interval, id) {
    if (activeIntervals.has(id)) clearInterval(activeIntervals.get(id));
    const intervalId = setInterval(() => {
        if (!document.hidden) callback();
    }, interval);
    activeIntervals.set(id, intervalId);
    return () => {
        clearInterval(intervalId);
        activeIntervals.delete(id);
    };
}

export async function batchFriendsStats(friendIds) {
    if (!friendIds || friendIds.length === 0) return [];
    const cacheKey = `batch_stats_${friendIds.join(',')}`;
    const cached = rateLimiter.getCache(cacheKey);
    if (cached) return cached;
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE_URL}/api/user/batch-stats?ids=${friendIds.join(',')}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            rateLimiter.setCache(cacheKey, data);
            return data;
        }
    } catch (e) { console.error('Batch stats failed:', e); }
    return [];
}