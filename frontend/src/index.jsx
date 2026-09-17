import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// Global CSS
import "./styles/variables.css";
import "./styles/reset.css";
import "./styles/typography.css";
import "./styles/utilities.css";
import "./styles/layout/layout.css";
import "./styles/components/header.css";
import "./styles/components/sidebar.css";
import "./styles/components/cards.css";
import "./styles/components/buttons.css";
import "./styles/components/forms.css";
import "./styles/components/notifications.css";
import "./styles/components/modals.css";
import "./styles/components/chatbot.css";
import "./styles/components/charts.css";
import "./styles/components/badges.css";
import "./styles/components/progress.css";
import "./styles/components/animations.css";
import "./styles/components/level-system.css";
import "./styles/components/toast.css";
import "./styles/components/loading.css";
import "./styles/pages/dashboard.css";
import "./styles/pages/statistics.css";
import "./styles/pages/watchlist.css";
import "./styles/pages/anime-list.css";
import "./styles/pages/achievements.css";
import "./styles/pages/community.css";
import "./styles/pages/settings.css";
import "./styles/pages/recap.css";
import "./styles/pages/auth.css";
import "./styles/pages/index.css";
import "./styles/responsive.css"

import { installFetchInterceptors } from "./utils/rateLimiter.js";
import { registerServiceWorker } from "./services/pwaService.js";

installFetchInterceptors();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);

registerServiceWorker();
