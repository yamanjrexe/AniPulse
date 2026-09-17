/**
 * Recap data + slide generation.
 * Ported from Frontend/Js/pages/recap.js — logic preserved verbatim.
 */

export const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const RECAP_WINDOW_DAYS = 7;

// ─── Date helpers ─────────────────────────────────────
export function getCompletionTime(anime) {
    if (anime.actualFinishDate && /^\d{4}-\d{2}-\d{2}$/.test(anime.actualFinishDate)) {
        const [y, m, d] = anime.actualFinishDate.split('-').map(Number);
        return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999)).getTime();
    }
    if (anime.finishDate) {
        const parts = anime.finishDate.split('-');
        if (parts.length >= 2) {
            const y = parseInt(parts[0]);
            const m = parseInt(parts[1]) - 1;
            const d = parts.length === 3 ? parseInt(parts[2]) : 1;
            if (!isNaN(y) && !isNaN(m) && m >= 0 && m <= 11) {
                return new Date(Date.UTC(y, m, d, 23, 59, 59, 999)).getTime();
            }
        }
    }
    if (anime.completedTimestamp) {
        const ts = parseInt(anime.completedTimestamp);
        if (!isNaN(ts)) return ts;
    }
    return null;
}

export function isRecapWindowOpen() {
    return new Date().getDate() <= RECAP_WINDOW_DAYS;
}

export function getPreviousMonthForRecap() {
    const now = new Date();
    let month = now.getMonth() - 1;
    let year = now.getFullYear();
    if (month < 0) { month = 11; year--; }
    return { month, year };
}

export function getPreviousYearForRecap() {
    return new Date().getFullYear() - 1;
}

// ─── Data builders ────────────────────────────────────
function buildComprehensiveRecap(list, type, periodInfo = {}) {
    const isYearly = type === 'Yearly';
    const monthName = !isYearly && typeof periodInfo.month === 'number'
        ? MONTH_NAMES[periodInfo.month] : null;

    if (!list.length) {
        return {
            totalAnime: 0, totalHours: 0, totalEpisodes: 0, avgEpisodesPerDay: 0,
            avgScore: 0, topGenre: '—', secondGenre: '—', thirdGenre: '—',
            topAnime: null, secondAnime: null, thirdAnime: null,
            completionMonth: null, animeByScore: [],
            avgDuration: 0, streakDays: 0, monthName, year: periodInfo.year, type
        };
    }

    const totalEpisodes = list.reduce((s, a) => s + (a.episodes || 0), 0);
    const totalMinutes = list.reduce((s, a) => s + (a.episodes * (a.duration || 0)), 0);
    const totalHours = totalMinutes / 60;

    const scored = list.filter(a => a.score && a.score > 0);
    const avgScore = scored.length
        ? (scored.reduce((s, a) => s + a.score, 0) / scored.length).toFixed(1)
        : 0;

    const genres = {};
    list.forEach(a => (a.genres || []).forEach(g => { genres[g] = (genres[g] || 0) + 1; }));
    const topGenres = Object.entries(genres).sort((a, b) => b[1] - a[1]);

    const animeByScore = [...list]
        .filter(a => a.score && a.score > 0)
        .sort((a, b) => (b.score || 0) - (a.score || 0));

    const daysInPeriod = isYearly
        ? 365
        : new Date(periodInfo.year, periodInfo.month + 1, 0).getDate();
    const avgEpisodesPerDay = (totalEpisodes / daysInPeriod).toFixed(1);
    const avgDuration = (list.reduce((s, a) => s + (a.duration || 0), 0) / list.length).toFixed(0);

    let completionMonth = null;
    if (isYearly) {
        const months = {};
        list.forEach(a => {
            const t = getCompletionTime(a);
            if (t) {
                const m = new Date(t).getMonth();
                months[m] = (months[m] || 0) + 1;
            }
        });
        const busiest = Object.entries(months).sort((a, b) => b[1] - a[1])[0];
        if (busiest) completionMonth = MONTH_NAMES[parseInt(busiest[0])];
    }

    const completionDays = new Set();
    list.forEach(a => {
        const t = getCompletionTime(a);
        if (t) completionDays.add(new Date(t).toISOString().split('T')[0]);
    });

    return {
        totalAnime: list.length,
        totalHours: totalHours.toFixed(1),
        totalEpisodes,
        avgEpisodesPerDay,
        avgScore,
        topGenre: topGenres[0]?.[0] || '—',
        secondGenre: topGenres[1]?.[0] || '—',
        thirdGenre: topGenres[2]?.[0] || '—',
        topAnime: animeByScore[0] || null,
        secondAnime: animeByScore[1] || null,
        thirdAnime: animeByScore[2] || null,
        completionMonth,
        animeByScore: animeByScore.slice(0, 3),
        avgDuration,
        streakDays: completionDays.size,
        monthName,
        year: periodInfo.year,
        type
    };
}

