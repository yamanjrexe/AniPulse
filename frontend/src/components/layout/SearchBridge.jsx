import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function SearchBridge() {
    const navigate = useNavigate();
    useEffect(() => {
        window.AniPulseSearch = {
            get query() {
                return localStorage.getItem("anipulse_search_query") || "";
            },
            search(query) {
                localStorage.setItem("anipulse_search_query", query || "");
                if (window.location.pathname !== "/anime-list")
                    navigate("/anime-list");
                setTimeout(() => {
                    window.dispatchEvent(
                        new CustomEvent("globalSearchChange", {
                            detail: { query },
                        }),
                    );
                }, 100);
            },
            clear() {
                localStorage.removeItem("anipulse_search_query");
                window.dispatchEvent(
                    new CustomEvent("globalSearchChange", {
                        detail: { query: "" },
                    }),
                );
            },
            refresh() {
                window.dispatchEvent(
                    new CustomEvent("globalSearchChange", {
                        detail: {
                            query:
                                localStorage.getItem("anipulse_search_query") ||
                                "",
                        },
                    }),
                );
            },
        };
        return () => {
            delete window.AniPulseSearch;
        };
    }, [navigate]);
    return null;
}
