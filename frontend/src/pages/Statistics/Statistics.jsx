import React, { useState } from "react";
import StatsHero from "./components/StatsHero.jsx";
import OverviewMetrics from "./components/OverviewMetrics.jsx";
import PeriodStats from "./components/PeriodStats.jsx";
import LibraryAnalytics from "./components/LibraryAnalytics.jsx";
import RatingAnalytics from "./components/RatingAnalytics.jsx";
import CompletionJourney from "./components/CompletionJourney.jsx";

export default function Statistics() {
    return (
        <div className="dashboard-section">
            <StatsHero />
            <OverviewMetrics />
            <PeriodStats />
            <LibraryAnalytics />
            <RatingAnalytics />
            <CompletionJourney />
        </div>
    );
}