export function getMonthlyRecap(animeData, year, month) {
    const start = new Date(year, month, 1).getTime();
    const end = new Date(year, month + 1, 0, 23, 59, 59).getTime();
    const completed = (animeData || []).filter(a => {
        if (a.userStatus !== 'Completed') return false;
        const t = getCompletionTime(a);
        return t && t >= start && t <= end;
    });
    return buildComprehensiveRecap(completed, 'Monthly', { month, year });
}

export function getYearlyRecap(animeData, year) {
    const start = new Date(year, 0, 1).getTime();
    const end = new Date(year, 11, 31, 23, 59, 59).getTime();
    const completed = (animeData || []).filter(a => {
        if (a.userStatus !== 'Completed') return false;
        const t = getCompletionTime(a);
        return t && t >= start && t <= end;
    });
    return buildComprehensiveRecap(completed, 'Yearly', { year });
}

// ─── Slide blueprint generator ────────────────────────
/**
 * Returns an array of { type, data } describing 12 slides.
 * The React renderer maps type → component.
 */
export function buildRecapSlides(data, type, periodInfo = {}) {
    const periodText = data.monthName
        ? `${data.monthName} ${data.year}`
        : `${data.year}`;
    const isYearly = type === 'Yearly';

    if (data.totalAnime === 0) {
        return [
            { type: 'empty', data: { periodText, isYearly } },
            { type: 'tip', data: { icon: 'fa-search', title: 'Explore New Titles', subtitle: 'Discover hidden gems' } },
            { type: 'tip', data: { icon: 'fa-bullseye', title: 'Set Watching Goals', subtitle: `Plan for next ${isYearly ? 'year' : 'month'}` } },
            { type: 'tip', data: { icon: 'fa-heart', title: 'Find Your Genre', subtitle: 'What do you enjoy most?' } },
            { type: 'tip', data: { icon: 'fa-clock', title: 'Manage Your Time', subtitle: 'Balance watching schedule' } },
            { type: 'tip', data: { icon: 'fa-users', title: 'Join Communities', subtitle: 'Share with other fans' } },
            { type: 'tip', data: { icon: 'fa-star', title: 'Rate As You Watch', subtitle: 'Track your favorites' } },
            { type: 'tip', data: { icon: 'fa-tags', title: 'Organize Your List', subtitle: 'Keep everything tidy' } },
            { type: 'tip', data: { icon: 'fa-calendar-check', title: 'Mark Completion Dates', subtitle: 'For accurate recaps' } },
            { type: 'tip', data: { icon: 'fa-chart-bar', title: 'Watch Progress Grow', subtitle: 'See your journey unfold' } },
            { type: 'tip', data: { icon: 'fa-trophy', title: 'Achievements Await', subtitle: 'Unlock new milestones' } },
            { type: 'closing-empty', data: { periodText, isYearly } }
        ];
    }

    return [
        { type: 'welcome', data: { periodText, isYearly, data } },
        { type: 'completed', data: { data, isYearly } },
        { type: 'hours', data: { data } },
        { type: 'avgscore', data: { data } },
        { type: 'topgenre', data: { data } },
        { type: 'topanime', data: { data } },
        { type: 'activedays', data: { data, isYearly } },
        { type: 'avgduration', data: { data } },
        { type: 'secondanime', data: { data } },
        { type: 'consistency', data: { data, isYearly } },
        { type: 'thirdanime', data: { data } },
        { type: 'closing', data: { data, periodText, isYearly } }
    ];
}
