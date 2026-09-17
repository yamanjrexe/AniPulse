import React, { useEffect } from "react";

export default function Offline() {
    useEffect(() => {
        const previous = document.title;
        document.title = "Offline - AniPulse";
        return () => {
            document.title = previous;
        };
    }, []);

    return (
        <div
            className="offline-container"
            style={{
                textAlign: "center",
                padding: "2rem",
                maxWidth: 480,
                margin: "4rem auto",
            }}
        >
            <div
                className="offline-icon"
                style={{
                    fontSize: "4rem",
                    color: "var(--text-muted)",
                    marginBottom: "1rem",
                }}
            >
                <i className="fas fa-wifi" />
            </div>
            <h1>You're offline</h1>
            <p
                style={{
                    color: "var(--text-muted)",
                    marginBottom: "2rem",
                    fontSize: "var(--fs-14)",
                }}
            >
                You can still access your saved data and previously loaded
                content.
            </p>
            <button
                className="btn btn-primary"
                onClick={() => window.location.reload()}
            >
                <i className="fas fa-sync-alt" /> Try again
            </button>
            <div
                style={{
                    marginTop: "2rem",
                    textAlign: "left",
                    padding: "var(--sp-4)",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "var(--r-md)",
                }}
            >
                <h3
                    style={{
                        fontSize: "var(--fs-13)",
                        color: "var(--text-secondary)",
                        marginBottom: "var(--sp-3)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        fontWeight: 600,
                    }}
                >
                    <i
                        className="fas fa-check-circle"
                        style={{
                            color: "var(--success)",
                            marginRight: 6,
                        }}
                    />{" "}
                    Available offline
                </h3>
                <ul
                    style={{
                        listStyle: "none",
                        padding: 0,
                        margin: 0,
                        color: "var(--text-muted)",
                        fontSize: "var(--fs-13)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                    }}
                >
                    <li>
                        <i
                            className="fas fa-circle"
                            style={{
                                fontSize: 4,
                                marginRight: 10,
                                verticalAlign: "middle",
                                color: "var(--brand-yellow)",
                            }}
                        />
                        View your saved anime list
                    </li>
                    <li>
                        <i
                            className="fas fa-circle"
                            style={{
                                fontSize: 4,
                                marginRight: 10,
                                verticalAlign: "middle",
                                color: "var(--brand-yellow)",
                            }}
                        />
                        Check your statistics
                    </li>
                    <li>
                        <i
                            className="fas fa-circle"
                            style={{
                                fontSize: 4,
                                marginRight: 10,
                                verticalAlign: "middle",
                                color: "var(--brand-yellow)",
                            }}
                        />
                        Access settings
                    </li>
                </ul>
            </div>
        </div>
    );
}
