import React, { useEffect, useState } from "react";
import {
    LEVEL_EVENTS,
    LEVELS,
    getUserProfile,
} from "../../services/levelSystem.js";

const POPUP_DURATION = 5000;

function getLevelData(xp) {
    let current = LEVELS[0];
    let next = LEVELS[1];
    for (let i = 0; i < LEVELS.length; i++) {
        if (xp >= LEVELS[i].xpRequired) {
            current = LEVELS[i];
            next = LEVELS[i + 1] || LEVELS[i];
        }
    }
    return { current, next };
}

export default function XpPopupManager() {
    const [queue, setQueue] = useState([]);
    const [active, setActive] = useState(null);
    const [barReady, setBarReady] = useState(false);
    const [leaving, setLeaving] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            if (!e.detail) return;
            setQueue((q) => [...q, e.detail]);
        };
        window.addEventListener(LEVEL_EVENTS.AWARDED, handler);
        return () => window.removeEventListener(LEVEL_EVENTS.AWARDED, handler);
    }, []);

    useEffect(() => {
        if (active === null && queue.length > 0) {
            const [next, ...rest] = queue;
            setActive(next);
            setQueue(rest);
        }
    }, [queue, active]);

    useEffect(() => {
        if (!active) return;
        setBarReady(false);
        setLeaving(false);

        const t1 = setTimeout(() => setBarReady(true), 300);
        const t2 = setTimeout(() => setLeaving(true), POPUP_DURATION - 400);
        const t3 = setTimeout(() => setActive(null), POPUP_DURATION);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, [active]);

    if (!active) return null;

    const eventXP = active.profile?.totalExp;
    const liveXP = getUserProfile().totalExp || 0;
    const newTotal =
        typeof eventXP === "number" && eventXP > 0 ? eventXP : liveXP;

    const { current, next } = getLevelData(newTotal);

    const prevLevelNum = active.prevLevel || current.level;
    const prevLevelData = getLevelData(
        LEVELS[prevLevelNum - 1]?.xpRequired ?? 0,
    );
    const leveledUp = current.level > prevLevelData.current.level;

    const inLevel = Math.max(0, newTotal - current.xpRequired);
    const need = Math.max(1, next.xpRequired - current.xpRequired);
    const fillPercent = Math.min(100, Math.floor((inLevel / need) * 100));
    const remaining = Math.max(0, next.xpRequired - newTotal);

    const earnedXP = active.xp || 0;
    const queuedXP = active.queued || 0;

    return (
        <div
            style={{
                position: "fixed",
                bottom: 24,
                right: 24,
                zIndex: 99998,
                width: "min(380px, 94vw)",
                pointerEvents: "none",
                transition: "opacity 0.3s ease, transform 0.3s ease",
                opacity: leaving ? 0 : 1,
                transform: leaving ? "translateY(12px)" : "translateY(0)",
            }}
        >
            <div
                style={{
                    pointerEvents: "auto",
                    position: "relative",
                    padding: 16,
                    borderRadius: 12,
                    background: "#111111",
                    border: "1px solid #292929",
                    borderLeft: "3px solid #FCE706",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.30)",
                    color: "#FBFBFB",
                    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
                    animation: "xpPopupIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    overflow: "hidden",
                }}
            >
                {leveledUp && (
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            padding: "5px 16px",
                            background: "#FCE706",
                            color: "#050505",
                            fontSize: "0.65rem",
                            fontWeight: 800,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            textAlign: "center",
                        }}
                    >
                        Level up
                    </div>
                )}

                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        marginTop: leveledUp ? 18 : 0,
                    }}
                >
                    <div style={{ flexShrink: 0, position: "relative" }}>
                        {active.cover ? (
                            <img
                                src={active.cover}
                                alt=""
                                style={{
                                    width: 60,
                                    height: 84,
                                    objectFit: "cover",
                                    borderRadius: 8,
                                    border: "1px solid #292929",
                                    display: "block",
                                }}
                                onError={(e) => {
                                    e.target.style.display = "none";
                                    if (e.target.nextSibling)
                                        e.target.nextSibling.style.display =
                                            "flex";
                                }}
                            />
                        ) : null}
                        <div
                            style={{
                                display: active.cover ? "none" : "flex",
                                width: 60,
                                height: 84,
                                borderRadius: 8,
                                background: "#171717",
                                border: "1px solid #292929",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#797979",
                                fontSize: "1.25rem",
                            }}
                        >
                            <i className="fas fa-film" />
                        </div>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                            style={{
                                fontSize: "0.9rem",
                                fontWeight: 600,
                                marginBottom: 6,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                lineHeight: 1.3,
                                color: "#FBFBFB",
                            }}
                        >
                            {active.title}
                        </div>

                        {earnedXP > 0 ? (
                            <div
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "3px 10px",
                                    borderRadius: 999,
                                    background: "rgba(252, 231, 6, 0.12)",
                                    border: "1px solid rgba(252, 231, 6, 0.32)",
                                    fontSize: "0.8rem",
                                    fontWeight: 700,
                                    marginBottom: 8,
                                    color: "#FCE706",
                                }}
                            >
                                <i
                                    className="fas fa-bolt"
                                    style={{ fontSize: "0.7rem" }}
                                />
                                <span>+{earnedXP} XP</span>
                                <span
                                    style={{
                                        color: "#797979",
                                        fontWeight: 500,
                                        fontSize: "0.65rem",
                                    }}
                                >
                                    earned
                                </span>
                            </div>
                        ) : (
                            <div
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "3px 10px",
                                    borderRadius: 999,
                                    background: "rgba(252, 231, 6, 0.12)",
                                    border: "1px solid rgba(252, 231, 6, 0.32)",
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    color: "#FCE706",
                                    marginBottom: 8,
                                }}
                            >
                                <i className="fas fa-clock" />
                                {queuedXP} XP queued
                            </div>
                        )}

                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                fontSize: "0.7rem",
                            }}
                        >
                            <span
                                style={{
                                    padding: "2px 8px",
                                    borderRadius: 4,
                                    background: "#FCE706",
                                    color: "#050505",
                                    fontWeight: 800,
                                    fontSize: "0.65rem",
                                }}
                            >
                                LVL {current.level}
                            </span>
                            <span
                                style={{
                                    fontWeight: 600,
                                    color: "#C2C4C7",
                                }}
                            >
                                {current.title}
                            </span>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: 12 }}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 6,
                            fontSize: "0.65rem",
                            color: "#797979",
                        }}
                    >
                        <span>
                            <strong style={{ color: "#FBFBFB" }}>
                                {newTotal.toLocaleString()}
                            </strong>{" "}
                            / {next.xpRequired.toLocaleString()} XP
                        </span>
                        <span>
                            {remaining > 0 ? (
                                <>
                                    <strong style={{ color: "#FCE706" }}>
                                        {remaining.toLocaleString()}
                                    </strong>{" "}
                                    to next
                                </>
                            ) : (
                                <span
                                    style={{
                                        color: "#22C55E",
                                        fontWeight: 700,
                                    }}
                                >
                                    Max level
                                </span>
                            )}
                        </span>
                    </div>

                    <div
                        style={{
                            width: "100%",
                            height: 5,
                            background: "#292929",
                            borderRadius: 999,
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                width: barReady ? `${fillPercent}%` : "0%",
                                height: "100%",
                                background: "#FCE706",
                                transition:
                                    "width 1.2s cubic-bezier(0.2, 0, 0, 1)",
                                borderRadius: 999,
                            }}
                        />
                    </div>

                    <div
                        style={{
                            marginTop: 4,
                            fontSize: "0.6rem",
                            color: "#555555",
                            textAlign: "right",
                        }}
                    >
                        {fillPercent}% to {next.title}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes xpPopupIn {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
