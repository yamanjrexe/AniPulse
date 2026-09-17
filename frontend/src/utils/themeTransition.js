import { flushSync } from "react-dom";

const STYLE_ID = "anipulse-theme-transition-style";

function injectStyles(css) {
    let el = document.getElementById(STYLE_ID);
    if (!el) {
        el = document.createElement("style");
        el.id = STYLE_ID;
        document.head.appendChild(el);
    }
    el.textContent = css;
}

function buildCSS() {
    const x = window.innerWidth / 2;
    const y = window.innerHeight / 2;
    const radius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
    );

    return `
        ::view-transition-old(root) {
            animation: none;
            z-index: 1;
        }
        ::view-transition-new(root) {
            z-index: 2;
            animation: anipulse-reveal-circle 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes anipulse-reveal-circle {
            from { clip-path: circle(0px at ${x}px ${y}px); }
            to   { clip-path: circle(${radius}px at ${x}px ${y}px); }
        }
    `;
}

export function toggleThemeWithAnimation(switchTheme) {
    // Fallback for browsers without View Transition API
    if (typeof document.startViewTransition !== "function") {
        switchTheme();
        return;
    }

    injectStyles(buildCSS());

    const current =
        document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";

    document.startViewTransition(() => {
        flushSync(() => {
            document.documentElement.setAttribute("data-theme", next);
            document.body.setAttribute("data-theme", next);
            switchTheme();
        });
    });
}