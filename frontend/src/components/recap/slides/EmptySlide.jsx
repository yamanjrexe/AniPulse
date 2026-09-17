import React from "react";

export default function EmptySlide({ periodText, isYearly }) {
    return (
        <>
            <div className="slide-icon">
                <i className="fas fa-calendar-times" />
            </div>
            <h1>No anime completed</h1>
            <p className="period">{periodText}</p>
            <p className="hint">
                {isYearly ? "This year" : "This month"} was quiet...
            </p>
        </>
    );
}
