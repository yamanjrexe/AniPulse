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

function currentMonth() {
  return String(new Date().getMonth() + 1).padStart(2, "0");
}
function currentYear() {
  return String(new Date().getFullYear());
}

export default function AnimeList() {
  const { animeData } = useAnime();

  const [status, setStatus] = useState("all");
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [genre, setGenre] = useState("all"); 

  const [query, setQuery] = useState(
    () => localStorage.getItem(STORAGE_QUERY) || "",
  );

  useEffect(() => {
    const onSearchChange = (e) => setQuery(e.detail.query || "");
    window.addEventListener("globalSearchChange", onSearchChange);
    return () =>
      window.removeEventListener("globalSearchChange", onSearchChange);
  }, []);

  const genreOptions = useMemo(() => {
    const s = new Set();
    animeData.forEach((a) => {
      if (Array.isArray(a.genres)) {
        a.genres.forEach((g) => {
          if (g) s.add(g);
        });
      }
    });
    return Array.from(s).sort();
  }, [animeData]);

  const yearOptions = useMemo(() => {
    const s = new Set([currentYear()]);

    animeData.forEach((a) => {
      const d = a.actualFinishDate || a.finishDate;
      if (!d) return;
      const y = parseInt(d.split("-")[0], 10);
      if (!isNaN(y)) s.add(String(y));
    });

    if (year !== "all") s.add(String(year));

    return Array.from(s).sort((a, b) => Number(b) - Number(a));
  }, [animeData, year]);

  const filtered = useMemo(() => {
    let list = [...animeData];

    if (status !== "all") {
      list = list.filter((a) => a.userStatus === status);
    }

    if (genre !== "all") {
      list = list.filter((a) => a.genres && a.genres.includes(genre));
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      return list.filter((a) => a.title.toLowerCase().includes(q));
    }

    if (month !== "all" || year !== "all") {
      list = list.filter((a) => {
        if (a.userStatus !== "Completed") return true;
        const dateStr =
          a.actualFinishDate || a.finishDate || a.completedTimestamp;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return false;
        if (year !== "all" && d.getFullYear() !== parseInt(year)) return false;
        if (month !== "all" && d.getMonth() + 1 !== parseInt(month))
          return false;
        return true;
      });
    }

    return list;
  }, [animeData, status, genre, month, year, query]);

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
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="Completed">Completed</option>
            <option value="Watching">Watching</option>
            <option value="Plan to Watch">Plan to Watch</option>
            <option value="Dropped">Dropped</option>
          </select>

          <select value={genre} onChange={(e) => setGenre(e.target.value)}>
            <option value="all">All Genres</option>
            {genreOptions.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          <select value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="all">All Months</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={m}>
                {MONTH_NAMES[i]}
              </option>
            ))}
          </select>

          <select value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="all">All Years</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <div className="anime-counter">Total Anime: {filtered.length}</div>
        </div>
      </div>

      {animeData.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            background: "var(--bg-card)",
            borderRadius: "12px",
            border: "1px dashed var(--border-default)",
            marginTop: "20px",
          }}
        >
          <i
            className="fas fa-folder-open"
            style={{
              fontSize: "3rem",
              opacity: 0.5,
              marginBottom: "16px",
              display: "block",
              color: "var(--brand-yellow)",
            }}
          />
          <h3 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>
            Your Anime List is empty
          </h3>
          <p style={{ opacity: 0.7, marginBottom: "20px" }}>
            You haven't added any anime yet.
          </p>
          <button
            className="btn btn-primary"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("openAddAnimeModal"))
            }
          >
            <i className="fas fa-plus" /> Add Your First Anime
          </button>
        </div>
      ) : (
        <AnimeTable items={filtered} onEdit={onEdit} />
      )}
    </div>
  );
}
