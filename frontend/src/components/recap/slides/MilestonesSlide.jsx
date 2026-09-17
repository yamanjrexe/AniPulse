import React from "react";

const MILESTONES = [1, 5, 10, 25, 50, 75, 100, 150, 200, 250, 300, 400, 500];

export default function MilestonesSlide({ totalAnime = 0 }) {
    const next = MILESTONES.find((m) => m > totalAnime) || null;
    const achieved = MILESTONES.filter((m) => m <= totalAnime).slice(-3);

    return (
        <>
            <div className="slide-icon">
                <i className="fas fa-trophy" />
            </div>
            <h1>{totalAnime}</h1>
            <p className="subtitle">Anime Milestones</p>

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    marginTop: 20,
                    width: "100%",
                    maxWidth: 380,
                }}
            >
                {achieved.map((m) => (
                    <div
                        key={m}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "8px 14px",
                            background: "rgba(252, 231, 6, 0.08)",
                            borderRadius: 8,
                            border: "1px solid rgba(252, 231, 6, 0.24)",
                        }}
                    >
                        <i
                            className="fas fa-trophy"
                            style={{ color: "#FCE706", fontSize: 14 }}
                        />
                        <span
                            style={{
                                fontSize: "0.85rem",
                                fontWeight: 500,
                                color: "#FBFBFB",
                            }}
                        >
                            {m} anime completed
                        </span>
                    </div>
                ))}

                {next && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "8px 14px",
                            background: "#171717",
                            borderRadius: 8,
                            border: "1px solid #292929",
                        }}
                    >
                        <i
                            className="fas fa-lock"
                            style={{ color: "#555555", fontSize: 14 }}
                        />
                        <span
                            style={{
                                fontSize: "0.85rem",
                                color: "#797979",
                            }}
                        >
                            {next} anime completed (in progress)
                        </span>
                    </div>
                )}
            </div>
        </>
    );
}
