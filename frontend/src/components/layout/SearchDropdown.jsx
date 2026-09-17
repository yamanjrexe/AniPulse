import React, { useRef, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const STORAGE_KEY = "anipulse_search_query";

export default function SearchDropdown() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState(
        () => localStorage.getItem(STORAGE_KEY) || "",
    );
    const ref = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    // ─── Persist query + broadcast to listeners (AnimeList) ──
    useEffect(() => {
        if (query) {
            localStorage.setItem(STORAGE_KEY, query);
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
        window.dispatchEvent(
            new CustomEvent("globalSearchChange", { detail: { query } }),
        );
    }, [query]);

    // ─── Close on outside click ───────────────────────────────
    useEffect(() => {
        const onClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("click", onClick);
        return () => document.removeEventListener("click", onClick);
    }, []);

    // ─── Ctrl/Cmd+K → focus, Escape → clear+blur ─────────────
    useEffect(() => {
        const onKey = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                setOpen(true);
                setTimeout(
                    () => ref.current?.querySelector("input")?.focus(),
                    50,
                );
            }
            if (
                e.key === "Escape" &&
                document.activeElement?.id === "dashboardSearch"
            ) {
                setQuery("");
                document.activeElement.blur();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // ─── Handle input ─────────────────────────────────────────
    const handleChange = (e) => {
        const value = e.target.value;
        setQuery(value);

        // If typing and not on anime-list page, navigate there
        if (value.trim() && location.pathname !== "/anime-list") {
            navigate("/anime-list");
        }
    };

    return (
        <div
            ref={ref}
            className="search-trigger"
            role="button"
            aria-label="Search"
            tabIndex={0}
            onClick={() => setOpen((v) => !v)}
        >
            <i className="fas fa-search" aria-hidden="true" />
            <div className={`search-dropdown ${open ? "open" : ""}`}>
                <div
                    className="search-input-wrapper"
                    onClick={(e) => e.stopPropagation()}
                >
                    <input
                        type="text"
                        id="dashboardSearch"
                        value={query}
                        onChange={handleChange}
                        placeholder="Search anime..."
                        aria-label="Search anime"
                        autoComplete="off"
                    />
                </div>
            </div>
        </div>
    );
}
