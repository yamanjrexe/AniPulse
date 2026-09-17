export const ACHIEVEMENTS = [
    { id: 'first_anime', icon: 'fa-check-circle', title: '1. First Step', desc: 'Add your first anime.', goal: 1 },
    { id: 'first_complete', icon: 'fa-check-circle', title: '2. First Finish', desc: 'Complete your first anime.', goal: 1 },
    { id: 'first_movie', icon: 'fa-film', title: '3. First Movie', desc: 'Complete your first movie.', goal: 1 },
    { id: 'first_10', icon: 'fa-star', title: '4. Perfect Score', desc: 'Rate an anime 10/10.', goal: 1 },
    { id: 'complete_5', icon: 'fa-check-circle', title: '5. Five Down', desc: 'Complete 5 anime.', goal: 5 },
    { id: 'complete_15', icon: 'fa-check-circle', title: '6. Fifteen Club', desc: 'Complete 15 anime.', goal: 15 },
    { id: 'complete_30', icon: 'fa-check-circle', title: '7. Thirty Strong', desc: 'Complete 30 anime.', goal: 30 },
    { id: 'complete_50', icon: 'fa-trophy', title: '8. Half-Century', desc: 'Complete 50 anime.', goal: 50 },
    { id: 'complete_100', icon: 'fa-trophy', title: '9. Century Mark', desc: 'Complete 100 anime.', goal: 100 },
    { id: 'complete_250', icon: 'fa-crown', title: '10. Quarter Grand', desc: 'Complete 250 anime.', goal: 250 },
    { id: 'complete_500', icon: 'fa-crown', title: '11. Grand Master', desc: 'Complete 500 anime.', goal: 500 },
    { id: 'complete_1000', icon: 'fa-crown', title: '12. Legendary', desc: 'Complete 1000 anime.', goal: 1000 },
    { id: 'ep_100', icon: 'fa-fire', title: '13. 100 Episodes', desc: 'Watch 100 episodes.', goal: 100 },
    { id: 'ep_500', icon: 'fa-fire', title: '14. 500 Episodes', desc: 'Watch 500 episodes.', goal: 500 },
    { id: 'ep_1000', icon: 'fa-fire', title: '15. 1K Episodes', desc: 'Watch 1000 episodes.', goal: 1000 },
    { id: 'ep_5000', icon: 'fa-fire', title: '16. 5K Episodes', desc: 'Watch 5000 episodes.', goal: 5000 },
    { id: 'hour_24', icon: 'fa-clock', title: '17. Day Marathon', desc: 'Watch 24 hours in total.', goal: 24 },
    { id: 'hour_100', icon: 'fa-clock', title: '18. 100 Hours', desc: 'Watch 100 hours.', goal: 100 },
    { id: 'hour_500', icon: 'fa-clock', title: '19. 500 Hours', desc: 'Watch 500 hours.', goal: 500 },
    { id: 'hour_1000', icon: 'fa-clock', title: '20. 1000 Hours', desc: 'Watch 1000 hours.', goal: 1000 },
    { id: 'rate_10', icon: 'fa-star-half-alt', title: '21. 10 Ratings', desc: 'Rate 10 anime.', goal: 10 },
    { id: 'rate_50', icon: 'fa-star-half-alt', title: '22. 50 Ratings', desc: 'Rate 50 anime.', goal: 50 },
    { id: 'genre_5', icon: 'fa-paint-brush', title: '23. 5 Flavors', desc: 'Watch 5 distinct genres.', goal: 5 },
    { id: 'genre_10', icon: 'fa-paint-brush', title: '24. 10 Flavors', desc: 'Watch 10 distinct genres.', goal: 10 },
    { id: 'genre_15', icon: 'fa-paint-brush', title: '25. 15 Flavors', desc: 'Watch 15 distinct genres.', goal: 15 },
    { id: 'genre_20', icon: 'fa-paint-brush', title: '26. 20 Flavors', desc: 'Watch 20 distinct genres.', goal: 20 },
    { id: 'movie_10', icon: 'fa-film', title: '27. Movie Buff', desc: 'Complete 10 movies.', goal: 10 },
    { id: 'tv_10', icon: 'fa-tv', title: '28. TV Addict', desc: 'Complete 10 TV series.', goal: 10 },
    { id: 'streak_7', icon: 'fa-calendar-week', title: '29. 7-Day Streak', desc: '7 consecutive days with a completion.', goal: 7 },
    { id: 'streak_30', icon: 'fa-calendar-alt', title: '30. 30-Day Streak', desc: '30 consecutive days.', goal: 30 },
    { id: 'list_10', icon: 'fa-list', title: '31. 10 in List', desc: 'Have 10 anime in your list.', goal: 10 },
    { id: 'list_25', icon: 'fa-list', title: '32. 25 in List', desc: 'Have 25 anime.', goal: 25 },
    { id: 'list_50', icon: 'fa-list', title: '33. 50 in List', desc: 'Have 50 anime.', goal: 50 },
    { id: 'list_100', icon: 'fa-list', title: '34. 100 in List', desc: 'Have 100 anime.', goal: 100 },
    { id: 'score_9plus', icon: 'fa-thumbs-up', title: '35. Fan Favorite', desc: 'Give 9+ to 10 anime.', goal: 10 },
    { id: 'watching_5', icon: 'fa-eye', title: '36. Multi-Tasker', desc: '5 anime in Watching.', goal: 5 },
    { id: 'plan_10', icon: 'fa-clock', title: '37. Planner', desc: '10 anime in Plan to Watch.', goal: 10 },
    { id: 'dropped_5', icon: 'fa-trash', title: '38. Dropper', desc: 'Drop 5 anime.', goal: 5 }
];

