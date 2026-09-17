import React, { useEffect, useRef } from "react";

export function useCountUp(target, duration = 2000) {
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const from = 0;
        const startTime = performance.now();
        let raf;
        const tick = (now) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(from + (target - from) * eased);
            if (progress < 1) raf = requestAnimationFrame(tick);
            else el.textContent = target;
        };
        el.textContent = 0;
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [target, duration]);
    return ref;
}

export default function Loader({ label = "Loading..." }) {
    return (
        <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin" /> {label}
        </div>
    );
}
