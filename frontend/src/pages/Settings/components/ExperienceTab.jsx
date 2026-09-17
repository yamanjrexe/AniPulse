import React, { useEffect } from "react";
import { useLevel } from "../../../context/LevelContext.jsx";
import LevelCard from "../../../components/level/LevelCard.jsx";
import XpQueueCard from "../../../components/level/XpQueueCard.jsx";

export default function ExperienceTab() {
    const { refreshAll } = useLevel();

    useEffect(() => {
        refreshAll();

        const id = setInterval(() => {
            if (!document.hidden) refreshAll();
        }, 30000);

        return () => clearInterval(id);
    }, [refreshAll]);

    return (
        <div className="settings-tab-content active" id="tab-experience">
            <LevelCard />
            <XpQueueCard />
        </div>
    );
}
