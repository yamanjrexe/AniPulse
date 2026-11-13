import React from "react";

export default function OverviewStats({ stats }) {
  return (
    <div className="profileSection">
      <h2 className="sectionHeading">Overview</h2>
      <div className="siteStatsGrid">
        <div className="siteStatBox">
          <div className="statLabel">TOTAL ANIME</div>
          <div className="statValue">{stats.totalAnime}</div>
          <div className="statSub">added to list</div>
        </div>
        <div className="siteStatBox">
          <div className="statLabel">EPISODES</div>
          <div className="statValue">{stats.episodes}</div>
          <div className="statSub">watched</div>
        </div>
        <div className="siteStatBox">
          <div className="statLabel">HOURS</div>
          <div className="statValue">{stats.hours}</div>
          <div className="statSub">watch time</div>
        </div>
        <div className="siteStatBox">
          <div className="statLabel">STREAK</div>
          <div className="statValue">{stats.streak}</div>
          <div className="statSub">days active</div>
        </div>
      </div>
    </div>
  );
}
