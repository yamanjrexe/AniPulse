import React from "react";
import { useLevel } from "../../context/LevelContext.jsx";

export default function LevelBadge() {
    const { level, title } = useLevel();
    return (
        <div className="sidebar-level">
            <span className="level-badge">Lv.{level}</span>
            <span className="level-title">{title}</span>
        </div>
    );
}
