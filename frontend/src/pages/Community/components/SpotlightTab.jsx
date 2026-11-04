import React, { useState, useEffect, useRef } from "react";
import PosterImage from "../../../components/ui/PosterImage.jsx";
import Pagination from "../../../components/ui/Pagination.jsx";

function cleanDescription(text) {
  if (!text) return "No description available.";
  const clean = text.replace(/<[^>]+>/g, " ");
  return clean.length > 180 ? clean.substring(0, 180) + "..." : clean;
}

function extractSeason(title) {
  if (!title) return null;

  let match = title.match(/Season\s+(\d+)/i);
  if (match) return `S${match[1]}`;

  match = title.match(/(\d+)(st|nd|rd|th)\s+Season/i);
  if (match) return `S${match[1]}`;

  match = title.match(/\bS(\d+)\b/i);
  if (match) return `S${match[1]}`;

  match = title.match(/\b(II|III|IV|V|VI|VII|VIII)\b/i);
  if (match) {
    const roman = match[1].toUpperCase();
    const map = {
      II: "S2",
      III: "S3",
      IV: "S4",
      V: "S5",
      VI: "S6",
      VII: "S7",
      VIII: "S8",
    };
    return map[roman] || null;
  }

  match = title.match(/\s(?:Part\s*)?(\d+)$/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num < 10) return `S${num}`;
  }

  if (/Final Season/i.test(title)) return "Final";

  return null;
}

