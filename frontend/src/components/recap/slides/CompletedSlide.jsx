import React from "react";
import CountUp from "../../../components/ui/CountUp.jsx";

export default function CompletedSlide({ data, isYearly }) {
  return (
    <>
      <div className="slide-icon">
        <i className="fas fa-tv" />
      </div>
      <h1>
        <CountUp end={data.totalAnime} duration={1500} />
      </h1>
      <p className="subtitle">Anime Completed</p>
      <p className="hint">{isYearly ? "Over 12 months" : "In one month"}</p>
      <div className="stat-badge">
        <span>
          <i className="fas fa-film" /> {data.totalEpisodes} episodes
        </span>
      </div>
    </>
  );
}
