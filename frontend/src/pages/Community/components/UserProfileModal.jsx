import React, { useEffect, useState, useMemo, useCallback } from "react";
import { api } from "../../../services/api.js";
import { useToast } from "../../../context/ToastContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { ACHIEVEMENTS } from "../../../services/achievements.js";
import { getLevelFromXP } from "../../../services/levelSystem.js";
import { firebase } from "../../../../firebaseClient.js";

const TABS = [
    { k: "completed", l: "Completed", icon: "fa-check-circle" },
    { k: "watching", l: "Watching", icon: "fa-play-circle" },
    { k: "plan", l: "Plan", icon: "fa-clock" },
    { k: "achievements", l: "Achievements", icon: "fa-trophy" },
    { k: "activity", l: "Activity", icon: "fa-history" },
];

const SOCIAL_ICON = {
    anilist: "fa-list-ul",
    myanimelist: "fa-book",
    twitter: "fa-twitter",
    instagram: "fa-instagram",
};

function formatCompact(num) {
    if (num === undefined || num === null) return "0";
    const n = Number(num);
    if (!Number.isFinite(n)) return "0";
    if (n >= 1_000_000)
        return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    return n.toString();
}

function formatFull(num) {
    if (num === undefined || num === null) return "0";
    const n = Number(num);
    if (!Number.isFinite(n)) return "0";
    return n.toLocaleString();
}

const _profileCache = new Map();
const CACHE_TTL = 60 * 1000;

function buildLocalProfile(user) {
    const userProfile = (() => {
        try {
            return JSON.parse(localStorage.getItem("userProfile") || "{}");
        } catch {
            return {};
        }
    })();
    const anim = (() => {
        try {
            return JSON.parse(localStorage.getItem("animeData") || "[]");
        } catch {
            return [];
        }
    })();

    const completed = anim.filter((a) => a.userStatus === "Completed");
    const watching = anim.filter((a) => a.userStatus === "Watching");
    const plan = anim.filter((a) => a.userStatus === "Plan to Watch");

    let totalEpisodes = 0;
    let totalMinutes = 0;
    completed.forEach((a) => {
        if (a.type === "Movie") {
            totalEpisodes += 1;
            totalMinutes += a.duration || 120;
        } else {
            const eps = a.episodes || 0;
            totalEpisodes += eps;
            totalMinutes += eps * (a.duration || 20);
        }
    });
    const totalHours = Math.round(totalMinutes / 60);

    let totalXP = parseInt(localStorage.getItem("userXP") || "0", 10);
    if (!totalXP) {
        try {
            const p = JSON.parse(localStorage.getItem("userProfile") || "{}");
            if (typeof p.totalExp === "number") totalXP = p.totalExp;
        } catch {}
    }
    const computed = getLevelFromXP(totalXP);

    const achievements = (() => {
        try {
            const s = JSON.parse(
                localStorage.getItem("unlockedAchievements") || "[]",
            );
            if (!Array.isArray(s)) return [];
            if (s.length > 0 && typeof s[0] === "number") {
                return s.map((i) => ACHIEVEMENTS[i]?.id).filter(Boolean);
            }
            return s;
        } catch {
            return [];
        }
    })();

    const recentActivity = (() => {
        try {
            return JSON.parse(
                localStorage.getItem("activityLog") || "[]",
            ).slice(0, 15);
        } catch {
            return [];
        }
    })();

    return {
        uid: user?.uid || "current",
        name: userProfile.name || user?.name || "You",
        avatar: userProfile.avatar || user?.avatar || null,
        cover: userProfile.cover || null,
        bio: userProfile.bio || "",
        status: userProfile.status || "",
        favoriteAnime: userProfile.favoriteAnime || [],
        social: userProfile.social || {},
        level: computed.level,
        levelTitle: computed.title,
        totalXP,
        stats: {
            totalAnime: anim.length,
            completed: completed.length,
            watching: watching.length,
            planToWatch: plan.length,
            dropped: anim.filter((a) => a.userStatus === "Dropped").length,
            totalEpisodes,
            totalHours,
        },
        animeList: { completed, watching, planToWatch: plan },
        achievements,
        recentActivity,
        isCurrentUser: true,
        isFriend: false,
    };
}

