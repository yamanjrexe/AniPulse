import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute() {
    const { user, initialized } = useAuth();
    const location = useLocation();

    if (!initialized) {
        return (
            <div
                id="app-loader"
                role="status"
                aria-label="Checking authentication"
            >
                <div className="loader-container">
                    <div className="loader-logo">
                        <img src="/icon/Anipulse.png" alt="AniPulse" />
                    </div>
                    <div className="progress-wrapper">
                        <div className="progress-bar" role="progressbar">
                            <span
                                id="loader-progress"
                                style={{
                                    width: "60%",
                                    transition: "width 0.3s ease",
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return <Outlet />;
}
