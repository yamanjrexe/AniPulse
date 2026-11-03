import React from "react";
import CountUp from "../../../components/ui/CountUp.jsx";

export default function HoursSlide({ data }) {
  return (
    <>
      <div className="slide-icon">
        <i className="fas fa-clock" />
      </div>
      <h1>
        <CountUp end={data.totalHours} duration={1800} />
      </h1>
      <p className="subtitle">Hours Watched</p>
      <p className="hint">That's {Math.floor(data.totalHours / 24)} days!</p>
      <div className="stat-badge">
        <span>
          <i className="fas fa-calendar-day" /> {data.avgEpisodesPerDay}{" "}
          episodes/day
        </span>
      </div>
    </>
  );
}
