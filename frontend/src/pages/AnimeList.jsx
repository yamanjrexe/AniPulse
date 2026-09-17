import React, { useState, useEffect, useMemo } from "react";
import { useAnime } from "../context/AnimeContext.jsx";
import AnimeTable from "../components/anime/AnimeTable.jsx";

const STORAGE_QUERY = "anipulse_search_query";

const MONTHS = [
    "01",
    "02",
    "03",
    "04",
    "05",
    "06",
    "07",
    "08",
    "09",
    "10",
    "11",
    "12",
];
const MONTH_NAMES = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

// ─── Helper: current month/year strings ────────────────────
function currentMonth() {
    return String(new Date().getMonth() + 1).padStart(2, "0");
}
function currentYear() {
    return String(new Date().getFullYear());
}

export default function AnimeList() {
    const { animeData } = useAnime();

    // ─── Filter state — ALWAYS starts on current month/year ────
    // No localStorage → every refresh resets to "now"
    const [status, setStatus] = useState("all");
    const [month, setMonth] = useState(currentMonth);
    const [year, setYear] = useState(currentYear);

    // ─── Query (search) still persists across refresh ────────
    const [query, setQuery] = useState(
        () => localStorage.getItem(STORAGE_QUERY) || "",
    );

    useEffect(() => {
        const onSearchChange = (e) => setQuery(e.detail.query || "");
        window.addEventListener("globalSearchChange", onSearchChange);
        return () =>
            window.removeEventListener("globalSearchChange", onSearchChange);
    }, []);

    // ─── Year options: computed from data + current year ─────
    const yearOptions = useMemo(() => {
        const s = new Set([currentYear()]);

        animeData.forEach((a) => {
            const d = a.actualFinishDate || a.finishDate;
            if (!d) return;
            const y = parseInt(d.split("-")[0], 10);
            if (!isNaN(y)) s.add(String(y));
        });

        // Keep the currently-selected year visible even if user typed it
        if (year !== "all") s.add(String(year));

        return Array.from(s).sort((a, b) => Number(b) - Number(a));
    }, [animeData, year]);

    // ─── Filtering ────────────────────────────────────────────
    const filtered = useMemo(() => {
        let list = [...animeData];

        // 1) Status
        if (status !== "all") {
            list = list.filter((a) => a.userStatus === status);
        }

        // 2) Search overrides month/year
        if (query.trim()) {
            const q = query.toLowerCase();
            return list.filter((a) => a.title.toLowerCase().includes(q));
        }

        // 3) Month/Year — non-completed always visible
        if (month !== "all" || year !== "all") {
            list = list.filter((a) => {
                if (a.userStatus !== "Completed") return true;
                const dateStr =
                    a.actualFinishDate || a.finishDate || a.completedTimestamp;
                if (!dateStr) return false;
                const d = new Date(dateStr);
                if (isNaN(d.getTime())) return false;
                if (year !== "all" && d.getFullYear() !== parseInt(year))
                    return false;
                if (month !== "all" && d.getMonth() + 1 !== parseInt(month))
                    return false;
                return true;
            });
        }

        return list;
    }, [animeData, status, month, year, query]);

    const onEdit = (a) =>
        window.dispatchEvent(
            new CustomEvent("openEditAnimeModal", { detail: { id: a.id } }),
        );

    return (
        <div className="anime-list-container">
            <div className="anime-list-header">
                <div className="anime-list-title">
                    <h2>
                        <i className="fa fa-list-ul" /> Anime List
                    </h2>
                </div>

                <div className="anime-filters">
                    {/* Status */}
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                    >
                        <option value="all">All</option>
                        <option value="Completed">Completed</option>
                        <option value="Watching">Watching</option>
                        <option value="Plan to Watch">Plan to Watch</option>
                        <option value="Dropped">Dropped</option>
                    </select>

                    {/* Month */}
                    <select
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                    >
                        <option value="all">All Months</option>
                        {MONTHS.map((m, i) => (
                            <option key={m} value={m}>
                                {MONTH_NAMES[i]}
                            </option>
                        ))}
                    </select>

                    {/* Year — dynamic */}
                    <select
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                    >
                        <option value="all">All Years</option>
                        {yearOptions.map((y) => (
                            <option key={y} value={y}>
                                {y}
                            </option>
                        ))}
                    </select>

                    {/* Count + active search */}
                    <div className="anime-counter">
                        Total Anime: {filtered.length}
                    </div>
                </div>
            </div>

            <AnimeTable items={filtered} onEdit={onEdit} />
        </div>
    );
}