export default function SpotlightTab() {
  const [heroes, setHeroes] = useState([]);
  const [activeHero, setActiveHero] = useState(0);
  const [grid, setGrid] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingGrid, setLoadingGrid] = useState(false);
  const [error, setError] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const timerRef = useRef(null);

  const fetchTrending = async (targetPage = 1) => {
    const perPage = targetPage === 1 ? 46 : 40;

    if (targetPage === 1) setLoading(true);
    else setLoadingGrid(true);

    setError(false);

    try {
      const query = `
        query ($page: Int, $perPage: Int) {
          Page(page: $page, perPage: $perPage) {
            pageInfo { lastPage }
            media(type: ANIME, sort: TRENDING_DESC) {
              id
              title { english romaji }
              coverImage { extraLarge large }
              bannerImage
              averageScore
              format
              episodes
              genres
              description(asHtml: false)
              siteUrl
            }
          }
        }
      `;

      const res = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          query,
          variables: { page: targetPage, perPage },
        }),
      });

      const json = await res.json();

      if (json.data?.Page?.media) {
        const media = json.data.Page.media;
        setTotalPages(json.data.Page.pageInfo.lastPage);

        const formattedMedia = media.map((m) => {
          const displayTitle = m.title.english || m.title.romaji;
          return {
            id: m.id,
            anilistId: m.id,
            title: displayTitle,
            season: extractSeason(displayTitle),
            cover: m.coverImage?.extraLarge || m.coverImage?.large,
            banner: m.bannerImage,
            score: m.averageScore ? (m.averageScore / 10).toFixed(1) : null,
            type: m.format,
            episodes: m.episodes,
            genres: m.genres || [],
            description: cleanDescription(m.description),
            url: m.siteUrl,
          };
        });

        if (targetPage === 1) {
          setHeroes(formattedMedia.slice(0, 6));
          setActiveHero(0);
          setGrid(formattedMedia.slice(6));
        } else {
          setGrid(formattedMedia);
        }
      } else {
        setError(true);
      }
    } catch (err) {
      console.error("Failed to fetch trending anime", err);
      setError(true);
    } finally {
      setLoading(false);
      setLoadingGrid(false);
    }
  };

  useEffect(() => {
    fetchTrending(page);
  }, [page]);

  useEffect(() => {
    if (heroes.length > 0) {
      timerRef.current = setInterval(() => {
        setActiveHero((prev) => (prev + 1) % heroes.length);
      }, 6000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [heroes]);

  const handleManualHeroChange = (index) => {
    setActiveHero(index);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveHero((prev) => (prev + 1) % heroes.length);
    }, 6000);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading && heroes.length === 0) {
    return (
      <div className="community-tab-content active">
        <div className="spotlight-skeleton-hero skeleton" />
        <div className="spotlight-skeleton-grid">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="spotlight-skeleton-card skeleton" />
          ))}
        </div>
      </div>
    );
  }

  if (error && heroes.length === 0) {
    return (
      <div
        className="community-tab-content active"
        style={{ textAlign: "center", padding: "60px 20px" }}
      >
        <i
          className="fas fa-exclamation-triangle"
          style={{
            fontSize: "32px",
            color: "var(--brand-red)",
            marginBottom: "16px",
          }}
        />
        <h3 style={{ color: "var(--text-primary)", marginBottom: "8px" }}>
          Could not load trending anime
        </h3>
        <p style={{ color: "var(--text-muted)", marginBottom: "20px" }}>
          Check your connection or try again later.
        </p>
        <button className="btn btn-primary" onClick={() => fetchTrending(1)}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="community-tab-content active spotlight-tab">
      {page === 1 && heroes.length > 0 && (
        <div className="spotlight-slider">
          {heroes.map((hero, index) => (
            <div
              key={hero.id}
              className={`spotlight-slide ${index === activeHero ? "active" : ""}`}
            >
              <div
                className="spotlight-hero-bg"
                style={{ backgroundImage: `url(${hero.banner || hero.cover})` }}
              />
              <div className="spotlight-hero-overlay" />

              <div className="spotlight-hero-layout">
                <div className="spotlight-hero-content">
                  <div className="spotlight-badge">
                    <i className="fas fa-fire" /> #{index + 1} Trending Globally
                  </div>
                  <h2 className="clamped-title" title={hero.title}>
                    {hero.title}
                  </h2>
                  <div className="spotlight-meta">
                    <span className="score">
                      <i className="fas fa-star" /> {hero.score}
                    </span>
                    <span>{hero.type}</span>
                    <span>{hero.episodes || "?"} Episodes</span>
                  </div>
                  <p className="spotlight-desc">{hero.description}</p>
                  <div className="spotlight-genres">
                    {hero.genres.slice(0, 3).map((g) => (
                      <span key={g}>{g}</span>
                    ))}
                  </div>
                  <a
                    href={hero.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary spotlight-btn"
                    style={{ color: "black" }}
                  >
                    View on AniList
                  </a>
                </div>

                <div className="spotlight-hero-poster">
                  <PosterImage anime={hero} alt={hero.title} />
                </div>
              </div>
            </div>
          ))}

          <div className="spotlight-slider-dots">
            {heroes.map((_, idx) => (
              <button
                key={idx}
                className={`slider-dot ${idx === activeHero ? "active" : ""}`}
                onClick={() => handleManualHeroChange(idx)}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="spotlight-grid-header">
        <h3>{page === 1 ? "Trending Now" : `Trending Now - Page ${page}`}</h3>
        <p>What the world is watching right now</p>
      </div>

      <div className={`spotlight-grid ${loadingGrid ? "is-loading" : ""}`}>
        {grid.map((anime) => (
          <div key={anime.id} className="spotlight-card">
            <div className="spotlight-poster-wrap">
              <PosterImage anime={anime} alt={anime.title} />

              {anime.season && (
                <div className="spotlight-season-badge poster-badge">
                  {anime.season}
                </div>
              )}

              {anime.score && (
                <div className="spotlight-score">★ {anime.score}</div>
              )}
            </div>
            <div className="spotlight-info">
              <div className="spotlight-title" title={anime.title}>
                {anime.title}
              </div>
              <div className="spotlight-sub">
                <span>{anime.type}</span>
                <span>{anime.episodes ? `${anime.episodes} eps` : "?"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="spotlight-pagination">
          <Pagination
            totalPages={totalPages}
            activePage={page}
            onChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
