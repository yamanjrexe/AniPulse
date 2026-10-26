import React, { useMemo } from "react";
import { useAnime } from "../../../context/AnimeContext.jsx";
import { getLevelFromXP } from "../../../services/levelSystem.js";

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

function formatJoinDate(dateStr) {
  if (!dateStr) return "Recently";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function ProfilePreviewBanner({ profile }) {
  const { animeData } = useAnime();

  const name = profile.name || profile.username || "User";
  const avatar =
    profile.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=FCE706&color=050505&bold=true&size=200`;

  const socialKeys = Object.keys(profile.social || {}).filter(
    (k) => profile.social[k],
  );

  const titleMap = useMemo(() => {
    const map = {};
    (animeData || []).forEach((a) => {
      if (a?.id != null && a.title) map[a.id] = a.title;
    });
    return map;
  }, [animeData]);

  // Calculate Level
  let totalXP = parseInt(localStorage.getItem("userXP") || "0", 10);
  if (!totalXP) {
    try {
      const p = JSON.parse(localStorage.getItem("userProfile") || "{}");
      if (typeof p.totalExp === "number") totalXP = p.totalExp;
    } catch {}
  }
  const computed = getLevelFromXP(totalXP);

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-default)",
        borderRadius: "16px",
        marginBottom: "24px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* BANNER (Inset & Curved) */}
      <div style={{ padding: "24px 24px 0" }}>
        <div
          style={{
            width: "100%",
            height: 200,
            position: "relative",
            borderRadius: "16px",
            overflow: "hidden",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          {profile.cover ? (
            <img
              src={profile.cover}
              alt="Cover"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background:
                  "linear-gradient(135deg, rgba(252, 231, 6, 0.15) 0%, rgba(20, 20, 20, 1) 100%)",
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
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          padding: "0 24px",
          marginTop: "-60px",
          position: "relative",
          zIndex: 2,
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        <img
          src={avatar}
          alt={name}
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            objectFit: "cover",
            border: "4px solid var(--bg-card)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            background: "var(--bg-surface)",
            flexShrink: 0,
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginBottom: "8px",
            minWidth: 0,
          }}
        >
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
            {name}
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
              Lv.{computed.level}
            </span>
            <span
              style={{
                color: "var(--text-secondary)",
                fontWeight: 600,
                fontSize: "0.95rem",
              }}
            >
              {computed.title}
            </span>
          </div>
        </div>
      </div>

      {/* INFO BELOW */}
      <div
        style={{
          padding: "16px 24px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div
          style={{
            fontSize: "0.85rem",
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <i className="fas fa-calendar-plus" />
          <span>Member since {formatJoinDate(profile.memberSince)}</span>
        </div>

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
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {profile.status && (
              <div>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 12px",
                    background: "var(--bg-surface)",
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
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
                  <i className="fas fa-heart" style={{ color: "#ef4444" }} />{" "}
                  Favorite Anime
                </span>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {profile.favoriteAnime.slice(0, 5).map((fav, i) => {
                    const id = typeof fav === "object" ? fav.id : fav;
                    const title =
                      (typeof fav === "object" && fav.title) ||
                      titleMap[id] ||
                      `Anime #${id}`;
                    return (
                      <span
                        key={i}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "4px 12px",
                          background: "var(--bg-surface)",
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
                    background: "var(--bg-surface)",
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
    </div>
  );
}
