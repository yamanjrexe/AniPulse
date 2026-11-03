import React, { useEffect, useState, useCallback, useRef } from "react";
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
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";

export default function RecapModal() {
  const { animeData } = useAnime();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [open, setOpen] = useState(false);
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);
  const [title, setTitle] = useState("Recap");

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

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
    if (!user) return;
    if (!isRecapWindowOpen()) {
      showToast("Recaps are available on the 1st–7th of each month", "info");
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
  }, [animeData, openRecap, showToast, user]);

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

  useEffect(() => {
    if (!user) return;
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
  }, [animeData, showToast, user]);

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

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };
  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;
    if (distance > minSwipeDistance) next();
    if (distance < -minSwipeDistance) prev();
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  if (!user) return null;
  if (!open || slides.length === 0) return null;

  const slide = slides[current];
  const progress = ((current + 1) / slides.length) * 100;

  return (
    <div
      id="recap-modal"
      className="recap-modal"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="recap-container"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="recap-header">
          <div className="recap-progress-bar" aria-hidden="true">
            <div className="recap-progress" style={{ width: `${progress}%` }} />
          </div>
          <button
            className="recap-close"
            aria-label="Close recap"
            onClick={close}
          >
            &times;
          </button>
        </div>

        <div className="recap-slide-area">
          <RecapSlide
            key={current}
            type={slide.type}
            data={slide.data}
            index={current}
            total={slides.length}
          />
        </div>

        <div className="recap-controls">
          <button
            aria-label="Previous slide"
            onClick={prev}
            disabled={current === 0}
          >
            ←
          </button>
          <span className="slide-counter-global">
            {current + 1} / {slides.length}
          </span>
          <button
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
