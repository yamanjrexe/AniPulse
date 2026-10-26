import React, { useEffect, useState, useMemo, useCallback } from "react";
import { api } from "../../../services/api.js";
import { useToast } from "../../../context/ToastContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { ACHIEVEMENTS } from "../../../services/achievements.js";
import { getLevelFromXP } from "../../../services/levelSystem.js";
import { firebase } from "../../../firebaseClient.js";

function getSocialUrl(platform, username) {
  if (!username) return "#";
  const cleanUsername = username.replace(/^@/, "").trim();
  switch (platform) {
    case "anilist":
      return `https://anilist.co/user/${cleanUsername}`;
    case "myanimelist":
      return `https://myanimelist.net/profile/${cleanUsername}`;
    case "twitter":
      return `https://twitter.com/${cleanUsername}`;
    case "instagram":
      return `https://instagram.com/${cleanUsername}`;
    default:
      return `https://${platform}.com/${cleanUsername}`;
  }
}

function SocialIcon({ platform }) {
  if (platform === "anilist") {
    return (
      <img
        src="/svg/anilist.svg"
        alt="AniList"
        style={{
          width: 22,
          height: 22,
          objectFit: "contain",
          display: "block",
        }}
      />
    );
  }
  if (platform === "myanimelist") {
    return (
      <img
        src="/svg/myanimelist.svg"
        alt="MyAnimeList"
        style={{
          width: 22,
          height: 22,
          objectFit: "contain",
          display: "block",
        }}
      />
    );
  }
  if (platform === "twitter") {
    return <i className="fab fa-twitter" style={{ fontSize: "1.2rem" }} />;
  }
  if (platform === "instagram") {
    return <i className="fab fa-instagram" style={{ fontSize: "1.2rem" }} />;
  }
  return null;
}

function formatCompact(num) {
  if (num === undefined || num === null) return "0";
  const n = Number(num);
  if (!Number.isFinite(n)) return "0";
  if (n >= 1_000_000)
    return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toString();
}

function timestampOf(a) {
  return (
    a?.updatedAt || a?.createdAt || a?.actualFinishDate || a?.finishDate || ""
  );
}

function sortRecentFirst(list) {
  return [...list].sort((a, b) => {
    const da = timestampOf(a);
    const db = timestampOf(b);
    return String(db).localeCompare(String(da));
  });
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
      return JSON.parse(localStorage.getItem("activityLog") || "[]").slice(
        0,
        15,
      );
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
    animeList: {
      completed: sortRecentFirst(completed),
      watching: sortRecentFirst(watching),
      planToWatch: sortRecentFirst(plan),
    },
    achievements,
    recentActivity,
    isCurrentUser: true,
    isFriend: false,
  };
}

