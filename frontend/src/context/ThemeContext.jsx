import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);
const getSystem = () =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        const stored = localStorage.getItem("theme");
        const pref = localStorage.getItem("themePreference");
        if (stored) return stored;
        if (!pref || pref === "system") return getSystem();
        return pref;
    });

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        document.body.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    useEffect(() => {
        const media = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = (e) => {
            const pref = localStorage.getItem("themePreference");
            if (!pref || pref === "system")
                setTheme(e.matches ? "dark" : "light");
        };
        media.addEventListener?.("change", handler);
        return () => media.removeEventListener?.("change", handler);
    }, []);

    const toggleTheme = () =>
        setTheme((t) => (t === "dark" ? "light" : "dark"));
    const setThemePreference = (pref) => {
        localStorage.setItem("themePreference", pref);
        setTheme(pref === "system" ? getSystem() : pref);
    };

    return (
        <ThemeContext.Provider
            value={{ theme, toggleTheme, setThemePreference }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
    return ctx;
}
