import React from "react";

export default function AnimeStats({ stats }) {
  const total =
    stats.breakdown.completed +
      stats.breakdown.watching +
      stats.breakdown.onHold +
      stats.breakdown.dropped +
      stats.breakdown.planToWatch || 1;

  return (
    <div className="profileSection">
      <h2 className="sectionHeading">Anime stats</h2>
      <div className="animeStatsCard">
        <div className="animeStatsTop">
          <div className="animeStatItem">
            <div className="animeStatValue">{stats.daysWatched}</div>
            <div className="animeStatLabel">Days watched</div>
          </div>
          <div className="animeStatItem">
            <div className="animeStatValue">{stats.episodes}</div>
            <div className="animeStatLabel">Episodes watched</div>
          </div>
          <div className="animeStatItem">
            <div className="animeStatValue">{stats.totalAnime}</div>
            <div className="animeStatLabel">Total anime</div>
          </div>
        </div>

        <div className="animeStatsMainBar">
          <div className="mainBarFill" />
        </div>

        <div className="animeStatsBreakdown">
          <div className="breakdownItem">
            <span className="dot watching" /> Watching{" "}
            <span className="count">{stats.breakdown.watching}</span>
            <div className="breakdownBar">
              <div
                className="watching-bar"
                style={{
                  width: `${(stats.breakdown.watching / total) * 100}%`,
                }}
              />
            </div>
          </div>
          <div className="breakdownItem">
            <span className="dot completed" /> Completed{" "}
            <span className="count">{stats.breakdown.completed}</span>
            <div className="breakdownBar">
              <div
                className="completed-bar"
                style={{
                  width: `${(stats.breakdown.completed / total) * 100}%`,
                }}
              />
            </div>
          </div>
          <div className="breakdownItem">
            <span className="dot onhold" /> On-Hold{" "}
            <span className="count">{stats.breakdown.onHold}</span>
            <div className="breakdownBar">
              <div
                className="onhold-bar"
                style={{ width: `${(stats.breakdown.onHold / total) * 100}%` }}
              />
            </div>
          </div>
          <div className="breakdownItem">
            <span className="dot dropped" /> Dropped{" "}
            <span className="count">{stats.breakdown.dropped}</span>
            <div className="breakdownBar">
              <div
                className="dropped-bar"
                style={{ width: `${(stats.breakdown.dropped / total) * 100}%` }}
              />
            </div>
          </div>
          <div className="breakdownItem">
            <span className="dot plan" /> Plan to Watch{" "}
            <span className="count">{stats.breakdown.planToWatch}</span>
            <div className="breakdownBar">
              <div
                className="plan-bar"
                style={{
                  width: `${(stats.breakdown.planToWatch / total) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
