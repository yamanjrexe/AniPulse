import React, { useState, useEffect } from "react";
import Modal from "../ui/Modal.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";

export default function NameEntryModal() {
    const { setUser } = useAuth();
    const { showToast } = useToast();
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");

    useEffect(() => {
        const onOpen = () => {
            const profile = JSON.parse(
                localStorage.getItem("userProfile") || "{}",
            );
            setName(profile.name || "");
            setOpen(true);
        };
        window.addEventListener("openNameEntry", onOpen);
        return () => window.removeEventListener("openNameEntry", onOpen);
    }, []);

    const save = (value) => {
        const clean = (value || "").trim() || "Otaku";
        localStorage.setItem("userName", clean);
        const profile = JSON.parse(localStorage.getItem("userProfile") || "{}");
        profile.name = clean;
        profile.username = clean;
        if (!profile.avatar) {
            profile.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(clean)}&background=6a5acd&color=fff`;
        }
        localStorage.setItem("userProfile", JSON.stringify(profile));
        setUser?.({ name: clean, username: clean });
        const u = JSON.parse(localStorage.getItem("user") || "{}");
        u.name = clean;
        u.username = clean;
        localStorage.setItem("user", JSON.stringify(u));
        showToast(`Welcome, ${clean}! 🎉`, "success");
        setOpen(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        save(name);
    };

    return (
        <Modal
            open={open}
            onClose={() => save(name)}
            title="Welcome to AniPulse!"
        >
            <p
                style={{
                    marginBottom: 20,
                    color: "var(--text-secondary, #94A3B8)",
                }}
            >
                Let's personalize your experience. What should we call you?
            </p>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="userNameInput">Your Name</label>
                    <input
                        id="userNameInput"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name..."
                        autoComplete="off"
                        maxLength={30}
                        autoFocus
                    />
                </div>
                <div className="form-actions">
                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: "100%" }}
                    >
                        <i className="fas fa-check" /> Save &amp; Continue
                    </button>
                </div>
            </form>
        </Modal>
    );
}
