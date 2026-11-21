import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Link } from "react-router-dom";
import { api } from "../../../services/api.js";
import { useToast } from "../../../context/ToastContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { ACHIEVEMENTS } from "../../../services/achievements.js";
import { getLevelFromXP } from "../../../services/levelSystem.js";
import { firebase } from "../../../firebaseClient.js";
import PosterImage from "../../../components/ui/PosterImage.jsx";

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
  if (platform === "anilist")
    return (
      <img
        src="/svg/anilist.svg"
        alt="AniList"
        style={{
          width: 20,
          height: 20,
          objectFit: "contain",
          display: "block",
        }}
      />
    );
  if (platform === "myanimelist")
    return (
      <img
        src="/svg/myanimelist.svg"
        alt="MyAnimeList"
        style={{
          width: 20,
          height: 20,
          objectFit: "contain",
          display: "block",
        }}
      />
    );
  if (platform === "twitter")
    return <i className="fab fa-twitter" style={{ fontSize: "1rem" }} />;
  if (platform === "instagram")
    return <i className="fab fa-instagram" style={{ fontSize: "1rem" }} />;
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
    const compare = String(db).localeCompare(String(da));
    if (compare !== 0) return compare;
    return (Number(b.id) || 0) - (Number(a.id) || 0);
  });
}

const _profileCache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

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
      if (s.length > 0 && typeof s[0] === "number")
        return s.map((i) => ACHIEVEMENTS[i]?.id).filter(Boolean);
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
    publicUsername:
      userProfile.publicUsername || userProfile.usernameLower || null,
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
    publicUsername: data.publicUsername || null,
    avatar: data.avatar || null,
    cover: data.cover || null,
    bio: data.bio || "",
    status: data.status || "",
    favoriteAnime: data.favoriteAnime || [],
    social: data.social || {},
    level: Number(data.level) || 1,
    levelTitle: data.levelTitle || data.title || "Rookie",
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

