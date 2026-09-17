import React, { useState, useEffect, useRef } from "react";
import { useAnime } from "../../../context/AnimeContext.jsx";

export default function FavoriteAnimeTagInput({ value = [], onChange }) {
    const { animeData } = useAnime();
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);

    useEffect(() => {
        const onClick = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target))
                setOpen(false);
        };
        document.addEventListener("click", onClick);
        return () => document.removeEventListener("click", onClick);
    }, []);

    const matches =
        query.trim().length > 0
            ? animeData
                  .filter((a) =>
                      a.title.toLowerCase().includes(query.toLowerCase()),
                  )
                  .slice(0, 10)
            : [];

    const add = (id) => {
        if (!value.includes(id)) onChange([...value, id]);
        setQuery("");
    };
    const remove = (id) => onChange(value.filter((x) => x !== id));

    const titleOf = (id) =>
        animeData.find((a) => a.id === id)?.title || `#${id}`;

    return (
        <div
            className="tag-input-wrapper"
            ref={wrapRef}
            style={{ position: "relative" }}
        >
            <div
                className="tag-input-container"
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    padding: 8,
                    background: "#111111",
                    border: "1px solid #292929",
                    borderRadius: 8,
                    minHeight: 44,
                    alignItems: "center",
                }}
            >
                {value.map((id) => (
                    <span
                        key={id}
                        className="tag-item"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "3px 8px 3px 12px",
                            background: "#171717",
                            border: "1px solid #292929",
                            borderRadius: 999,
                            fontSize: "0.75rem",
                            color: "#FBFBFB",
                        }}
                    >
                        {titleOf(id)}
                        <button
                            type="button"
                            className="tag-remove"
                            onClick={() => remove(id)}
                            style={{
                                background: "none",
                                border: 0,
                                color: "#797979",
                                cursor: "pointer",
                                fontSize: "0.9rem",
                                lineHeight: 1,
                                padding: 0,
                                marginLeft: 2,
                            }}
                        >
                            ×
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    placeholder="Search and add your favorite anime..."
                    autoComplete="off"
                    style={{
                        flex: 1,
                        minWidth: 160,
                        background: "none",
                        border: 0,
                        color: "#FBFBFB",
                        outline: "none",
                        fontSize: "0.875rem",
                        fontFamily: "inherit",
                        padding: "4px 0",
                    }}
                />
            </div>

            {open && query.trim().length > 0 && (
                <div
                    className="tag-dropdown open"
                    style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        maxHeight: 260,
                        overflowY: "auto",
                        background: "#111111",
                        border: "1px solid #292929",
                        borderRadius: 8,
                        marginTop: 6,
                        zIndex: 50,
                        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.30)",
                        padding: 4,
                    }}
                >
                    {matches.length === 0 ? (
                        <div
                            style={{
                                padding: 16,
                                textAlign: "center",
                                color: "#555555",
                                fontSize: "0.85rem",
                            }}
                        >
                            No matches for "{query}"
                        </div>
                    ) : (
                        matches.map((a) => {
                            const added = value.includes(a.id);
                            return (
                                <div
                                    key={a.id}
                                    onClick={() => !added && add(a.id)}
                                    style={{
                                        display: "flex",
                                        gap: 10,
                                        padding: 8,
                                        borderRadius: 6,
                                        cursor: added ? "default" : "pointer",
                                        opacity: added ? 0.5 : 1,
                                    }}
                                >
                                    <img
                                        src={
                                            a.cover ||
                                            "https://placehold.co/32x44/111111/555555?text=?"
                                        }
                                        alt=""
                                        style={{
                                            width: 32,
                                            height: 44,
                                            borderRadius: 4,
                                            objectFit: "cover",
                                            background: "#0A0A0A",
                                            flexShrink: 0,
                                        }}
                                        onError={(e) => {
                                            e.target.src =
                                                "https://placehold.co/32x44/111111/555555?text=?";
                                        }}
                                    />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div
                                            style={{
                                                fontSize: "0.8rem",
                                                fontWeight: 500,
                                                color: "#FBFBFB",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {a.title}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "0.65rem",
                                                color: "#797979",
                                            }}
                                        >
                                            {a.type || "TV"} •{" "}
                                            {a.episodes || "?"} eps
                                        </div>
                                    </div>
                                    {!added && (
                                        <span
                                            style={{
                                                color: "#FCE706",
                                                fontSize: "0.7rem",
                                                fontWeight: 600,
                                                alignSelf: "center",
                                                flexShrink: 0,
                                            }}
                                        >
                                            + Add
                                        </span>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
