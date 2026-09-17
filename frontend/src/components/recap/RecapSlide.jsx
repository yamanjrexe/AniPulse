import React from "react";
import WelcomeSlide from "./slides/WelcomeSlide.jsx";
import CompletedSlide from "./slides/CompletedSlide.jsx";
import HoursSlide from "./slides/HoursSlide.jsx";
import AvgScoreSlide from "./slides/AvgScoreSlide.jsx";
import TopGenreSlide from "./slides/TopGenreSlide.jsx";
import TopAnimeSlide from "./slides/TopAnimeSlide.jsx";
import ActiveDaysSlide from "./slides/ActiveDaysSlide.jsx";
import AvgDurationSlide from "./slides/AvgDurationSlide.jsx";
import SecondAnimeSlide from "./slides/SecondAnimeSlide.jsx";
import ConsistencySlide from "./slides/ConsistencySlide.jsx";
import ThirdAnimeSlide from "./slides/ThirdAnimeSlide.jsx";
import ClosingSlide from "./slides/ClosingSlide.jsx";
import EmptySlide from "./slides/EmptySlide.jsx";
import TipSlide from "./slides/TipSlide.jsx";
import MilestonesSlide from "./slides/MilestonesSlide.jsx";

const MAP = {
    welcome: WelcomeSlide,
    completed: CompletedSlide,
    hours: HoursSlide,
    avgscore: AvgScoreSlide,
    topgenre: TopGenreSlide,
    topanime: TopAnimeSlide,
    activedays: ActiveDaysSlide,
    avgduration: AvgDurationSlide,
    secondanime: SecondAnimeSlide,
    consistency: ConsistencySlide,
    thirdanime: ThirdAnimeSlide,
    closing: ClosingSlide,
    empty: EmptySlide,
    tip: TipSlide,
    milestones: MilestonesSlide,
    "closing-empty": ClosingSlide,
};

export default function RecapSlide({ type, data, index, total }) {
    const Component = MAP[type];
    if (!Component) return null;
    return (
        <div className="recap-slide active" key={index}>
            <Component {...data} />
            <div className="slide-counter">
                {index + 1}/{total}
            </div>
        </div>
    );
}