function normalizeServerProfile(data) {
    if (!data || typeof data !== "object") return null;

    const totalXP = Number(data.totalXP ?? data.totalExp ?? data.xp ?? 0) || 0;

    return {
        uid: data.uid,
        name: data.name || data.username || "User",
        avatar: data.avatar || null,
        cover: data.cover || null,
        bio: data.bio || "",
        status: data.status || "",
        favoriteAnime: data.favoriteAnime || [],
        social: data.social || {},
        level: Number(data.level) || 1,
        levelTitle: data.levelTitle || data.title || "Newbie",
        totalXP,
        stats: {
            totalAnime: data.stats?.totalAnime ?? data.totalAnime ?? 0,
            completed: data.stats?.completed ?? data.completed ?? 0,
            watching: data.stats?.watching ?? data.watching ?? 0,
            planToWatch: data.stats?.planToWatch ?? data.planToWatch ?? 0,
            dropped: data.stats?.dropped ?? data.dropped ?? 0,
            totalEpisodes: data.stats?.totalEpisodes ?? data.totalEpisodes ?? 0,
            totalHours: data.stats?.totalHours ?? data.totalHours ?? 0,
        },
        animeList: {
            completed: data.animeList?.completed || [],
            watching: data.animeList?.watching || [],
            planToWatch:
                data.animeList?.planToWatch || data.animeList?.plan || [],
        },
        achievements: Array.isArray(data.achievements) ? data.achievements : [],
        recentActivity: Array.isArray(data.recentActivity)
            ? data.recentActivity
            : [],
        isCurrentUser: !!data.isCurrentUser,
        isFriend: !!data.isFriend,
    };
}

