import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

const ICONS = {
    success: "fa-check-circle",
    error: "fa-exclamation-circle",
    warning: "fa-exclamation-triangle",
    info: "fa-info-circle",
};

// AniPulse brand-aligned type colors
const COLORS = {
    success: "#22C55E",
    error: "#F90415",
    warning: "#FCE706", 
    info: "#C2C4C7", 
};

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = "info", duration = 3000) => {
        const id = Date.now() + Math.random();
        setToasts((t) => [...t, { id, message, type }]);
        setTimeout(() => {
            setToasts((t) => t.filter((x) => x.id !== id));
        }, duration);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((t) => t.filter((x) => x.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            <div
                id="toastContainer"
                role="status"
                aria-live="polite"
                style={{
                    position: "fixed",
                    top: 84,
                    right: 20,
                    zIndex: 99998,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    pointerEvents: "none",
                    maxWidth: "min(380px, 92vw)",
                }}
            >
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        style={{
                            pointerEvents: "auto",
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "12px 16px",
                            borderRadius: 8,
                            background: "#111111",
                            border: "1px solid #292929",
                            borderLeft: `3px solid ${COLORS[t.type]}`,
                            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.30)",
                            color: "#FBFBFB",
                            fontFamily:
                                "'Inter', system-ui, -apple-system, sans-serif",
                            fontSize: "0.875rem",
                            fontWeight: 500,
                            animation:
                                "toastSlideIn 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
                            transformOrigin: "right center",
                        }}
                    >
                        <div
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "#171717",
                                color: COLORS[t.type],
                                flexShrink: 0,
                                fontSize: "0.875rem",
                            }}
                        >
                            <i
                                className={`fas ${ICONS[t.type] || ICONS.info}`}
                            />
                        </div>

                        <div style={{ flex: 1, minWidth: 0, lineHeight: 1.4 }}>
                            {t.message}
                        </div>

                        <button
                            onClick={() => removeToast(t.id)}
                            aria-label="Close"
                            style={{
                                background: "transparent",
                                border: "none",
                                color: "#797979",
                                cursor: "pointer",
                                fontSize: "0.875rem",
                                padding: 4,
                                lineHeight: 1,
                                flexShrink: 0,
                                borderRadius: 4,
                            }}
                        >
                            <i className="fas fa-times" />
                        </button>
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes toastSlideIn {
                    from { opacity: 0; transform: translateX(16px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within ToastProvider");
    return ctx;
}
