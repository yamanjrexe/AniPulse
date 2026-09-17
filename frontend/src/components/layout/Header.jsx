import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useRefresh } from "../../context/RefreshContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import SearchDropdown from "./SearchDropdown.jsx";
import NotificationsDropdown from "./NotificationsDropdown.jsx";
import ProfileDropdown from "./ProfileDropdown.jsx";
import PWAInstallButton from "../ui/PWAInstallButton.jsx";
import { toggleThemeWithAnimation } from "../../utils/themeTransition.js";

export default function Header({ onMenuClick }) {
    const { theme, toggleTheme } = useTheme();
    const { user } = useAuth();
    const { refreshUI } = useRefresh();
    const { showToast } = useToast();

    const [profileOpen, setProfileOpen] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const wrapRef = useRef(null);

    useEffect(() => {
        const onClick = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener("click", onClick);
        return () => document.removeEventListener("click", onClick);
    }, []);

    const handleRefresh = () => {
        if (refreshing) return;
        setRefreshing(true);

        refreshUI("header-button");
        showToast("UI refreshed", "success", 1500);

        setTimeout(() => setRefreshing(false), 700);
    };

    return (
        <header className="top-bar" role="banner">
            <div className="header-left">
                <button
                    className="hamburger-btn"
                    aria-label="Toggle menu"
                    onClick={onMenuClick}
                    style={{ display: "none" }}
                >
                    <i className="fas fa-bars" />
                </button>

                <Link to="/dashboard" aria-label="AniPulse Home">
                    <div className="app-logo">
                        <img src="/icon/Anipulse.png" alt="AniPulse Logo" />
                    </div>
                </Link>
            </div>

            <div className="user-actions">
                <SearchDropdown />

                {/* ⚡ Refresh button */}
                <button
                    className="theme-toggle"
                    onClick={handleRefresh}
                    aria-label="Refresh UI"
                    title="Refresh data"
                    disabled={refreshing}
                >
                    <i
                        className={`fas fa-sync-alt ${refreshing ? "fa-spin" : ""}`}
                        style={{
                            transition: refreshing
                                ? "none"
                                : "transform 0.3s ease",
                        }}
                    />
                </button>

                {/* Theme toggle */}
                <button
                    className="theme-toggle"
                    onClick={(e) => toggleThemeWithAnimation(toggleTheme, e)}
                    aria-label="Toggle theme"
                >
                    <i
                        className={`fas ${theme === "dark" ? "fa-sun" : "fa-moon"}`}
                    />
                </button>

                <PWAInstallButton />
                <NotificationsDropdown />

                {/* Profile dropdown trigger */}
                <div
                    ref={wrapRef}
                    className="user-profile"
                    role="button"
                    tabIndex={0}
                    aria-label="Profile menu"
                    onClick={() => setProfileOpen((v) => !v)}
                >
                    <img
                        src={
                            user?.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                user?.name || "User",
                            )}&background=6a5acd&color=fff`
                        }
                        alt={user?.name || "User"}
                        className="user-avatar"
                    />
                    {profileOpen && (
                        <ProfileDropdown
                            onClose={() => setProfileOpen(false)}
                        />
                    )}
                </div>
            </div>
        </header>
    );
}
