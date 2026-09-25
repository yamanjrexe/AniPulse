import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute.jsx";
import AppLayout from "../layouts/AppLayout.jsx";
import AuthLayout from "../layouts/AuthLayout.jsx";
import PublicLayout from "../layouts/PublicLayout.jsx";
import { navigationItems } from "./routeConfig.jsx";

const Landing = lazy(() => import("../pages/Landing.jsx"));
const Login = lazy(() => import("../pages/Auth/Login.jsx"));
const Offline = lazy(() => import("../pages/Offline.jsx"));
const NotFound = lazy(() => import("../pages/NotFound.jsx"));

const Docs = lazy(() => import("../pages/Resources/Docs.jsx"));
const Help = lazy(() => import("../pages/Resources/Help.jsx"));
const Changelog = lazy(() => import("../pages/Resources/Changelog.jsx"));
const About = lazy(() => import("../pages/Resources/About.jsx"));

const Leaderboard = lazy(() => import("../pages/Leaderboard/Leaderboard.jsx"));

function SuspenseFallback() {
  return <div />;
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

        <Route path="/resources" element={<PublicLayout />}>
          <Route index element={<Navigate to="/resources/docs" replace />} />
          <Route path="docs" element={<Docs />} />
          <Route path="help" element={<Help />} />
          <Route path="changelog" element={<Changelog />} />
          <Route path="about" element={<About />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/app" element={<Navigate to="/dashboard" replace />} />
            {navigationItems.map((item) => {
              const C = item.component;
              return <Route key={item.id} path={item.path} element={<C />} />;
            })}
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
