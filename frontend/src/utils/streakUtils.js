const STREAK_KEY = "streak";
const LAST_ACTIVE_KEY = "lastActive";

export function dateKey(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

export function yesterdayKey(d = new Date()) {
    const y = new Date(d);
    y.setDate(y.getDate() - 1);
    return dateKey(y);
}

export function normalizeLastActive(value) {
    if (!value || typeof value !== "string") return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const t = Date.parse(value);
    return Number.isNaN(t) ? null : dateKey(new Date(t));
}

export function readLocalStreak() {
    return {
        streak: parseInt(localStorage.getItem(STREAK_KEY) || "0", 10) || 0,
        lastActive: normalizeLastActive(localStorage.getItem(LAST_ACTIVE_KEY)),
    };
}

export function writeLocalStreak({ streak, lastActive }) {
    localStorage.setItem(STREAK_KEY, String(streak));
    if (lastActive) localStorage.setItem(LAST_ACTIVE_KEY, lastActive);
    else localStorage.removeItem(LAST_ACTIVE_KEY);
}

function daysBetween(a, b) {
    if (!a || !b) return Infinity;
    return Math.abs(Math.round((Date.parse(b) - Date.parse(a)) / 86400000));
}

export function reconcileAndBump({ local, server, now = new Date() }) {
    const today = dateKey(now);
    const yesterday = yesterdayKey(now);

    const localStreak = local?.streak || 0;
    const localLast = local?.lastActive || null;

    const serverStreak = server?.streak || 0;
    const serverLast = server?.lastActive
        ? normalizeLastActive(server.lastActive)
        : null;

    if (serverLast === today) {
        return { streak: serverStreak, lastActive: today, changed: false };
    }

    if (serverLast === yesterday) {
        return {
            streak: serverStreak + 1,
            lastActive: today,
            changed: true,
        };
    }

    if (localLast === today) {
        const gap = daysBetween(serverLast, today);
        if (serverStreak > localStreak && gap <= 2) {
            return {
                streak: serverStreak,
                lastActive: today,
                changed: true,
            };
        }
        return { streak: localStreak, lastActive: today, changed: false };
    }

    if (localLast === yesterday) {
        const base = Math.max(localStreak, serverStreak);
        return { streak: base + 1, lastActive: today, changed: true };
    }

    if (!localLast && serverStreak > 1) {
        const gap = daysBetween(serverLast, today);
        if (gap <= 2) {
            return {
                streak: serverStreak + 1,
                lastActive: today,
                changed: true,
            };
        }
        return { streak: 1, lastActive: today, changed: true };
    }

    return { streak: 1, lastActive: today, changed: true };
}