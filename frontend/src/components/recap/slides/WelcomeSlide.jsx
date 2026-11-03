import React from "react";

export default function WelcomeSlide({ periodText, isYearly }) {
  return (
    <>
      <div className="slide-icon glowing-gold">
        <i className="fas fa-calendar-alt" />
      </div>
      <h1>{periodText}</h1>
      <p className="subtitle">
        {isYearly ? "Yearly Anime Recap" : "Monthly Anime Recap"}
      </p>
      <p className="hint">Let's look back at your journey</p>
    </>
  );
}
