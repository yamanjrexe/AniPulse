import React from "react";

export default function EmptyState({
    icon = "fa-inbox",
    title,
    message,
    actionLabel,
    onAction,
}) {
    return (
        <div className="empty-state">
            <div className="empty-state-icon">
                <i className={`fas ${icon}`} />
            </div>
            {title && <h3 className="empty-state-title">{title}</h3>}
            {message && <p className="empty-state-message">{message}</p>}
            {actionLabel && (
                <button className="btn btn-primary" onClick={onAction}>
                    {actionLabel}
                </button>
            )}
        </div>
    );
}
