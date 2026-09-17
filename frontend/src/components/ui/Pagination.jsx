import React from "react";

export default function Pagination({ totalPages, activePage, onChange }) {
    if (!totalPages || totalPages <= 1) return null;

    const buttons = [];

    // Prev arrow
    if (activePage > 1) {
        buttons.push(
            <button
                key="prev"
                className="page-btn arrow-btn"
                onClick={() => onChange(activePage - 1)}
                aria-label="Previous page"
            >
                <i className="fas fa-chevron-left" />
            </button>,
        );
    }

    const maxVisible = 3;
    const start = Math.max(1, activePage - maxVisible);
    const end = Math.min(totalPages, activePage + maxVisible);

    // Leading ellipsis + first page
    if (start > 1) {
        buttons.push(
            <button
                key="first"
                className="page-btn"
                onClick={() => onChange(1)}
            >
                1
            </button>,
        );
        if (start > 2) {
            buttons.push(
                <span key="dots-left" className="page-dots">
                    <i className="fas fa-ellipsis-h" />
                </span>,
            );
        }
    }

    // Numbered pages
    for (let i = start; i <= end; i++) {
        buttons.push(
            <button
                key={i}
                className={`page-btn ${i === activePage ? "active" : ""}`}
                onClick={() => onChange(i)}
            >
                {i}
            </button>,
        );
    }

    // Trailing ellipsis + last page
    if (end < totalPages) {
        if (end < totalPages - 1) {
            buttons.push(
                <span key="dots-right" className="page-dots">
                    <i className="fas fa-ellipsis-h" />
                </span>,
            );
        }
        buttons.push(
            <button
                key="last"
                className="page-btn"
                onClick={() => onChange(totalPages)}
            >
                {totalPages}
            </button>,
        );
    }

    // Next arrow
    if (activePage < totalPages) {
        buttons.push(
            <button
                key="next"
                className="page-btn arrow-btn"
                onClick={() => onChange(activePage + 1)}
                aria-label="Next page"
            >
                <i className="fas fa-chevron-right" />
            </button>,
        );
    }

    return <div id="pagination">{buttons}</div>;
}
