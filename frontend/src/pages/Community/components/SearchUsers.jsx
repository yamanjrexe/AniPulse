import React, { useState } from "react";
import { api } from "../../../services/api.js";
import { useToast } from "../../../context/ToastContext.jsx";

export default function SearchUsers({ onSendRequest }) {
    const { showToast } = useToast();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const search = async () => {
        if (query.trim().length < 2)
            return showToast("Enter at least 2 characters", "info");
        setLoading(true);
        try {
            const r = await api.get(
                `/user/search?q=${encodeURIComponent(query)}`,
            );
            setResults(r || []);
            if (!r || r.length === 0) showToast("No users found", "info");
        } catch {
            showToast("Search failed", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="search-users-section">
            <h3>
                <i className="fas fa-search" aria-hidden="true" /> Find Friends
            </h3>
            <div className="search-users-input">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && search()}
                    placeholder="Search by username..."
                />
                <button
                    className="btn btn-primary"
                    onClick={search}
                    disabled={loading}
                >
                    {loading ? "Searching..." : "Search"}
                </button>
            </div>

            <div className="search-results-list">
                {results.map((u) => (
                    <div key={u.uid} className="search-result-item">
                        <div className="search-result-info">
                            <img
                                src={
                                    u.avatar ||
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || u.username)}&background=6366F1&color=fff`
                                }
                                alt={u.name}
                                className="search-result-avatar"
                            />
                            <div>
                                <div className="friend-request-name">
                                    {u.name || u.username}
                                </div>
                                <div className="friend-request-level">
                                    {u.title || "Newbie"} • Lv.{u.level || 1}
                                </div>
                            </div>
                        </div>
                        <button
                            className="btn-add-friend"
                            onClick={() => onSendRequest(u.uid)}
                        >
                            <i className="fas fa-user-plus" /> Add Friend
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