export default function UserProfileModal({ user: initialUser, onClose }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const userId = useMemo(() => {
    if (!initialUser) return null;
    if (typeof initialUser === "string") return initialUser;
    return initialUser.uid === "current" ? "current" : initialUser.uid;
  }, [initialUser]);

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

  const [profile, setProfile] = useState(() => {
    if (initialUser && typeof initialUser === "object" && !isSelf) {
      return {
        uid: initialUser.uid,
        name: initialUser.name || initialUser.username || "User",
        avatar: initialUser.avatar,
        level: initialUser.level || 1,
        levelTitle: initialUser.title || "Rookie",
        totalXP: initialUser.totalXP || 0,
        stats: {
          totalAnime: initialUser.totalAnime || 0,
          completed: initialUser.totalAnime || 0,
          watching: 0,
          planToWatch: 0,
          totalHours: initialUser.totalHours || 0,
          totalEpisodes: 0,
        },
        animeList: { completed: [], watching: [], planToWatch: [] },
        achievements: [],
        recentActivity: [],
        isCurrentUser: false,
        isFriend: false,
      };
    }
    return null;
  });

  const [loading, setLoading] = useState(() => !profile);
  const hasProfileRef = useRef(!!profile);

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
      if (!hasProfileRef.current) setLoading(true);

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
        hasProfileRef.current = true;
      } catch (err) {
        if (cancelled) return;
        if (!hasProfileRef.current) {
          showToast(err.message || "Failed to load profile", "error");
          onClose?.();
        }
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-title">
            <i className="fas fa-user-circle" />
            <span>User Profile</span>
            {isSelf && <span className="modal-header-self-tag">(You)</span>}
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="modal-body">
          {loading && !profile ? (
            <div className="modal-loading">
              <i className="fas fa-spinner fa-spin" />
              <span>Loading profile...</span>
            </div>
          ) : profile ? (
            <>
              <div className="profile-banner-container">
                <div className="profile-banner">
                  {profile.cover ? (
                    <img src={profile.cover} alt="Cover" />
                  ) : (
                    <div className="profile-banner-fallback" />
                  )}
                  <div className="profile-banner-overlay" />
                </div>
              </div>

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
                    <h2>{profile.name}</h2>
                    <div className="profile-level">
                      <span className="level-badge">Lv. {profile.level}</span>
                      <span className="level-title">{profile.levelTitle}</span>
                    </div>
                  </div>

                  <div className="profile-header-actions">
                    {profile.publicUsername && (
                      <Link
                        to={`/u/${profile.publicUsername}/profile`}
                        onClick={onClose}
                        className="profile-action-btn"
                      >
                        <i className="fas fa-external-link-alt" />
                        <span>View Profile</span>
                      </Link>
                    )}

                    {!profile.isCurrentUser && (
                      <button
                        type="button"
                        onClick={sendFriendRequest}
                        disabled={profile.isFriend}
                        className={
                          profile.isFriend
                            ? "profile-action-btn"
                            : "profile-action-btn primary"
                        }
                      >
                        <i
                          className={`fas ${profile.isFriend ? "fa-user-check" : "fa-user-plus"}`}
                        />
                        <span>
                          {profile.isFriend ? "Friend" : "Add Friend"}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="profile-bio-container">
                {profile.bio && (
                  <p className="profile-bio-text">{profile.bio}</p>
                )}

                <div className="profile-bio-footer">
                  <div className="profile-bio-left">
                    {profile.status && (
                      <span className="profile-status-pill">
                        <span className="profile-status-dot" />
                        {profile.status}
                      </span>
                    )}

                    {profile.favoriteAnime?.length > 0 && (
                      <div className="profile-favorites">
                        <span className="profile-favorites-label">
                          Favorite Anime&apos;s
                        </span>
                        <div className="profile-favorites-list">
                          {profile.favoriteAnime.slice(0, 5).map((fav, i) => {
                            const id = typeof fav === "object" ? fav.id : fav;
                            const fallbackTitle =
                              typeof fav === "object" ? fav.title : null;
                            const title =
                              fallbackTitle ||
                              animeTitleMap[id] ||
                              `Anime #${id}`;
                            return (
                              <span key={i} className="profile-fav-tag">
                                {title}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {socialKeys.length > 0 && (
                    <div className="profile-social-links">
                      {socialKeys.map((k) => (
                        <a
                          key={k}
                          href={getSocialUrl(k, profile.social[k])}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="profile-social-link"
                          title={`${k}: ${profile.social[k]}`}
                        >
                          <SocialIcon platform={k} />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="profile-stats-container">
                <div className="profile-stats-grid">
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

              <div className="profile-anime-container">
                <h3 className="profile-anime-heading">
                  <i className="fas fa-check-circle" />
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
                    <div className="anime-grid">
                      {list.slice(0, 30).map((a) => (
                        <div key={a.id} className="anime-card-mini">
                          <PosterImage anime={a} alt={a.title} />
                          <div className="anime-card-body">
                            <div className="anime-card-title" title={a.title}>
                              {a.title}
                            </div>
                            <div className="anime-card-meta">
                              <span>{a.type || "TV"}</span>
                              <span>
                                {a.episodes || 0}{" "}
                                {a.episodes === 1 ? "Ep" : "Eps"}
                              </span>
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
    </div>
  );
}

function StatCard({ icon, value, label }) {
  return (
    <div className="profile-stat-card">
      <div className="profile-stat-icon">
        <i className={`fas ${icon}`} />
      </div>
      <div className="profile-stat-body">
        <span className="profile-stat-value">{formatCompact(value)}</span>
        <span className="profile-stat-label">{label}</span>
      </div>
    </div>
  );
}

function EmptyState({ icon, message }) {
  return (
    <div className="profile-empty-state">
      <div className="profile-empty-icon">
        <i className={`fas ${icon}`} />
      </div>
      <h3 className="profile-empty-title">{message}</h3>
      <p className="profile-empty-desc">Nothing to show here yet.</p>
    </div>
  );
}
