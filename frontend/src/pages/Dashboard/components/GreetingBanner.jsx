import React, { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext.jsx";

function computeStreak() {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const lastActive = localStorage.getItem("lastActive");

    let streak = parseInt(localStorage.getItem("streak") || "0", 10);

    if (lastActive !== today) {
        streak = lastActive === yesterday ? streak + 1 : 1;
        localStorage.setItem("streak", String(streak));
        localStorage.setItem("lastActive", today);
    }
    return streak;
}

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
    const [now, setNow] = useState(new Date());
    const [streak, setStreak] = useState(() => computeStreak());

    useEffect(() => {
        const tick = () => {
            setNow(new Date());
            setStreak(computeStreak());
        };
        const t = setInterval(tick, 60000);
        window.addEventListener("focus", tick);
        return () => {
            clearInterval(t);
            window.removeEventListener("focus", tick);
        };
    }, []);

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
