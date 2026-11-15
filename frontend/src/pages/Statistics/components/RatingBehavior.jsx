import React, { useMemo } from "react";

export default function RatingBehavior({ rated, avg, median }) {
  const data = useMemo(() => {
    if (!rated.length) {
      return {
        mostCommon: 0,
        mostCommonCount: 0,
        highestGenre: null,
        lowestGenre: null,
        perfectScores: 0,
        maxScore: 0,
        minScore: 0,
        spread: 0,
      };
    }

    const dist = {};
    rated.forEach((a) => {
      const s = Math.round(a.score);
      dist[s] = (dist[s] || 0) + 1;
    });
    const sorted = Object.entries(dist).sort((a, b) => b[1] - a[1]);
    const mostCommon = parseInt(sorted[0][0]);
    const mostCommonCount = sorted[0][1];

    const perfectScores = rated.filter(
      (a) => Math.round(a.score) === 10,
    ).length;

    const scores = rated.map((a) => a.score);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const spread = maxScore - minScore;

    const genreScores = {};
    rated.forEach((a) => {
      (a.genres || []).forEach((g) => {
        if (!genreScores[g]) genreScores[g] = { total: 0, count: 0 };
        genreScores[g].total += a.score;
        genreScores[g].count++;
      });
    });
    const filtered = Object.entries(genreScores)
      .filter(([, d]) => d.count >= 2)
      .map(([genre, d]) => ({
        genre,
        avg: d.total / d.count,
        count: d.count,
      }))
      .sort((a, b) => b.avg - a.avg);

    const highestGenre = filtered[0] || null;
    const lowestGenre =
      filtered.length > 1 ? filtered[filtered.length - 1] : null;

    return {
      mostCommon,
      mostCommonCount,
      highestGenre,
      lowestGenre,
      perfectScores,
      maxScore,
      minScore,
      spread,
    };
  }, [rated]);

  const cards = [
    {
      value: `${avg.toFixed(1)}★`,
      label: "Average",
      detail: `from ${rated.length} ratings`,
    },
    {
      value: `${median.toFixed(1)}★`,
      label: "Median",
      detail: "middle value",
    },
    {
      value: `${data.mostCommon}★`,
      label: "Most Common",
      detail: `${data.mostCommonCount} times`,
    },
    {
      value: data.perfectScores,
      label: "Perfect 10s",
      detail: "masterpieces",
    },
    {
      value: data.maxScore ? `${data.maxScore}★` : "—",
      label: "Highest",
      detail: "peak score",
    },
    {
      value: data.minScore ? `${data.minScore}★` : "—",
      label: "Lowest",
      detail: "lowest score",
    },
    {
      value: data.highestGenre?.genre || "—",
      label: "Top Genre",
      detail: data.highestGenre
        ? `${data.highestGenre.avg.toFixed(1)}★ (${data.highestGenre.count})`
        : "No data",
    },
    {
      value: data.lowestGenre?.genre || "—",
      label: "Lowest Genre",
      detail: data.lowestGenre
        ? `${data.lowestGenre.avg.toFixed(1)}★ (${data.lowestGenre.count})`
        : "No data",
    },
    {
      value: data.spread ? `${data.spread.toFixed(1)}` : "—",
      label: "Spread",
      detail: "max - min",
    },
  ];

  return (
    <div
      className="rating-card insights-card"
      style={{ display: "flex", flexDirection: "column", height: "100%" }}
    >
      <div className="rating-card-header">
        <div className="rating-card-title">
          <i className="fas fa-brain" /> Rating Behavior
        </div>
        <span className="rating-card-badge">Insights</span>
      </div>
      <div
        className="rating-behavior-grid"
        style={{
          gridTemplateColumns: "repeat(3, 1fr)",
          gridTemplateRows: "repeat(3, 1fr)",
          flex: 1,
          gap: "12px",
        }}
      >
        {cards.map((c, i) => (
          <div
            key={i}
            className="behavior-card"
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "16px 8px",
            }}
          >
            <span
              className="behavior-value"
              title={c.value}
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontSize: "1.15rem",
              }}
            >
              {c.value}
            </span>
            <span className="behavior-label" style={{ marginTop: "4px" }}>
              {c.label}
            </span>
            <span className="behavior-detail">{c.detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
