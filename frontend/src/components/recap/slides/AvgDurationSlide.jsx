import React from "react";
import CountUp from "../../../components/ui/CountUp.jsx";

export default function AvgDurationSlide({ data }) {
  const dur = parseFloat(data.avgDuration) || 0;
  return (
    <>
      <div className="slide-icon">
        <i className="fas fa-running" />
      </div>
      <h1>
        <CountUp end={dur} duration={1500} suffix="m" />
      </h1>
      <p className="subtitle">Average Episode Length</p>
      <p className="hint">
        {dur >= 20 ? "Standard TV format" : "Shorts & movies"}
      </p>
      <div className="stat-badge">
        <span>
          <i className="fas fa-hourglass-half" /> {data.totalEpisodes} total
          episodes
        </span>
      </div>
    </>
  );
}
