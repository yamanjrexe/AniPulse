import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);
const SUPPORTED_THEMES = ["dark"];
const DEFAULT_THEME = "dark";

function normalizeTheme(value) {
  return SUPPORTED_THEMES.includes(value) ? value : DEFAULT_THEME;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() =>
    normalizeTheme(localStorage.getItem("theme")),
  );

  useEffect(() => {
    localStorage.removeItem("themePreference");
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const setThemePreference = (pref) => {
    setTheme(normalizeTheme(pref));
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark: true, setThemePreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
