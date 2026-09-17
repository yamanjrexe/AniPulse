import React, { useEffect } from "react";

export default function ConfirmDialog({
    open,
    message,
    onConfirm,
    onCancel,
    confirmLabel = "Delete",
}) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === "Escape") onCancel?.();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, onCancel]);

    if (!open) return null;

    return (
        <div
            className="modal show active"
            style={{
                display: "flex",
                position: "fixed",
                inset: 0,
                zIndex: 100000,
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
                        className="fas fa-exclamation-triangle"
                        style={{ color: "#F90415" }}
                    />
                    Confirm
                </h3>
                <p
                    style={{
                        marginBottom: 20,
                        color: "#C2C4C7",
                        fontSize: "0.875rem",
                        lineHeight: 1.5,
                    }}
                >
                    {message}
                </p>
                <div
                    style={{
                        display: "flex",
                        gap: 10,
                        justifyContent: "flex-end",
                    }}
                >
                    <button className="btn btn-secondary" onClick={onCancel}>
                        Cancel
                    </button>
                    <button className="btn btn-danger" onClick={onConfirm}>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
