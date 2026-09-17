import React, { createContext, useContext, useCallback, useState } from "react";

const RefreshContext = createContext(null);

export const REFRESH_EVENT = "uiRefresh";

export function RefreshProvider({ children }) {
    const [lastRefresh, setLastRefresh] = useState(Date.now());

    /**
     * Refresh the entire UI without a page reload.
     *
     * @param {string} source - identifier for debugging (e.g. 'header', 'post-sync')
     */
    const refreshUI = useCallback((source = "manual") => {
        console.log(
            `🔄 [RefreshContext] UI refresh triggered (source: ${source})`,
        );

        // 1. Notify every listener (contexts, pages, custom components)
        window.dispatchEvent(
            new CustomEvent(REFRESH_EVENT, { detail: { source } }),
        );

        // 2. Bump timestamp → any component using `useRefresh()` re-renders
        setLastRefresh(Date.now());
    }, []);

    /**
     * Refresh UI + push pending changes to cloud.
     */
    const refreshAll = useCallback(
        async (source = "manual") => {
            console.log(`🔄 [RefreshContext] Full refresh (source: ${source})`);

            // Push any pending local changes first
            try {
                if (
                    window.dualStorage &&
                    typeof window.dualStorage.syncToCloud === "function"
                ) {
                    // Fire and forget — refresh happens regardless
                    window.dualStorage.syncToCloud().catch(() => {});
                }
            } catch (_) {
                // ignore
            }

            // Then refresh UI
            refreshUI(source);
        },
        [refreshUI],
    );

    const value = { refreshUI, refreshAll, lastRefresh };

    return (
        <RefreshContext.Provider value={value}>
            {children}
        </RefreshContext.Provider>
    );
}

export function useRefresh() {
    const ctx = useContext(RefreshContext);
    if (!ctx) throw new Error("useRefresh must be used within RefreshProvider");
    return ctx;
}
