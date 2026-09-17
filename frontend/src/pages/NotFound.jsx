import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function NotFound() {
    const navigate = useNavigate();

    useEffect(() => {
        const previous = document.title;
        document.title = "404 Not Found - AniPulse";
        return () => {
            document.title = previous;
        };
    }, []);

    return (
        <div
            className="container"
            style={{
                textAlign: "center",
                padding: "4rem 2rem",
                maxWidth: 600,
                margin: "0 auto",
            }}
        >
            <div
                style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "5rem",
                    fontWeight: 800,
                    color: "var(--brand-yellow)",
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                }}
            >
                404
            </div>
            <div
                style={{
                    fontSize: "3rem",
                    margin: "1.5rem 0",
                    color: "var(--text-muted)",
                }}
            >
                <i className="fas fa-compass" />
            </div>
            <h1
                style={{
                    fontSize: "var(--fs-24)",
                    marginBottom: "var(--sp-3)",
                    color: "var(--text-primary)",
                }}
            >
                Page not found
            </h1>
            <p
                style={{
                    color: "var(--text-muted)",
                    marginBottom: "var(--sp-6)",
                    fontSize: "var(--fs-14)",
                }}
            >
                The page you're looking for doesn't exist or has been moved.
            </p>
            <div
                style={{
                    display: "flex",
                    gap: "var(--sp-3)",
                    justifyContent: "center",
                    flexWrap: "wrap",
                }}
            >
                <Link to="/" className="btn btn-primary">
                    <i className="fas fa-home" /> Home
                </Link>
                <button
                    className="btn btn-secondary"
                    onClick={() => navigate(-1)}
                >
                    <i className="fas fa-arrow-left" /> Go back
                </button>
            </div>
        </div>
    );
}
