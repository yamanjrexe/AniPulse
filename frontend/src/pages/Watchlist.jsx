import React, { useState, useMemo, useEffect } from "react";
import { useAnime } from "../context/AnimeContext.jsx";
import AnimeCard from "../components/anime/AnimeCard.jsx";
import Pagination from "../components/ui/Pagination.jsx";

const PER_PAGE = 30;
const FILTERS = [
  { k: "all", l: "All" },
  { k: "Watching", l: "Watching" },
  { k: "On-Hold", l: "On-Hold" },
  { k: "Plan to Watch", l: "Plan to Watch" },
  { k: "Dropped", l: "Dropped" },
  { k: "Completed", l: "Completed" },
];

export default function Watchlist() {
  const { animeData } = useAnime();
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  const filtered = useMemo(() => {
    let list = [...animeData];
    if (status !== "all") list = list.filter((a) => a.userStatus === status);
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter((a) => a.title.toLowerCase().includes(q));
    }
    return list.reverse();
  }, [animeData, status, debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE) || 1;
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="dashboard-section">
      <h2 className="section-title">
        <i className="fas fa-heart" /> Watch List
      </h2>

      <div className="watchlist-filters">
        {FILTERS.map((f) => (
          <button
            key={f.k}
            className={`filter-btn ${status === f.k ? "active" : ""}`}
            onClick={() => setStatus(f.k)}
          >
            {f.l}
          </button>
        ))}
        <div className="watchlist-search">
          <i className="fas fa-search search-icon" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search anime..."
          />
        </div>
      </div>

      {animeData.length > 0 && (
        <div
          style={{
            textAlign: "center",
            margin: "24px 0 16px 0",
            color: "var(--text-muted)",
            fontSize: "0.95rem",
            fontWeight: "500",
            letterSpacing: "0.02em",
            animation: "fadeIn 0.3s ease-out",
          }}
        >
          {filtered.length} {filtered.length === 1 ? "anime" : "anime"} found
        </div>
      )}

      <div className="top-anime-grid">
        {pageItems.map((a) => (
          <AnimeCard
            key={a.id}
            anime={a}
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("openEditAnimeModal", {
                  detail: { id: a.id },
                }),
              )
            }
          />
        ))}

        {/* UPDATED EMPTY STATES */}
        {pageItems.length === 0 && (
          <div
            className="no-anime"
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: "60px 20px",
            }}
          >
            {animeData.length === 0 ? (
              <>
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
                  Your Watch List is empty
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
              </>
            ) : (
              <>
                <i
                  className="fas fa-search"
                  style={{
                    fontSize: "3rem",
                    opacity: 0.5,
                    marginBottom: "16px",
                    display: "block",
                  }}
                />
                <h3 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>
                  No anime found
                </h3>
                <p style={{ opacity: 0.7 }}>
                  No anime matches your current filters or search.
                </p>
              </>
            )}
          </div>
        )}
      </div>

      <div className="pagination-container">
        <Pagination
          totalPages={totalPages}
          activePage={page}
          onChange={setPage}
        />
      </div>
    </div>
  );
}
