import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Header from "../components/layout/Header.jsx";
import FabMenu from "../components/layout/FabMenu.jsx";
import ChatBot from "../components/layout/ChatBot.jsx";
import NameEntryModal from "../components/layout/NameEntryModal.jsx";
import SearchBridge from "../components/layout/SearchBridge.jsx";

import AnimeModal from "../components/anime/AnimeModal.jsx";
import ImportModal from "../components/anime/ImportModal.jsx";
import RecapModal from "../components/recap/RecapModal.jsx";
import DayPromptModal from "../components/ui/DayPromptModal.jsx";
import XpPopupManager from "../components/level/XpPopupManager.jsx";

import useScrollRestoration from "../hooks/useScrollRestoration.js";
import { navigationItems } from "../routes/routeConfig.jsx";
import { autoBackupService } from "../services/autoBackupService.js";

export default function AppLayout() {
    const location = useLocation();
    const [drawer, setDrawer] = useState(false);

    useScrollRestoration();

    useEffect(() => {
        setDrawer(false);
    }, [location.pathname]);

    useEffect(() => {
        const match = navigationItems.find((i) => i.path === location.pathname);
        document.title = match?.title || "AniPulse";
    }, [location.pathname]);

    useEffect(() => {
        const profile = JSON.parse(localStorage.getItem("userProfile") || "{}");
        const shown = sessionStorage.getItem("nameModalShown");
        if (!profile.name && !shown) {
            sessionStorage.setItem("nameModalShown", "true");
            setTimeout(
                () => window.dispatchEvent(new CustomEvent("openNameEntry")),
                600,
            );
        }
    }, []);

    useEffect(() => {
        autoBackupService.init();
    }, []);

    return (
        <div className="main-content">
            <Header onMenuClick={() => setDrawer((v) => !v)} />

            <main className="page active">
                <Outlet />
            </main>

            <SearchBridge />
            <FabMenu />
            <ChatBot />
            <AnimeModal />
            <ImportModal />
            <RecapModal />
            <NameEntryModal />
            <DayPromptModal />
            <XpPopupManager />
        </div>
    );
}
