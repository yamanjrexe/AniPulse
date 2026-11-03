import React from "react";
import CountUp from "../../../components/ui/CountUp.jsx";

export default function ConsistencySlide({ data, isYearly }) {
  const denom = isYearly ? 365 : 30;
  const pct = Math.round((data.streakDays / denom) * 100);

  return (
    <>
      <div className="slide-icon">
        <i className="fas fa-calendar-check" />
      </div>
      <h1>
        <CountUp end={pct} duration={1500} suffix="%" />
      </h1>
      <p className="subtitle">Consistency Rate</p>
      <p className="hint">Days with anime watching</p>
    </>
  );
}
