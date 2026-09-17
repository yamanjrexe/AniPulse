import { lazy } from "react";

const Dashboard = lazy(() => import("../pages/Dashboard/Dashboard.jsx"));
const AnimeList = lazy(() => import("../pages/AnimeList.jsx"));
const Watchlist = lazy(() => import("../pages/Watchlist.jsx"));
const Statistics = lazy(() => import("../pages/Statistics/Statistics.jsx"));
const Achievements = lazy(() => import("../pages/Achievements.jsx"));
const Community = lazy(() => import("../pages/Community/Community.jsx"));
const Settings = lazy(() => import("../pages/Settings/Settings.jsx"));

export const navigationItems = [
    {
        id: "dashboard",
        label: "Dashboard",
        path: "/dashboard",
        icon: "fa-home",
        title: "Home - AniPulse",
        component: Dashboard,
        protected: true,
    },
    {
        id: "anime-list",
        label: "My Anime",
        path: "/anime-list",
        icon: "fa-film",
        title: "Anime List - AniPulse",
        component: AnimeList,
        protected: true,
    },
    {
        id: "watchlist",
        label: "Watch List",
        path: "/watchlist",
        icon: "fa-heart",
        title: "Watch List - AniPulse",
        component: Watchlist,
        protected: true,
    },
    {
        id: "statistics",
        label: "My Stats",
        path: "/statistics",
        icon: "fa-chart-line",
        title: "My Stats - AniPulse",
        component: Statistics,
        protected: true,
    },
    {
        id: "achievements",
        label: "Achievements",
        path: "/achievements",
        icon: "fa-trophy",
        title: "Achievements - AniPulse",
        component: Achievements,
        protected: true,
    },
    {
        id: "community",
        label: "Community",
        path: "/community",
        icon: "fa-users",
        title: "Community - AniPulse",
        component: Community,
        protected: true,
    },
    {
        id: "settings",
        label: "Profile",
        path: "/settings",
        icon: "fa-user",
        title: "Profile - AniPulse",
        component: Settings,
        protected: true,
    },
];
