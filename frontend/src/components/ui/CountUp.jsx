import React, { useEffect, useRef, useState } from "react";

const DEFAULT_DURATION = 1200;
const DEFAULT_THRESHOLD = 0.3;

function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

export default function CountUp({
    end = 0,
    start = 0,
    duration = DEFAULT_DURATION,
    delay = 0,
    decimals = 0,
    prefix = "",
    suffix = "",
    separator = ",",
    className = "",
    style,
    inView = false,
    threshold = DEFAULT_THRESHOLD,
    once = true,
    onComplete,
}) {
    const [display, setDisplay] = useState(start);
    const [shouldAnimate, setShouldAnimate] = useState(!inView);

    const fromRef = useRef(start);
    const rafRef = useRef(null);
    const timeoutRef = useRef(null);
    const startTimeRef = useRef(null);
    const completedRef = useRef(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        if (!inView) {
            setShouldAnimate(true);
            return;
        }
        if (once && shouldAnimate) return;

        const el = wrapperRef.current;
        if (!el || typeof IntersectionObserver === "undefined") {
            setShouldAnimate(true);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setShouldAnimate(true);
                        if (once) observer.disconnect();
                    } else if (!once) {
                        setShouldAnimate(false);
                        fromRef.current = start;
                        setDisplay(start);
                    }
                });
            },
            { threshold },
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [inView, threshold, once]);

    useEffect(() => {
        if (!shouldAnimate) return;

        const from = fromRef.current;
        const to = end;

        if (from === to) {
            setDisplay(to);
            return;
        }

        completedRef.current = false;
        startTimeRef.current = null;

        const tick = (now) => {
            if (startTimeRef.current === null) startTimeRef.current = now;
            const elapsed = now - startTimeRef.current;
            const t = Math.min(elapsed / duration, 1);
            const eased = easeOutCubic(t);
            setDisplay(from + (to - from) * eased);

            if (t < 1) {
                rafRef.current = requestAnimationFrame(tick);
            } else {
                fromRef.current = to;
                if (!completedRef.current) {
                    completedRef.current = true;
                    onComplete?.();
                }
            }
        };

        timeoutRef.current = setTimeout(() => {
            rafRef.current = requestAnimationFrame(tick);
        }, delay);

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [end, duration, delay, shouldAnimate, onComplete]);

    const formatted = (() => {
        const rounded =
            decimals > 0
                ? display.toFixed(decimals)
                : Math.round(display).toString();
        if (!separator) return rounded;
        const [intPart, decPart] = rounded.split(".");
        const withSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
        return decPart ? `${withSep}.${decPart}` : withSep;
    })();

    return (
        <span
            ref={wrapperRef}
            className={className}
            style={{
                fontVariantNumeric: "tabular-nums",
                ...style,
            }}
        >
            {prefix}
            {formatted}
            {suffix}
        </span>
    );
}