export default function UserProfileModal({ userId, onClose }) {
    const { user } = useAuth();
    const { showToast } = useToast();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("completed");

    const isSelf = useMemo(() => {
        if (!userId) return false;
        if (userId === "current") return true;
        const uidFromContext = user?.uid;
        const uidFromStorage = (() => {
            try {
                return JSON.parse(localStorage.getItem("user") || "{}")?.uid;
            } catch {
                return null;
            }
        })();
        const uidFromAuth = (() => {
          try {
            return firebase?.auth?.().currentUser?.uid;
          } catch {
            return null;
          }
        })();
        const myUid = uidFromContext || uidFromStorage || uidFromAuth;
        return !!(myUid && userId === myUid);
    }, [userId, user]);

    useEffect(() => {
        if (!userId) return;
        let cancelled = false;

        if (isSelf) {
            setProfile(buildLocalProfile(user));
            setLoading(false);
            return;
        }

        const cached = _profileCache.get(userId);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            setProfile(cached.profile);
            setLoading(false);
            return;
        }

        (async () => {
            setLoading(true);
            try {
                let raw = null;
                try {
                    raw = await api.get(`/user/full-profile/${userId}`);
                } catch {
                    raw = await api.get(`/user/profile/${userId}`);
                }
                if (cancelled) return;

                const normalized = normalizeServerProfile(raw);
                if (!normalized) throw new Error("Invalid profile data");

                _profileCache.set(userId, {
                    profile: normalized,
                    timestamp: Date.now(),
                });
                setProfile(normalized);
            } catch (err) {
                if (cancelled) return;
                console.error("[UserProfileModal] load failed:", err);
                showToast(err.message || "Failed to load profile", "error");
                onClose?.();
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [userId, isSelf, user, showToast, onClose]);

    const sendFriendRequest = useCallback(async () => {
        try {
            await api.post(`/friends/request/${userId}`, {});
            showToast("Friend request sent!", "success");
            setProfile((p) => (p ? { ...p, isFriend: true } : p));
            _profileCache.delete(userId);
        } catch (err) {
            showToast(err.message || "Failed to send request", "error");
        }
    }, [userId, showToast]);

    const socialKeys = useMemo(
        () =>
            profile
                ? Object.keys(profile.social || {}).filter(
                      (k) => profile.social[k],
                  )
                : [],
        [profile],
    );

    if (!userId) return null;

    return (
        <div
            className="modal show active"
            onClick={onClose}
            style={{
                display: "flex",
                position: "fixed",
                inset: 0,
                zIndex: 10000,
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0, 0, 0, 0.65)",
                padding: 20,
            }}
        >
            <div
                className="modal-content profile-modal"
                onClick={(e) => e.stopPropagation()}
                style={{
                    maxWidth: 780,
                    width: "100%",
                    maxHeight: "92vh",
                    overflow: "auto",
                    background: "#111111",
                    border: "1px solid #292929",
                    borderRadius: 16,
                    padding: 0,
                    boxShadow: "0 16px 40px rgba(0, 0, 0, 0.40)",
                    color: "#FBFBFB",
                    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
                }}
            >
                <div
                    className="modal-header"
                    style={{
                        padding: "16px 20px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderBottom: "1px solid #1F1F1F",
                        position: "sticky",
                        top: 0,
                        background: "#111111",
                        zIndex: 10,
                    }}
                >
                    <h2
                        className="modal-title"
                        style={{
                            margin: 0,
                            fontSize: "1rem",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                        }}
                    >
                        <i
                            className="fas fa-user-circle"
                            style={{ color: "#FCE706" }}
                        />
                        User profile
                        {isSelf && (
                            <span
                                style={{
                                    marginLeft: 4,
                                    fontSize: "0.7rem",
                                    color: "#797979",
                                    fontWeight: 500,
                                }}
                            >
                                (You)
                            </span>
                        )}
                    </h2>
                    <button
                        className="close-modal"
                        onClick={onClose}
                        style={{
                            background: "transparent",
                            border: "1px solid #292929",
                            borderRadius: 8,
                            width: 32,
                            height: 32,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#797979",
                            fontSize: 18,
                            cursor: "pointer",
                        }}
                    >
                        &times;
                    </button>
                </div>

                {loading && (
                    <div
                        style={{
                            padding: 60,
                            textAlign: "center",
                            color: "#797979",
                        }}
                    >
                        <i
                            className="fas fa-spinner fa-spin"
                            style={{ fontSize: 24, color: "#FCE706" }}
                        />
                        <div style={{ marginTop: 12, fontSize: "0.875rem" }}>
                            Loading profile...
                        </div>
                    </div>
                )}

                {!loading && profile && (
                    <div className="profile-modal-body" style={{ padding: 20 }}>
                        {/* Header */}
                        <div
                            style={{
                                borderRadius: 12,
                                padding: 20,
                                marginBottom: 16,
                                backgroundImage: profile.cover
                                    ? `url('${profile.cover}')`
                                    : "none",
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                backgroundColor: profile.cover
                                    ? "transparent"
                                    : "#171717",
                                display: "flex",
                                gap: 16,
                                alignItems: "center",
                                position: "relative",
                                overflow: "hidden",
                                minHeight: 130,
                                border: "1px solid #292929",
                            }}
                        >
                            {profile.cover && (
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        background:
                                            "linear-gradient(to right, rgba(0,0,0,0.82), rgba(0,0,0,0.40))",
                                        pointerEvents: "none",
                                    }}
                                />
                            )}
                            <img
                                src={
                                    profile.avatar ||
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || "User")}&background=FCE706&color=050505&bold=true&size=200`
                                }
                                alt={profile.name}
                                style={{
                                    width: 84,
                                    height: 84,
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                    border: "2px solid #3A3A3A",
                                    position: "relative",
                                    zIndex: 1,
                                    flexShrink: 0,
                                }}
                                onError={(e) => {
                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || "User")}&background=FCE706&color=050505`;
                                }}
                            />
                            <div
                                style={{
                                    position: "relative",
                                    zIndex: 1,
                                    flex: 1,
                                    minWidth: 0,
                                }}
                            >
                                <h3
                                    style={{
                                        margin: 0,
                                        fontSize: "1.25rem",
                                        fontWeight: 700,
                                        color: "#FBFBFB",
                                    }}
                                >
                                    {profile.name || profile.username || "User"}
                                </h3>
                                <div
                                    style={{
                                        marginTop: 6,
                                        display: "flex",
                                        gap: 8,
                                        alignItems: "center",
                                        flexWrap: "wrap",
                                        fontSize: "0.8rem",
                                    }}
                                >
                                    <span
                                        style={{
                                            padding: "2px 8px",
                                            borderRadius: 4,
                                            background: "#FCE706",
                                            color: "#050505",
                                            fontWeight: 800,
                                            fontSize: "0.7rem",
                                        }}
                                    >
                                        Lv.{profile.level}
                                    </span>
                                    <span
                                        style={{
                                            color: "#C2C4C7",
                                            fontWeight: 500,
                                        }}
                                    >
                                        {profile.levelTitle}
                                    </span>
                                </div>
                                {!profile.isCurrentUser && (
                                    <button
                                        onClick={sendFriendRequest}
                                        disabled={profile.isFriend}
                                        style={{
                                            marginTop: 10,
                                            padding: "6px 14px",
                                            background: profile.isFriend
                                                ? "#292929"
                                                : "#FCE706",
                                            color: profile.isFriend
                                                ? "#797979"
                                                : "#050505",
                                            border:
                                                "1px solid " +
                                                (profile.isFriend
                                                    ? "#3A3A3A"
                                                    : "#FCE706"),
                                            borderRadius: 8,
                                            cursor: profile.isFriend
                                                ? "not-allowed"
                                                : "pointer",
                                            fontWeight: 600,
                                            fontSize: "0.8rem",
                                            fontFamily: "inherit",
                                        }}
                                    >
                                        <i
                                            className={`fas ${profile.isFriend ? "fa-user-check" : "fa-user-plus"}`}
                                            style={{ marginRight: 6 }}
                                        />
                                        {profile.isFriend
                                            ? "Friends"
                                            : "Add friend"}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Bio + status + favorites + socials */}
                        <div style={{ marginBottom: 16 }}>
                            {profile.bio && (
                                <p
                                    style={{
                                        margin: "0 0 8px 0",
                                        color: "#C2C4C7",
                                        fontSize: "0.875rem",
                                        lineHeight: 1.5,
                                    }}
                                >
                                    {profile.bio}
                                </p>
                            )}
                            {profile.status && (
                                <div
                                    style={{
                                        display: "inline-block",
                                        padding: "3px 12px",
                                        background: "#171717",
                                        border: "1px solid #292929",
                                        borderRadius: 999,
                                        fontSize: "0.8rem",
                                        color: "#C2C4C7",
                                        marginBottom: 8,
                                    }}
                                >
                                    <i
                                        className="fas fa-circle"
                                        style={{
                                            color: "#22C55E",
                                            fontSize: 6,
                                            marginRight: 6,
                                            verticalAlign: "middle",
                                        }}
                                    />
                                    {profile.status}
                                </div>
                            )}
                            {profile.favoriteAnime?.length > 0 && (
                                <div
                                    style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: 6,
                                        marginTop: 8,
                                    }}
                                >
                                    {profile.favoriteAnime
                                        .slice(0, 6)
                                        .map((id, i) => (
                                            <span
                                                key={i}
                                                style={{
                                                    padding: "2px 10px",
                                                    background: "#171717",
                                                    border: "1px solid #292929",
                                                    borderRadius: 999,
                                                    fontSize: "0.75rem",
                                                    color: "#C2C4C7",
                                                }}
                                            >
                                                {typeof id === "object"
                                                    ? id.title
                                                    : `#${id}`}
                                            </span>
                                        ))}
                                </div>
                            )}
                            {socialKeys.length > 0 && (
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 10,
                                        marginTop: 10,
                                    }}
                                >
                                    {socialKeys.map((k) => (
                                        <a
                                            key={k}
                                            href={`https://${k}.com/${profile.social[k]}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                width: 34,
                                                height: 34,
                                                display: "inline-flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                background: "#171717",
                                                border: "1px solid #292929",
                                                borderRadius: 8,
                                                color: "#C2C4C7",
                                                fontSize: "0.875rem",
                                            }}
                                            title={`${k}: ${profile.social[k]}`}
                                        >
                                            <i
                                                className={`${k === "twitter" || k === "instagram" ? "fab" : "fas"} ${SOCIAL_ICON[k]}`}
                                            />
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Stats grid */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(4, 1fr)",
                                gap: 10,
                                marginBottom: 16,
                            }}
                        >
                            <StatCard
                                icon="fa-tv"
                                value={profile.stats?.totalAnime}
                                label="Total anime"
                            />
                            <StatCard
                                icon="fa-check-circle"
                                value={profile.stats?.completed}
                                label="Completed"
                            />
                            <StatCard
                                icon="fa-film"
                                value={profile.stats?.totalEpisodes}
                                label="Episodes"
                            />
                            <StatCard
                                icon="fa-clock"
                                value={profile.stats?.totalHours}
                                label="Hours"
                            />
                        </div>

                        {/* Tabs */}
                        <div
                            style={{
                                display: "flex",
                                gap: 4,
                                marginBottom: 12,
                                borderBottom: "1px solid #1F1F1F",
                                overflowX: "auto",
                            }}
                        >
                            {TABS.map((t) => (
                                <button
                                    key={t.k}
                                    onClick={() => setTab(t.k)}
                                    style={{
                                        padding: "8px 12px",
                                        background: "none",
                                        border: 0,
                                        color:
                                            tab === t.k ? "#FCE706" : "#797979",
                                        cursor: "pointer",
                                        borderBottom:
                                            tab === t.k
                                                ? "2px solid #FCE706"
                                                : "2px solid transparent",
                                        fontSize: "0.8rem",
                                        fontWeight: 600,
                                        whiteSpace: "nowrap",
                                        fontFamily: "inherit",
                                    }}
                                >
                                    <i
                                        className={`fas ${t.icon}`}
                                        style={{ marginRight: 6 }}
                                    />
                                    {t.l}
                                </button>
                            ))}
                        </div>

                        <div style={{ minHeight: 200 }}>
                            {(tab === "completed" ||
                                tab === "watching" ||
                                tab === "plan") &&
                                (() => {
                                    const key =
                                        tab === "plan" ? "planToWatch" : tab;
                                    const list = profile.animeList?.[key] || [];
                                    if (!list.length)
                                        return (
                                            <EmptyState
                                                icon="fa-inbox"
                                                message={`No ${tab} anime`}
                                            />
                                        );
                                    return (
                                        <div
                                            style={{
                                                display: "grid",
                                                gridTemplateColumns:
                                                    "repeat(auto-fill, minmax(140px, 1fr))",
                                                gap: 10,
                                            }}
                                        >
                                            {list.slice(0, 30).map((a) => (
                                                <div
                                                    key={a.id}
                                                    style={{
                                                        background: "#171717",
                                                        borderRadius: 8,
                                                        overflow: "hidden",
                                                        border: "1px solid #292929",
                                                    }}
                                                >
                                                    <img
                                                        src={
                                                            a.cover ||
                                                            "https://placehold.co/140x200/111111/555555?text=No+Image"
                                                        }
                                                        alt={a.title}
                                                        style={{
                                                            width: "100%",
                                                            height: 200,
                                                            objectFit: "cover",
                                                            display: "block",
                                                            background:
                                                                "#0A0A0A",
                                                        }}
                                                        onError={(e) => {
                                                            e.target.src =
                                                                "https://placehold.co/140x200/111111/555555?text=No+Image";
                                                        }}
                                                    />
                                                    <div style={{ padding: 8 }}>
                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    "0.75rem",
                                                                fontWeight: 500,
                                                                overflow:
                                                                    "hidden",
                                                                textOverflow:
                                                                    "ellipsis",
                                                                whiteSpace:
                                                                    "nowrap",
                                                                color: "#FBFBFB",
                                                            }}
                                                            title={a.title}
                                                        >
                                                            {a.title}
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    "0.65rem",
                                                                color: "#797979",
                                                                marginTop: 2,
                                                            }}
                                                        >
                                                            {a.episodes || 0}{" "}
                                                            eps
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}

                            {tab === "achievements" &&
                                (() => {
                                    const list = profile.achievements || [];
                                    return (
                                        <div
                                            style={{
                                                display: "grid",
                                                gridTemplateColumns:
                                                    "repeat(auto-fill, minmax(220px, 1fr))",
                                                gap: 10,
                                            }}
                                        >
                                            {ACHIEVEMENTS.map((ach) => {
                                                const isUnlocked =
                                                    list.includes(ach.id);
                                                return (
                                                    <div
                                                        key={ach.id}
                                                        title={ach.desc}
                                                        style={{
                                                            padding: 10,
                                                            background:
                                                                "#171717",
                                                            border:
                                                                "1px solid " +
                                                                (isUnlocked
                                                                    ? "rgba(252, 231, 6, 0.32)"
                                                                    : "#292929"),
                                                            borderRadius: 8,
                                                            display: "flex",
                                                            gap: 10,
                                                            alignItems:
                                                                "center",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                fontSize: 18,
                                                                color: isUnlocked
                                                                    ? "#FCE706"
                                                                    : "#555555",
                                                                width: 28,
                                                                textAlign:
                                                                    "center",
                                                                flexShrink: 0,
                                                            }}
                                                        >
                                                            <i
                                                                className={`fas ${ach.icon}`}
                                                            />
                                                        </div>
                                                        <div
                                                            style={{
                                                                flex: 1,
                                                                minWidth: 0,
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    fontSize:
                                                                        "0.75rem",
                                                                    fontWeight: 600,
                                                                    color: isUnlocked
                                                                        ? "#FBFBFB"
                                                                        : "#797979",
                                                                }}
                                                            >
                                                                {ach.title}
                                                            </div>
                                                            <div
                                                                style={{
                                                                    fontSize:
                                                                        "0.6rem",
                                                                    color: "#555555",
                                                                    marginTop: 1,
                                                                }}
                                                            >
                                                                {ach.desc}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}

                            {tab === "activity" &&
                                (() => {
                                    const acts = profile.recentActivity || [];
                                    if (!acts.length)
                                        return (
                                            <EmptyState
                                                icon="fa-history"
                                                message="No recent activity"
                                            />
                                        );
                                    return (
                                        <div>
                                            {acts.map((act, i) => (
                                                <div
                                                    key={i}
                                                    style={{
                                                        display: "flex",
                                                        gap: 12,
                                                        padding: 10,
                                                        borderBottom:
                                                            "1px solid #1F1F1F",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: 32,
                                                            height: 32,
                                                            borderRadius: "50%",
                                                            background:
                                                                "#171717",
                                                            border: "1px solid #292929",
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            justifyContent:
                                                                "center",
                                                            color: "#FCE706",
                                                            flexShrink: 0,
                                                            fontSize: "0.75rem",
                                                        }}
                                                    >
                                                        <i className="fas fa-history" />
                                                    </div>
                                                    <div
                                                        style={{
                                                            flex: 1,
                                                            minWidth: 0,
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    "0.85rem",
                                                                color: "#FBFBFB",
                                                            }}
                                                        >
                                                            <strong
                                                                style={{
                                                                    textTransform:
                                                                        "capitalize",
                                                                }}
                                                            >
                                                                {act.action}
                                                            </strong>{" "}
                                                            — {act.animeTitle}
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    "0.7rem",
                                                                color: "#797979",
                                                                marginTop: 2,
                                                            }}
                                                        >
                                                            {new Date(
                                                                act.timestamp,
                                                            ).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ icon, value, label }) {
    const fullValue = formatFull(value);
    const displayValue = formatCompact(value);
    return (
        <div
            title={`${fullValue} ${label}`}
            style={{
                textAlign: "center",
                padding: 12,
                background: "#171717",
                border: "1px solid #292929",
                borderRadius: 8,
            }}
        >
            <i
                className={`fas ${icon}`}
                style={{
                    color: "#FCE706",
                    fontSize: "0.85rem",
                    opacity: 0.7,
                    marginBottom: 6,
                    display: "block",
                }}
            />
            <div
                style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "#FBFBFB",
                    lineHeight: 1.1,
                }}
            >
                {displayValue}
            </div>
            <div
                style={{
                    fontSize: "0.65rem",
                    color: "#797979",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginTop: 4,
                }}
            >
                {label}
            </div>
        </div>
    );
}

function EmptyState({ icon, message }) {
    return (
        <div
            style={{
                padding: 40,
                textAlign: "center",
                color: "#555555",
                fontSize: "0.875rem",
            }}
        >
            <i
                className={`fas ${icon}`}
                style={{
                    fontSize: 32,
                    display: "block",
                    marginBottom: 12,
                    opacity: 0.4,
                    color: "#797979",
                }}
            />
            {message}
        </div>
    );
}
