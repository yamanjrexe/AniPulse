import React, { useEffect, useState, useCallback } from "react";
import RecapSlide from "./RecapSlide.jsx";
import {
    buildRecapSlides,
    getMonthlyRecap,
    getYearlyRecap,
    getPreviousMonthForRecap,
    getPreviousYearForRecap,
    isRecapWindowOpen,
} from "../../services/recapService.js";
import { useAnime } from "../../context/AnimeContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";

export default function RecapModal() {
    const { animeData } = useAnime();
    const { showToast } = useToast();

    const [open, setOpen] = useState(false);
    const [slides, setSlides] = useState([]);
    const [current, setCurrent] = useState(0);
    const [title, setTitle] = useState("Recap");

    const openRecap = useCallback((type, data, periodInfo) => {
        const built = buildRecapSlides(data, type, periodInfo);
        const periodText =
            periodInfo.month != null
                ? `${data.monthName} ${data.year}`
                : `${data.year}`;
        setTitle(`${type} Recap — ${periodText}`);
        setSlides(built);
        setCurrent(0);
        setOpen(true);
        document.body.classList.add("modal-open");
        document.body.style.overflow = "hidden";
    }, []);

    const openManually = useCallback(() => {
        if (!isRecapWindowOpen()) {
            showToast(
                "Recaps are available on the 1st–7th of each month",
                "info",
            );
            return;
        }

        const { month, year } = getPreviousMonthForRecap();
        const monthly = getMonthlyRecap(animeData, year, month);
        if (monthly.totalAnime > 0) {
            openRecap("Monthly", monthly, { month, year });
            return;
        }

        const prevYear = getPreviousYearForRecap();
        const yearly = getYearlyRecap(animeData, prevYear);
        if (yearly.totalAnime > 0) {
            openRecap("Yearly", yearly, { year: prevYear });
            return;
        }

        showToast("No completed anime found for recap periods", "info");
    }, [animeData, openRecap, showToast]);

    // Global events (Settings button, etc.)
    useEffect(() => {
        const onOpen = () => openManually();
        const onOpenData = (e) => {
            const { type, data, periodInfo } = e.detail || {};
            if (type && data) openRecap(type, data, periodInfo || {});
        };
        window.addEventListener("openRecap", onOpen);
        window.addEventListener("openRecapData", onOpenData);
        return () => {
            window.removeEventListener("openRecap", onOpen);
            window.removeEventListener("openRecapData", onOpenData);
        };
    }, [openManually, openRecap]);

    // ─── Auto popup on 1st-7th of month (once per month) ────
    useEffect(() => {
        if (window.__recapAutoFired) return;
        window.__recapAutoFired = true;

        if (!animeData.length) return;

        const today = new Date().getDate();
        if (today > 7) return;

        const { month, year } = getPreviousMonthForRecap();
        const key = `recap-monthly-auto-${year}-${month}`;
        if (localStorage.getItem(key)) return;

        const data = getMonthlyRecap(animeData, year, month);
        if (data.totalAnime === 0) return;

        const timer = setTimeout(() => {
            showToast(`Your ${data.monthName} recap is ready!`, "info");
            localStorage.setItem(key, "true");
        }, 2500);

        return () => clearTimeout(timer);
    }, [animeData, showToast]);

    const close = useCallback(() => {
        setOpen(false);
        document.body.classList.remove("modal-open");
        document.body.style.overflow = "";
    }, []);

    const next = useCallback(() => {
        setCurrent((c) => Math.min(c + 1, slides.length - 1));
    }, [slides.length]);

    const prev = useCallback(() => {
        setCurrent((c) => Math.max(c - 1, 0));
    }, []);

    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === "ArrowRight" || e.key === " ") {
                e.preventDefault();
                next();
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                prev();
            } else if (e.key === "Escape") {
                e.preventDefault();
                close();
            }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, next, prev, close]);

    if (!open || slides.length === 0) return null;

    const slide = slides[current];
    const progress = ((current + 1) / slides.length) * 100;

    return (
        <div
            id="recap-modal"
            className="recap-modal"
            role="dialog"
            aria-modal="true"
            aria-label={title}
        >
            <div className="recap-container">
                <button
                    className="recap-close"
                    aria-label="Close recap"
                    onClick={close}
                >
                    &times;
                </button>

                <div className="recap-progress-bar" aria-hidden="true">
                    <div
                        className="recap-progress"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="recap-slide-area">
                    <RecapSlide
                        type={slide.type}
                        data={slide.data}
                        index={current}
                        total={slides.length}
                    />
                </div>

                <div className="recap-controls">
                    <button
                        id="prev-slide"
                        aria-label="Previous slide"
                        onClick={prev}
                        disabled={current === 0}
                    >
                        ←
                    </button>
                    <span className="slide-counter-global">
                        {current + 1}/{slides.length}
                    </span>
                    <button
                        id="next-slide"
                        aria-label="Next slide"
                        onClick={next}
                        disabled={current === slides.length - 1}
                    >
                        →
                    </button>
                </div>
            </div>
        </div>
    );
}