function normalizeServerProfile(data) {
  if (!data || typeof data !== "object") return null;

  const totalXP = Number(data.totalXP ?? data.totalExp ?? data.xp ?? 0) || 0;

  const animeList = {
    completed: sortRecentFirst(data.animeList?.completed || []),
    watching: sortRecentFirst(data.animeList?.watching || []),
    planToWatch: sortRecentFirst(
      data.animeList?.planToWatch || data.animeList?.plan || [],
    ),
  };

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
    animeList,
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
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

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
        ? Object.keys(profile.social || {}).filter((k) => profile.social[k])
        : [],
    [profile],
  );

  const animeTitleMap = useMemo(() => {
    const map = {};
    if (!profile?.animeList) return map;
    ["completed", "watching", "planToWatch"].forEach((key) => {
      (profile.animeList[key] || []).forEach((a) => {
        if (a?.id != null && a.title) map[a.id] = a.title;
      });
    });
    return map;
  }, [profile]);

  if (!userId) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "850px",
          maxHeight: "92dvh",
          background: "var(--bg-surface)",
          borderRadius: "16px",
          border: "1px solid var(--border-default)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 24px 60px -12px rgba(0,0,0,0.9)",
          position: "relative",
        }}
      >
        {/* HEADER (Sticky) */}
        <div
          style={{
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid var(--border-subtle)",
            background: "var(--bg-surface)",
            zIndex: 10,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: "1.1rem",
              fontWeight: 600,
            }}
          >
            <i
              className="fas fa-user-circle"
              style={{ color: "var(--brand-yellow)", fontSize: "1.2rem" }}
            />
            User Profile
            {isSelf && (
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  fontWeight: 500,
                }}
              >
                (You)
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-default)",
              borderRadius: 8,
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-secondary)",
              cursor: "pointer",
              transition: "0.2s",
            }}
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div
          style={{
            overflowY: "auto",
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {loading ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "300px",
                gap: 16,
                color: "var(--text-muted)",
              }}
            >
              <i
                className="fas fa-spinner fa-spin"
                style={{ fontSize: 32, color: "var(--brand-yellow)" }}
              />
              Loading profile...
            </div>
          ) : profile ? (
            <>
              {/* BANNER (Inset & Curved) */}
              <div style={{ padding: "24px 24px 0" }}>
                <div
                  className="profile-banner"
                  style={{
                    width: "100%",
                    height: 200,
                    position: "relative",
                    borderRadius: "16px",
                    overflow: "hidden",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-default)",
                  }}
                >
                  {profile.cover ? (
                    <img
                      src={profile.cover}
                      alt="Cover"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background:
                          "linear-gradient(135deg, var(--bg-card-hover) 0%, var(--bg-surface) 100%)",
                      }}
                    />
                  )}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)",
                    }}
                  />
                </div>
              </div>

              {/* PROFILE HEADER ROW (Overlapping Banner) */}
              <div className="profile-header-row">
                <img
                  src={
                    profile.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || "User")}&background=FCE706&color=050505&bold=true&size=200`
                  }
                  alt={profile.name}
                  className="profile-avatar"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || "User")}&background=FCE706&color=050505`;
                  }}
                />

                <div className="profile-info-wrapper">
                  <div className="profile-name-col">
                    <h2
                      style={{
                        margin: 0,
                        fontSize: "1.8rem",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        letterSpacing: "-0.02em",
                        lineHeight: 1.2,
                      }}
                    >
                      {profile.name}
                    </h2>
                    {/* LEVEL CARD BELOW NAME */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginTop: 8,
                      }}
                    >
                      <span
                        style={{
                          padding: "4px 12px",
                          background: "var(--brand-yellow)",
                          color: "#050505",
                          borderRadius: 6,
                          fontWeight: 800,
                          fontSize: "0.8rem",
                        }}
                      >
                        Lv.{profile.level}
                      </span>
                      <span
                        style={{
                          color: "var(--text-secondary)",
                          fontWeight: 600,
                          fontSize: "0.95rem",
                        }}
                      >
                        {profile.levelTitle}
                      </span>
                    </div>
                  </div>

                  {!profile.isCurrentUser && (
                    <button
                      onClick={sendFriendRequest}
                      disabled={profile.isFriend}
                      style={{
                        padding: "10px 20px",
                        background: profile.isFriend
                          ? "var(--bg-card)"
                          : "var(--brand-yellow)",
                        color: profile.isFriend
                          ? "var(--text-muted)"
                          : "#050505",
                        border: profile.isFriend
                          ? "1px solid var(--border-default)"
                          : "none",
                        borderRadius: 8,
                        fontWeight: 600,
                        fontSize: "0.9rem",
                        cursor: profile.isFriend ? "not-allowed" : "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        transition: "0.2s",
                        flexShrink: 0,
                        boxShadow: profile.isFriend
                          ? "none"
                          : "0 4px 12px rgba(252, 231, 6, 0.2)",
                      }}
                    >
                      <i
                        className={`fas ${profile.isFriend ? "fa-user-check" : "fa-user-plus"}`}
                      />
                      {profile.isFriend ? "Friend" : "Add Friend"}
                    </button>
                  )}
                </div>
              </div>

              {/* BIO & TAGS */}
              <div
                style={{
                  padding: "16px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                {profile.bio && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.95rem",
                      color: "var(--text-primary)",
                      lineHeight: 1.5,
                    }}
                  >
                    {profile.bio}
                  </p>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    {profile.status && (
                      <div>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "4px 12px",
                            background: "var(--bg-card)",
                            border: "1px solid var(--border-default)",
                            borderRadius: 999,
                            fontSize: "0.8rem",
                            color: "var(--text-secondary)",
                          }}
                        >
                          <i
                            className="fas fa-circle"
                            style={{ color: "var(--success)", fontSize: 6 }}
                          />
                          {profile.status}
                        </span>
                      </div>
                    )}

                    {profile.favoriteAnime?.length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "var(--text-muted)",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <i
                            className="fas fa-heart"
                            style={{ color: "#ef4444" }}
                          />{" "}
                          Favorite Anime
                        </span>
                        <div
                          style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
                        >
                          {profile.favoriteAnime.slice(0, 5).map((fav, i) => {
                            const id = typeof fav === "object" ? fav.id : fav;
                            const fallbackTitle =
                              typeof fav === "object" ? fav.title : null;
                            const title =
                              fallbackTitle ||
                              animeTitleMap[id] ||
                              `Anime #${id}`;
                            return (
                              <span
                                key={i}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  padding: "4px 12px",
                                  background: "var(--bg-card)",
                                  border: "1px solid var(--border-default)",
                                  borderRadius: 999,
                                  fontSize: "0.8rem",
                                  color: "var(--text-secondary)",
                                }}
                              >
                                {title}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {socialKeys.length > 0 && (
                    <div style={{ display: "flex", gap: 8 }}>
                      {socialKeys.map((k) => (
                        <a
                          key={k}
                          href={getSocialUrl(k, profile.social[k])}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            width: 40,
                            height: 40,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "var(--bg-card)",
                            border: "1px solid var(--border-default)",
                            borderRadius: 10,
                            color: "var(--text-secondary)",
                            transition: "0.2s",
                          }}
                          title={`${k}: ${profile.social[k]}`}
                        >
                          <SocialIcon platform={k} />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* STATS GRID (NO CUTOFF, EXPLICIT NO BACKGROUND) */}
              <div style={{ padding: "0 24px 24px" }}>
                <div
                  className="profile-stats-grid"
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: 0,
                  }}
                >
                  <StatCard
                    icon="fa-tv"
                    value={profile.stats?.totalAnime}
                    label="Total Anime"
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
              </div>

              {/* ANIME LIST (NO TABS, JUST COMPLETED LIST) */}
              <div style={{ padding: "0 24px 24px", minHeight: "250px" }}>
                <h3
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <i
                    className="fas fa-check-circle"
                    style={{ color: "var(--brand-yellow)" }}
                  />{" "}
                  Completed Anime
                </h3>
                {(() => {
                  const list = profile.animeList?.completed || [];
                  if (!list.length)
                    return (
                      <EmptyState
                        icon="fa-inbox"
                        message="No completed anime yet"
                      />
                    );

                  return (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(130px, 1fr))",
                        gap: 16,
                      }}
                    >
                      {list.slice(0, 50).map((a) => (
                        <div
                          key={a.id}
                          style={{
                            background: "var(--bg-card)",
                            borderRadius: 10,
                            overflow: "hidden",
                            border: "1px solid var(--border-default)",
                            display: "flex",
                            flexDirection: "column",
                            transition: "transform 0.2s, border-color 0.2s",
                          }}
                          className="hover-card"
                        >
                          <img
                            src={
                              a.cover ||
                              "https://placehold.co/140x210/111111/555555?text=No+Image"
                            }
                            alt={a.title}
                            style={{
                              width: "100%",
                              aspectRatio: "2 / 3",
                              objectFit: "cover",
                              display: "block",
                              background: "var(--bg-surface)",
                            }}
                            onError={(e) => {
                              e.target.src =
                                "https://placehold.co/140x210/111111/555555?text=No+Image";
                            }}
                          />
                          <div
                            style={{
                              padding: 10,
                              flex: 1,
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                color: "var(--text-primary)",
                              }}
                              title={a.title}
                            >
                              {a.title}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginTop: 6,
                                fontSize: "0.7rem",
                                color: "var(--text-muted)",
                              }}
                            >
                              <span>{a.type || "TV"}</span>
                              <span>{a.episodes || 0} Eps</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* CSS for Responsive Layout & Hover Effects */}
      <style>{`
        .hover-card:hover {
          transform: translateY(-2px);
          border-color: var(--border-strong) !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        
        .profile-header-row {
          display: flex;
          align-items: flex-end;
          padding: 0 24px;
          margin-top: -60px;
          position: relative;
          z-index: 2;
          gap: 20px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .profile-avatar {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          object-fit: cover;
          border: 4px solid var(--bg-surface);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          background: var(--bg-surface);
          flex-shrink: 0;
        }

        .profile-info-wrapper {
          flex: 1;
          min-width: 240px;
          padding-bottom: 8px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .profile-name-col {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .profile-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 16px;
        }

        @media (max-width: 650px) {
          .profile-header-row {
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 12px;
            margin-top: -50px;
          }
          .profile-avatar {
            width: 100px;
            height: 100px;
          }
          .profile-info-wrapper {
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding-bottom: 0;
          }
          .profile-name-col {
            align-items: center;
          }
          .profile-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}

function StatCard({ icon, value, label }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px",
        background: "var(--bg-card)",
        border: "1px solid var(--border-default)",
        borderRadius: 10,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: "var(--bg-surface)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--brand-yellow)",
          fontSize: "1rem",
          flexShrink: 0,
        }}
      >
        <i className={`fas ${icon}`} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <span
          style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            lineHeight: 1.2,
          }}
        >
          {formatCompact(value)}
        </span>
        <span
          style={{
            fontSize: "0.65rem",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginTop: 2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

function EmptyState({ icon, message }) {
  return (
    <div
      style={{
        padding: "60px 20px",
        textAlign: "center",
        color: "var(--text-muted)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "var(--bg-card)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
          border: "1px solid var(--border-subtle)",
        }}
      >
        <i
          className={`fas ${icon}`}
          style={{ fontSize: 28, color: "var(--brand-yellow)", opacity: 0.8 }}
        />
      </div>
      <h3
        style={{
          fontSize: "1.2rem",
          marginBottom: 8,
          color: "var(--text-primary)",
        }}
      >
        {message}
      </h3>
      <p style={{ fontSize: "0.9rem", margin: 0 }}>Nothing to show here yet.</p>
    </div>
  );
}
