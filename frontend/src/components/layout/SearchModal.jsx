import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function SearchBridge() {
    const navigate = useNavigate();
    useEffect(() => {
        window.AniPulseSearch = {
            search(query) {
                localStorage.setItem("anipulse_search_query", query);
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
        };
        return () => {
            delete window.AniPulseSearch;
        };
    }, [navigate]);
    return null;
}
