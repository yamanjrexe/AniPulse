import React, { useState, useEffect, useRef, useCallback } from "react";
import Modal from "../ui/Modal.jsx";
import ConfirmDialog from "../ui/ConfirmDialog.jsx";
import { useAnime } from "../../context/AnimeContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { useLevel } from "../../context/LevelContext.jsx";
import { useSync } from "../../context/SyncContext.jsx";
import { searchAniList } from "../../services/anilist.js";
import { animeService } from "../../services/animeService.js";
import { openDayPrompt } from "../ui/DayPromptModal.jsx";

const DEFAULT_DURATION = {
    Movie: 120,
    TV_SHORT: 12,
    TV: 20,
    OVA: 20,
    ONA: 20,
    Special: 20,
};

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

const isDurationEditable = (type) => type === "Movie";

function defaultForm() {
    const now = new Date();
    return {
        title: "",
        type: "TV",
        episodes: 1,
        duration: 20,
        userStatus: "Plan to Watch",
        progress: 0,
        score: "",
        cover: "",
        genres: "",
        year: String(now.getFullYear()),
        month: String(now.getMonth() + 1).padStart(2, "0"),
    };
}

async function resolveActualFinishDate(year, month) {
    const now = new Date();
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);

    if (isNaN(y) || isNaN(m) || m < 1 || m > 12) {
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    }
    if (y === now.getFullYear() && m === now.getMonth() + 1) {
        return `${y}-${String(m).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    }
    const day = await openDayPrompt();
    if (day === null) return null;
    return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatTimestamp() {
    const now = new Date();
    const y = now.getFullYear();
    const mo = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const h = String(now.getHours()).padStart(2, "0");
    const mi = String(now.getMinutes()).padStart(2, "0");
    const s = String(now.getSeconds()).padStart(2, "0");
    return `${y}-${mo}-${d} ${h}:${mi}:${s}`;
}

export default function AnimeModal() {
    const { animeData, setAnimeData, logActivity } = useAnime();
    const { showToast } = useToast();
    const { awardXP, recalc } = useLevel();
    const { syncToCloud } = useSync();

    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const abortRef = useRef(null);
    const searchTimeoutRef = useRef(null);
    const closeLockRef = useRef(0);

    const [form, setForm] = useState(defaultForm());

    // ============================================================
    // LIVE REFS — read these inside event handlers instead of
    // closing over state, so a stale listener can never write an
    // old `animeData` snapshot into the form.
    // ============================================================
    const animeDataRef = useRef(animeData);
    const openRef = useRef(open);
    const editingRef = useRef(editing);

    useEffect(() => {
        animeDataRef.current = animeData;
    }, [animeData]);

    useEffect(() => {
        openRef.current = open;
    }, [open]);

    useEffect(() => {
        editingRef.current = editing;
    }, [editing]);

    // ============================================================
    // RESET STATE
    // ============================================================
    const resetState = useCallback(() => {
        setEditing(null);
        setForm(defaultForm());
        setQuery("");
        setResults([]);
        setSearching(false);
        setSubmitting(false);
        setConfirmDelete(false);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = null;
        }
        if (abortRef.current) {
            abortRef.current.abort();
            abortRef.current = null;
        }
    }, []);

    // ============================================================
    // CLOSE — sets a lock so a stray re-dispatch can't reopen.
    // ============================================================
    const close = useCallback(() => {
        closeLockRef.current = Date.now() + 500;
        setOpen(false);
        resetState();
    }, [resetState]);

    // ============================================================
    // OPEN LISTENERS — registered ONCE, read live state via refs.
    // ============================================================
    useEffect(() => {
        const onNew = () => {
            if (openRef.current) return; // already open ? duplicate event
            if (Date.now() < closeLockRef.current) return; // just closed ? stray re-dispatch

            resetState();
            setOpen(true);
        };

        const onEdit = (e) => {
            const id = e.detail?.id;

            // Already editing this exact anime ? duplicate event, ignore.
            if (
                openRef.current &&
                editingRef.current &&
                String(editingRef.current.id) === String(id)
            ) {
                return;
            }

            if (Date.now() < closeLockRef.current) return;

            // ALWAYS read the freshest list, never the closure.
            const anime = animeDataRef.current.find(
                (a) => String(a.id) === String(id),
            );

            if (!anime) {
                showToast("Anime not found", "error");
                return;
            }

            setEditing(anime);
            setForm({
                title: anime.title || "",
                type: anime.type || "TV",
                episodes: anime.episodes || 0,
                duration: anime.duration || DEFAULT_DURATION[anime.type] || 20,
                userStatus: anime.userStatus || "Plan to Watch",
                progress: anime.progress || 0,
                score: anime.score != null ? String(anime.score) : "",
                cover: anime.cover || "",
                genres: Array.isArray(anime.genres)
                    ? anime.genres.join(", ")
                    : "",
                year:
                    (anime.finishDate || "").split("-")[0] ||
                    String(new Date().getFullYear()),
                month:
                    (anime.finishDate || "").split("-")[1] ||
                    String(new Date().getMonth() + 1).padStart(2, "0"),
            });
            setQuery("");
            setResults([]);
            setSearching(false);
            setSubmitting(false);
            setConfirmDelete(false);
            setOpen(true);
        };

        window.addEventListener("openAddAnimeModal", onNew);
        window.addEventListener("openEditAnimeModal", onEdit);
        return () => {
            window.removeEventListener("openAddAnimeModal", onNew);
            window.removeEventListener("openEditAnimeModal", onEdit);
        };
    }, [resetState, showToast]); // stable deps only — no animeData

    // ============================================================
    // DEBOUNCED SEARCH
    // ============================================================
    useEffect(() => {
        if (editing) return;

        const q = (query || "").trim();
        if (q.length < 2) {
            setResults([]);
            setSearching(false);
            return;
        }

        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        searchTimeoutRef.current = setTimeout(async () => {
            setSearching(true);
            try {
                abortRef.current?.abort();
                const controller = new AbortController();
                abortRef.current = controller;

                const r = await searchAniList(q, { signal: controller.signal });

                if (!controller.signal.aborted) {
                    setResults(r || []);
                }
            } catch (err) {
                if (err?.name !== "AbortError") {
                    console.warn("[AnimeModal] search failed:", err);
                    setResults([]);
                }
            } finally {
                setSearching(false);
            }
        }, 300);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
                searchTimeoutRef.current = null;
            }
        };
    }, [query, editing]);

    // ============================================================
    // FORM HELPERS
    // ============================================================
    const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

    const handleTypeChange = (newType) =>
        setForm((f) => ({
            ...f,
            type: newType,
            duration: DEFAULT_DURATION[newType] ?? 20,
        }));

    const handleEpisodesChange = (value) => {
        const n = Math.max(0, parseInt(value, 10) || 0);
        setForm((f) => ({
            ...f,
            episodes: n,
            progress: Math.min(f.progress, n),
        }));
    };

    const handleProgressChange = (value) => {
        const n = Math.max(0, parseInt(value, 10) || 0);
        setForm((f) => ({ ...f, progress: Math.min(n, f.episodes || 0) }));
    };

    const selectResult = (r) => {
        const type =
            r.type === "MOVIE"
                ? "Movie"
                : r.type === "TV_SHORT"
                  ? "TV_SHORT"
                  : r.type || "TV";
        const dur = r.duration || DEFAULT_DURATION[type] || 20;

        setForm((f) => ({
            ...f,
            title: r.title || "",
            type,
            episodes: r.episodes || 1,
            duration: dur,
            cover: r.images?.jpg?.image_url || "",
            genres: (r.genres || [])
                .filter((g) => g !== "Award Winning")
                .join(", "),
            score: r.score != null ? String(r.score) : f.score,
        }));

        setQuery("");
        setResults([]);
    };

    // ============================================================
    // SUBMIT
    // ============================================================
    const handleSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (submitting) return;

        const title = (form.title || "").trim();
        if (!title) {
            showToast("Please enter an anime title", "error");
            return;
        }

        const editingSnapshot = editing;
        const animeDataSnapshot = animeData;

        const type = form.type || "TV";
        const episodes = Math.max(0, parseInt(form.episodes, 10) || 0);
        let duration = parseInt(form.duration, 10) || 0;
        if (!duration) duration = DEFAULT_DURATION[type] || 20;
        const status = form.userStatus || "Plan to Watch";
        const progress = Math.min(parseInt(form.progress, 10) || 0, episodes);
        const score = form.score !== "" ? parseFloat(form.score) : null;
        const cover = form.cover || "";
        const genres = (form.genres || "")
            .split(",")
            .map((g) => g.trim())
            .filter(Boolean);
        const year = form.year;
        const month = form.month;
        const isCompleted = status === "Completed";

        setSubmitting(true);

        try {
            const nowTimestamp = formatTimestamp();

            let finishDate = null;
            let actualFinishDate = null;

            if (isCompleted) {
                const y = parseInt(year, 10);
                const m = parseInt(month, 10);
                if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
                    finishDate = `${y}-${String(m).padStart(2, "0")}`;

                    if (
                        editingSnapshot &&
                        editingSnapshot.actualFinishDate &&
                        editingSnapshot.actualFinishDate.startsWith(finishDate)
                    ) {
                        actualFinishDate = editingSnapshot.actualFinishDate;
                    } else {
                        const resolved = await resolveActualFinishDate(
                            year,
                            month,
                        );
                        if (resolved === null) {
                            setSubmitting(false);
                            return;
                        }
                        actualFinishDate = resolved;
                    }
                }
            }

            const payload = {
                title,
                type,
                episodes,
                duration,
                userStatus: status,
                progress,
                score,
                cover,
                genres,
                finishDate: isCompleted ? finishDate : null,
                actualFinishDate: isCompleted ? actualFinishDate : null,
                updatedAt: nowTimestamp,
            };

            if (editingSnapshot) {
                const oldAnime = editingSnapshot;

                // Build the full updated object OUTSIDE the state updater.
                const updatedAnime = { ...oldAnime, ...payload };

                setAnimeData((prev) =>
                    prev.map((a) =>
                        a.id === updatedAnime.id ? updatedAnime : a,
                    ),
                );

                try {
                    awardXP(updatedAnime, { oldAnime });
                } catch (err) {
                    console.warn("XP award failed on update:", err);
                }

                const wasCompleted = oldAnime.userStatus === "Completed";
                if (isCompleted && !wasCompleted) {
                    logActivity("completed", title);
                } else {
                    logActivity("edited", title);
                }

                showToast(
                    isCompleted && !wasCompleted
                        ? `"${title}" marked as completed!`
                        : `"${title}" updated successfully!`,
                    "success",
                );
            } else {
                const newId =
                    animeService.getNextAvailableId(animeDataSnapshot);
                const newAnime = {
                    id: newId,
                    ...payload,
                    createdAt: nowTimestamp,
                };

                setAnimeData((prev) => [...prev, newAnime]);

                try {
                    awardXP(newAnime, { oldAnime: null });
                } catch (err) {
                    console.warn("XP award failed on add:", err);
                }

                if (isCompleted) {
                    logActivity("completed", title);
                } else if (status === "Watching") {
                    logActivity("watching", title);
                } else {
                    logActivity("added", title);
                }

                showToast(
                    isCompleted
                        ? `"${title}" added and marked as completed!`
                        : `"${title}" added successfully!`,
                    "success",
                );
            }

            close();

            setTimeout(() => {
                window.dispatchEvent(new CustomEvent("animeUpdate"));
                syncToCloud?.().catch(() => {});
            }, 50);

            setTimeout(() => {
                try {
                    recalc?.();
                } catch (_) {
                    /* ignore */
                }
            }, 100);
        } catch (err) {
            console.error("AnimeModal submit error:", err);
            showToast(err.message || "Something went wrong", "error");
        } finally {
            setSubmitting(false);
        }
    };

    // ============================================================
    // DELETE
    // ============================================================
    const handleDelete = () => {
        if (!editing) return;
        setConfirmDelete(true);
    };

    const confirmDeleteAction = async () => {
        setConfirmDelete(false);
        if (!editing) return;

        const targetId = editing.id;
        const deletedTitle = editing.title;

        setSubmitting(true);

        try {
            setAnimeData((prev) => prev.filter((a) => a.id !== targetId));
            logActivity("deleted", deletedTitle);
            showToast("Anime deleted successfully", "success");

            close();

            setTimeout(() => {
                window.dispatchEvent(new CustomEvent("animeUpdate"));
                syncToCloud?.().catch(() => {});
            }, 50);
        } catch (err) {
            console.error("Delete error:", err);
            showToast("Failed to delete anime", "error");
        } finally {
            setSubmitting(false);
        }
    };

    // ============================================================
    // RENDER
    // ============================================================
    const isEditing = Boolean(editing);
    const durationEditable = isDurationEditable(form.type);
    const years = Array.from(
        { length: 40 },
        (_, i) => new Date().getFullYear() - 20 + i,
    );

    return (
        <>
            <Modal
                open={open}
                onClose={close}
                title={isEditing ? "Edit Anime" : "Add New Anime"}
            >
                <form onSubmit={handleSubmit} id="addAnimeForm">
                    <div className="form-group form-group-search">
                        <label htmlFor="animeTitle">Title</label>
                        <input
                            id="animeTitle"
                            type="text"
                            value={form.title}
                            onChange={(e) => {
                                setField("title", e.target.value);
                                if (!isEditing) setQuery(e.target.value);
                            }}
                            placeholder={
                                isEditing
                                    ? "Title cannot be changed"
                                    : "Search for an anime..."
                            }
                            required
                            disabled={isEditing}
                            autoComplete="off"
                        />

                        {searching && (
                            <div className="search-loading">
                                <i className="fas fa-spinner fa-spin" />{" "}
                                Searching AniList...
                            </div>
                        )}

                        {!isEditing && results.length > 0 && (
                            <div className="search-results">
                                {results.map((r) => (
                                    <div
                                        key={r.id}
                                        className="search-result-item"
                                        onClick={() => selectResult(r)}
                                    >
                                        <img
                                            src={
                                                r.images?.jpg?.image_url ||
                                                "https://placehold.co/45x65/2DA3FB/white?text=No+Image"
                                            }
                                            alt={r.title}
                                            onError={(e) => {
                                                e.target.src =
                                                    "https://placehold.co/45x65/2DA3FB/white?text=No+Image";
                                            }}
                                        />
                                        <div className="search-result-info">
                                            <div className="search-result-title">
                                                {r.title}
                                            </div>
                                            <div className="search-result-meta">
                                                <span>{r.type || "TV"}</span>
                                                <span>
                                                    {r.episodes || "?"} eps
                                                </span>
                                                {r.score != null && (
                                                    <span className="score">
                                                        ? {r.score}
                                                    </span>
                                                )}
                                            </div>
                                            {r.genres?.length > 0 && (
                                                <div className="search-result-genres">
                                                    {r.genres
                                                        .slice(0, 4)
                                                        .join(" · ")}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="form-row form-row-3">
                        <div className="form-group">
                            <label htmlFor="animeType">Type</label>
                            <select
                                id="animeType"
                                value={form.type}
                                onChange={(e) =>
                                    handleTypeChange(e.target.value)
                                }
                            >
                                <option value="TV">TV Series</option>
                                <option value="TV_SHORT">TV Short</option>
                                <option value="Movie">Movie</option>
                                <option value="OVA">OVA</option>
                                <option value="ONA">ONA</option>
                                <option value="Special">Special</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="animeEpisodes">Episodes</label>
                            <input
                                id="animeEpisodes"
                                type="number"
                                min={0}
                                value={form.episodes}
                                onChange={(e) =>
                                    handleEpisodesChange(e.target.value)
                                }
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="animeDuration">
                                Duration (min)
                            </label>
                            <input
                                id="animeDuration"
                                type="number"
                                min={1}
                                value={form.duration}
                                disabled={!durationEditable}
                                onChange={(e) =>
                                    setField("duration", e.target.value)
                                }
                                title={
                                    durationEditable
                                        ? ""
                                        : "Auto-set for non-movie types"
                                }
                            />
                        </div>
                    </div>

                    <div className="form-row form-row-3">
                        <div className="form-group">
                            <label htmlFor="animeStatus">Status</label>
                            <select
                                id="animeStatus"
                                value={form.userStatus}
                                onChange={(e) =>
                                    setField("userStatus", e.target.value)
                                }
                            >
                                <option value="Completed">Completed</option>
                                <option value="Watching">Watching</option>
                                <option value="Plan to Watch">
                                    Plan to Watch
                                </option>
                                <option value="Dropped">Dropped</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="animeProgress">Progress</label>
                            <input
                                id="animeProgress"
                                type="number"
                                min={0}
                                max={form.episodes || 0}
                                value={form.progress}
                                onChange={(e) =>
                                    handleProgressChange(e.target.value)
                                }
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="animeScore">Score</label>
                            <input
                                id="animeScore"
                                type="number"
                                min={0}
                                max={10}
                                step={0.1}
                                value={form.score}
                                onChange={(e) =>
                                    setField("score", e.target.value)
                                }
                                placeholder="0-10"
                            />
                        </div>
                    </div>

                    <div className="form-row form-row-2 completion-date-box">
                        <div className="form-group">
                            <label htmlFor="animeYear">
                                <i className="fas fa-calendar-alt" /> Completion
                                Year
                            </label>
                            <select
                                id="animeYear"
                                value={form.year}
                                onChange={(e) =>
                                    setField("year", e.target.value)
                                }
                            >
                                {years.map((y) => (
                                    <option key={y} value={y}>
                                        {y}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="animeMonth">
                                <i className="fas fa-calendar" /> Completion
                                Month
                            </label>
                            <select
                                id="animeMonth"
                                value={form.month}
                                onChange={(e) =>
                                    setField("month", e.target.value)
                                }
                            >
                                {MONTHS.map((m, i) => (
                                    <option key={m} value={m}>
                                        {MONTH_NAMES[i]}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="animeCover">Cover URL</label>
                        <input
                            id="animeCover"
                            type="text"
                            value={form.cover}
                            disabled
                            placeholder="Auto-filled from search"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="animeGenres">Genres</label>
                        <input
                            id="animeGenres"
                            type="text"
                            value={form.genres}
                            disabled
                            placeholder="Auto-filled from search"
                        />
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={close}
                            disabled={submitting}
                        >
                            Cancel
                        </button>

                        {isEditing && (
                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={handleDelete}
                                disabled={submitting}
                            >
                                <i className="fas fa-trash" /> Delete
                            </button>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <i className="fas fa-spinner fa-spin" />{" "}
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <i
                                        className={`fas ${isEditing ? "fa-save" : "fa-plus"}`}
                                    />{" "}
                                    {isEditing ? "Update" : "Add Anime"}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                open={confirmDelete}
                message={`Are you sure you want to delete "${editing?.title || ""}"?`}
                confirmLabel="Delete"
                onConfirm={confirmDeleteAction}
                onCancel={() => setConfirmDelete(false)}
            />
        </>
    );
}
