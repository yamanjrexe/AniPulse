import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useSync } from "../../../context/SyncContext.jsx";
import {
  readLocalStreak,
  writeLocalStreak,
  reconcileAndBump,
} from "../../../utils/streakUtils.js";

function greetingFor(hour) {
  if (hour < 12)
    return {
      text: "Good morning",
      icon: "fa-sun",
      sub: "Fresh episodes, fresh start",
    };
  if (hour < 17)
    return {
      text: "Good afternoon",
      icon: "fa-cloud-sun",
      sub: "Perfect time to make progress",
    };
  if (hour < 22)
    return {
      text: "Good evening",
      icon: "fa-moon",
      sub: "Relax and enjoy your favorites",
    };
  return {
    text: "Good night",
    icon: "fa-star",
    sub: "Late-night anime vibes",
  };
}

export default function GreetingBanner() {
  const { user } = useAuth();
  const { streakData, updateStreakData, hasLoadedFromServer } = useSync();

  const [now, setNow] = useState(new Date());
  const [streak, setStreak] = useState(0);

  const recompute = useCallback(() => {
    if (!hasLoadedFromServer) return;

    const local = readLocalStreak();
    const server = streakData
      ? {
          streak: streakData.streak || 0,
          lastActive: streakData.lastActive || null,
        }
      : null;

    const next = reconcileAndBump({ local, server });
    writeLocalStreak(next);

    if (next.changed) {
      updateStreakData({
        streak: next.streak,
        lastActive: next.lastActive,
      });
    }

    setStreak(next.streak);
  }, [hasLoadedFromServer, streakData, updateStreakData]);

  useEffect(() => {
    recompute();

    const t = setInterval(() => {
      setNow(new Date());
      recompute();
    }, 60000);

    const onFocus = () => {
      setNow(new Date());
      recompute();
    };

    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(t);
      window.removeEventListener("focus", onFocus);
    };
  }, [recompute]);

  const name = user?.name || "Otaku";
  const greeting = greetingFor(now.getHours());

  return (
    <section
      className="greeting-banner"
      id="greetingBanner"
      role="region"
      aria-label="Daily greeting"
    >
      <div className="banner-content">
        <div className="greeting-left">
          <div className="greeting-main">
            <h1 className="greeting-line">
              {greeting.text}, {name}
            </h1>
            <i
              className={`fas ${greeting.icon} greeting-emoji`}
              aria-hidden="true"
            />
          </div>

          <p className="greeting-subline">{greeting.sub}</p>

          <div className="banner-stats">
            <div className="stat-item">
              <i className="fas fa-clock" />
              <span>
                {now.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <div className="stat-item">
              <i className="fas fa-fire" />
              <span id="streakInfo">{streak}-day streak</span>
            </div>

            <div className="stat-item">
              <i className="fas fa-calendar-day" />
              <span>
                {now.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
