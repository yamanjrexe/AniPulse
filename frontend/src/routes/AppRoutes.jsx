import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute.jsx";
import AppLayout from "../layouts/AppLayout.jsx";
import AuthLayout from "../layouts/AuthLayout.jsx";
import { navigationItems } from "./routeConfig.jsx";

const Landing = lazy(() => import("../pages/Landing.jsx"));
const Login = lazy(() => import("../pages/Auth/Login.jsx"));
const Offline = lazy(() => import("../pages/Offline.jsx"));
const NotFound = lazy(() => import("../pages/NotFound.jsx"));

function SuspenseFallback() {
    return (
        <div id="app-loader" role="status" aria-label="Loading page">
            <div className="loader-container">
                <div className="loader-logo">
                    <img src="/icon/Anipulse.png" alt="AniPulse" />
                </div>
                <div className="progress-wrapper">
                    <div className="progress-bar" role="progressbar">
                        <span id="loader-progress" style={{ width: "50%" }} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AppRoutes() {
    return (
        <Suspense fallback={<SuspenseFallback />}>
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route
                    path="/login"
                    element={
                        <AuthLayout>
                            <Login />
                        </AuthLayout>
                    }
                />
                <Route path="/offline" element={<Offline />} />

                <Route element={<ProtectedRoute />}>
                    <Route element={<AppLayout />}>
                        <Route
                            path="/app"
                            element={<Navigate to="/dashboard" replace />}
                        />
                        {navigationItems.map((item) => {
                            const C = item.component;
                            return (
                                <Route
                                    key={item.id}
                                    path={item.path}
                                    element={<C />}
                                />
                            );
                        })}
                    </Route>
                </Route>

                <Route path="*" element={<NotFound />} />
            </Routes>
        </Suspense>
    );
}
