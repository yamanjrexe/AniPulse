import React, { useMemo } from "react";
import GreetingBanner from "./components/GreetingBanner.jsx";
import StatsOverview from "./components/StatsOverview.jsx";
import AnimeDNA from "./components/AnimeDNA.jsx";
import QuickActions from "./components/QuickActions.jsx";
import CurrentlyWatching from "./components/CurrentlyWatching.jsx";
import TopRated from "./components/TopRated.jsx";
import RecentActivity from "./components/RecentActivity.jsx";
import Heatmap from "../../components/charts/Heatmap.jsx";
import MonthlyProgressChart from "../../components/charts/MonthlyProgressChart.jsx";
import GenreDistributionChart from "../../components/charts/GenreDistributionChart.jsx";
import { useAnime } from "../../context/AnimeContext.jsx";

export default function Dashboard() {
    const { animeData } = useAnime();

    const currentYear = new Date().getFullYear();

    const yearlyCompletedCount = useMemo(() => {
        return animeData.filter((a) => {
            if (a.userStatus !== "Completed") return false;
            const d = a.actualFinishDate || a.finishDate;
            if (!d) return false;
            const y = parseInt(d.split("-")[0], 10);
            return y === currentYear;
        }).length;
    }, [animeData, currentYear]);

    return (
        <>
            <GreetingBanner />
            <StatsOverview />
            <AnimeDNA />

            <section className="dashboard-section">
                <h2 className="section-title">
                    <i className="fas fa-bolt" /> Quick Actions
                </h2>
                <QuickActions />
            </section>

            <section className="dashboard-grid">
                <div className="chart-card fade-in">
                    <div className="chart-header">
                        <div className="chart-title">Monthly Progress</div>
                        <div className="anime-counter">
                            <span>
                                Total Anime in {currentYear}:{" "}
                                {yearlyCompletedCount}
                            </span>
                        </div>
                    </div>
                    {/* Monthly Progress */}
                    <div className="chart-container">
                        <MonthlyProgressChart animeData={animeData} />
                    </div>
                </div>

                <div className="chart-card fade-in">
                    <div className="chart-header">
                        <div className="chart-title">Genre Distribution</div>
                    </div>
                    {/* Genre Distribution */}
                    <div className="chart-container">
                        <GenreDistributionChart animeData={animeData} />
                    </div>
                </div>
            </section>

            <Heatmap />
            <CurrentlyWatching />
            <TopRated />
            <RecentActivity />
        </>
    );
}
