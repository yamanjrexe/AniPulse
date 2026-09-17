import React from "react";

export default function RatingPersonality({
    avg,
    median,
    spread,
    buckets,
    total,
}) {
    const personality = (() => {
        if (!total)
            return {
                name: "No Data Yet",
                desc: "Rate some anime to discover your personality.",
                icon: "fa-user-astronaut",
            };

        const high = ((buckets[0] + buckets[1]) / total) * 100;
        const mid = ((buckets[2] + buckets[3] + buckets[4]) / total) * 100;
        const low = (buckets[5] / total) * 100;

        if (high >= 60)
            return {
                name: "Generous Rater",
                desc: "You tend to rate anime highly.",
                icon: "fa-face-smile",
            };
        if (high >= 40)
            return {
                name: "Balanced Critic",
                desc: "You use the full scoring scale.",
                icon: "fa-scale-balanced",
            };
        if (mid >= 50)
            return {
                name: "Cautious Rater",
                desc: "Most of your ratings fall in the middle.",
                icon: "fa-face-meh",
            };
        if (low >= 30)
            return {
                name: "Harsh Critic",
                desc: "You rate anime strictly.",
                icon: "fa-face-frown",
            };
        if (avg >= 8.5)
            return {
                name: "Optimistic Viewer",
                desc: "You generally enjoy what you watch.",
                icon: "fa-face-laugh",
            };
        if (avg <= 6.5)
            return {
                name: "Selective Reviewer",
                desc: "You are selective & critical.",
                icon: "fa-face-grimace",
            };
        return {
            name: "Balanced Viewer",
            desc: "A balanced approach to rating.",
            icon: "fa-face-smile",
        };
    })();

    return (
        <div className="rating-personality">
            <div className="personality-card">
                <div className="personality-icon">
                    <i
                        className={`fas ${personality.icon}`}
                        aria-hidden="true"
                    />
                </div>
                <div className="personality-content">
                    <div className="personality-label">
                        Your Rating Personality
                    </div>
                    <div className="personality-value">{personality.name}</div>
                    <div className="personality-description">
                        {personality.desc}
                    </div>
                </div>
                <div className="personality-stats">
                    <div className="personality-stat">
                        <span className="personality-stat-value">
                            {avg.toFixed(1)}
                        </span>
                        <span className="personality-stat-label">Average</span>
                    </div>
                    <div className="personality-stat">
                        <span className="personality-stat-value">
                            {median.toFixed(1)}
                        </span>
                        <span className="personality-stat-label">Median</span>
                    </div>
                    <div className="personality-stat">
                        <span className="personality-stat-value">
                            {spread.toFixed(1)}
                        </span>
                        <span className="personality-stat-label">Spread</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