function maxDayStreak(list) {
    const set = new Set();
    list.forEach(a => {
        if (a.userStatus !== 'Completed') return;
        const d = a.actualFinishDate || a.finishDate;
        if (!d) return;
        const dt = new Date(d);
        dt.setHours(0, 0, 0, 0);
        set.add(dt.getTime());
    });
    const sorted = Array.from(set).sort((a, b) => a - b);
    if (!sorted.length) return 0;
    let max = 1, cur = 1;
    for (let i = 1; i < sorted.length; i++) {
        const diff = (sorted[i] - sorted[i - 1]) / 86400000;
        if (diff === 1) { cur++; max = Math.max(max, cur); } else { cur = 1; }
    }
    return max;
}

export function computeAchievementProgress(data) {
    const completed = data.filter(a => a.userStatus === 'Completed');
    const movies = completed.filter(a => a.type === 'Movie').length;
    const tv = completed.filter(a => a.type === 'TV').length;
    const eps = completed.reduce((s, a) => s + (a.episodes || 0), 0);
    const minutes = completed.reduce((s, a) => s + (a.type === 'Movie' ? (a.duration || 120) : (a.episodes || 0) * (a.duration || 20)), 0);
    const hours = minutes / 60;
    const rated = data.filter(a => a.score > 0);
    const genres = new Set();
    data.forEach(a => (a.genres || []).forEach(g => genres.add(g)));
    const score9plus = data.filter(a => a.score >= 9).length;
    const watching = data.filter(a => a.userStatus === 'Watching').length;
    const plan = data.filter(a => a.userStatus === 'Plan to Watch').length;
    const dropped = data.filter(a => a.userStatus === 'Dropped').length;
    const dayStreak = maxDayStreak(data);

    const raw = {
        first_anime: { v: data.length, g: 1 },
        first_complete: { v: completed.length, g: 1 },
        first_movie: { v: movies, g: 1 },
        first_10: { v: data.filter(a => a.score === 10).length, g: 1 },
        complete_5: { v: completed.length, g: 5 },
        complete_15: { v: completed.length, g: 15 },
        complete_30: { v: completed.length, g: 30 },
        complete_50: { v: completed.length, g: 50 },
        complete_100: { v: completed.length, g: 100 },
        complete_250: { v: completed.length, g: 250 },
        complete_500: { v: completed.length, g: 500 },
        complete_1000: { v: completed.length, g: 1000 },
        ep_100: { v: eps, g: 100 },
        ep_500: { v: eps, g: 500 },
        ep_1000: { v: eps, g: 1000 },
        ep_5000: { v: eps, g: 5000 },
        hour_24: { v: hours, g: 24 },
        hour_100: { v: hours, g: 100 },
        hour_500: { v: hours, g: 500 },
        hour_1000: { v: hours, g: 1000 },
        rate_10: { v: rated.length, g: 10 },
        rate_50: { v: rated.length, g: 50 },
        genre_5: { v: genres.size, g: 5 },
        genre_10: { v: genres.size, g: 10 },
        genre_15: { v: genres.size, g: 15 },
        genre_20: { v: genres.size, g: 20 },
        movie_10: { v: movies, g: 10 },
        tv_10: { v: tv, g: 10 },
        streak_7: { v: dayStreak, g: 7 },
        streak_30: { v: dayStreak, g: 30 },
        list_10: { v: data.length, g: 10 },
        list_25: { v: data.length, g: 25 },
        list_50: { v: data.length, g: 50 },
        list_100: { v: data.length, g: 100 },
        score_9plus: { v: score9plus, g: 10 },
        watching_5: { v: watching, g: 5 },
        plan_10: { v: plan, g: 10 },
        dropped_5: { v: dropped, g: 5 }
    };

    const out = {};
    Object.entries(raw).forEach(([id, { v, g }]) => {
        const value = Math.min(v, g);
        const pct = Math.min(100, (v / g) * 100);
        out[id] = { value, goal: g, pct, done: v >= g };
    });
    return out;
}
