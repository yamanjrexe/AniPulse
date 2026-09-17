import React, { useEffect, useRef } from "react";

export default function Modal({
    open,
    onClose,
    title,
    children,
    large = false,
}) {
    const closeRef = useRef(onClose);
    useEffect(() => {
        closeRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (!open) return;

        const onKey = (e) => {
            if (e.key === "Escape") closeRef.current?.();
        };

        document.addEventListener("keydown", onKey);
        document.body.classList.add("modal-open");

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.classList.remove("modal-open");
            document.body.style.overflow = prevOverflow || "";
        };
    }, [open]);

    if (!open) return null;

    return (
        <div
            className="modal show"
            // Stop the click/mousedown from bubbling back up the React tree
            // to whatever card/list item dispatched the open event.
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={{
                display: "flex",
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <div
                className="modal-backdrop"
                onMouseDown={() => closeRef.current?.()}
                style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,0,0.6)",
                }}
            />
            <div
                className={`modal-content ${large ? "large-modal" : ""}`}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                style={{
                    position: "relative",
                    zIndex: 1,
                    maxHeight: "90vh",
                    overflowY: "auto",
                }}
            >
                {title && (
                    <div className="modal-header">
                        <h2 className="modal-title">{title}</h2>
                        <button
                            type="button"
                            className="close-modal"
                            aria-label="Close"
                            onClick={() => closeRef.current?.()}
                        >
                            &times;
                        </button>
                    </div>
                )}
                {children}
            </div>
        </div>
    );
}
