import React, { useEffect, useState, useRef } from "react";

export default function DayPromptModal() {
    const [open, setOpen] = useState(false);
    const [day, setDay] = useState("1");
    const resolverRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            resolverRef.current = e.detail.resolve;
            setDay("1");
            setOpen(true);
            setTimeout(() => inputRef.current?.focus(), 50);
        };
        window.addEventListener("openDayPrompt", handler);
        return () => window.removeEventListener("openDayPrompt", handler);
    }, []);

    const close = (value) => {
        setOpen(false);
        if (resolverRef.current) {
            resolverRef.current(value);
            resolverRef.current = null;
        }
    };

    const confirm = () => {
        const n = parseInt(day, 10);
        if (isNaN(n) || n < 1 || n > 31) {
            alert("Enter a number between 1 and 31.");
            return;
        }
        close(n);
    };

    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === "Enter") confirm();
            if (e.key === "Escape") close(null);
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
        // eslint-disable-next-line
    }, [open, day]);

    if (!open) return null;

    return (
        <div
            className="modal show active"
            style={{
                display: "flex",
                position: "fixed",
                inset: 0,
                zIndex: 100001,
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0, 0, 0, 0.65)",
                padding: 20,
            }}
        >
            <div
                className="modal-content"
                style={{
                    maxWidth: 400,
                    width: "100%",
                    padding: 24,
                    background: "#111111",
                    border: "1px solid #292929",
                    borderRadius: 16,
                    boxShadow: "0 16px 40px rgba(0, 0, 0, 0.40)",
                    color: "#FBFBFB",
                    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
                }}
            >
                <h3
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 12,
                        fontSize: "1rem",
                        fontWeight: 600,
                    }}
                >
                    <i
                        className="fas fa-calendar-day"
                        style={{ color: "#FCE706" }}
                    />
                    Select completion day
                </h3>
                <p
                    style={{
                        marginBottom: 16,
                        color: "#797979",
                        fontSize: "0.875rem",
                        lineHeight: 1.5,
                    }}
                >
                    Enter the day (1-31) for the completion date:
                </p>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginBottom: 20,
                    }}
                >
                    <label
                        style={{
                            fontWeight: 500,
                            fontSize: "0.875rem",
                            color: "#C2C4C7",
                        }}
                    >
                        Day:
                    </label>
                    <input
                        ref={inputRef}
                        type="number"
                        min="1"
                        max="31"
                        value={day}
                        onChange={(e) => setDay(e.target.value)}
                        style={{
                            flex: 1,
                            padding: "8px 12px",
                            background: "#111111",
                            border: "1px solid #292929",
                            borderRadius: 8,
                            color: "#FBFBFB",
                            fontSize: "0.95rem",
                            fontFamily: "inherit",
                            outline: "none",
                        }}
                    />
                </div>
                <div
                    style={{
                        display: "flex",
                        gap: 10,
                        justifyContent: "flex-end",
                    }}
                >
                    <button
                        className="btn btn-secondary"
                        onClick={() => close(null)}
                    >
                        Cancel
                    </button>
                    <button className="btn btn-primary" onClick={confirm}>
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}

export function openDayPrompt() {
    return new Promise((resolve) => {
        window.dispatchEvent(
            new CustomEvent("openDayPrompt", { detail: { resolve } }),
        );
    });
}
