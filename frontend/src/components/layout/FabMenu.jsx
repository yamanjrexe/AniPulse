import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function FabMenu() {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, []);

    const handleAction = (action) => {
        setOpen(false);
        if (action === "add-anime") {
            window.dispatchEvent(new CustomEvent("openAddAnimeModal"));
        } else if (action === "chat-bot") {
            window.dispatchEvent(new CustomEvent("toggleChatBot"));
        }
    };

    return (
        <>
            <div
                className={`fab-backdrop ${open ? "active" : ""}`}
                onClick={() => setOpen(false)}
            />
            <div id="fab-container">
                <div className={`fab-menu ${open ? "open" : "hidden"}`}>
                    <button
                        className="fab-item"
                        onClick={() => handleAction("add-anime")}
                    >
                        <i className="fas fa-plus-circle" />
                        <span>Add Anime</span>
                    </button>
                    <button
                        className="fab-item"
                        onClick={() => handleAction("chat-bot")}
                    >
                        <i className="fas fa-robot" />
                        <span>Chat Bot</span>
                    </button>
                </div>
                <button
                    className={`fab-main ${open ? "open" : ""}`}
                    aria-label="Open actions"
                    onClick={() => setOpen((v) => !v)}
                >
                    <i className={`fas ${open ? "fa-times" : "fa-bars"}`} />
                </button>
            </div>
        </>
    );
}
