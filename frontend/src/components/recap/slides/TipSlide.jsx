import React from "react";

export default function TipSlide({ icon, title, subtitle }) {
    return (
        <>
            <div className="slide-icon">
                <i className={`fas ${icon}`} />
            </div>
            <h1>{title}</h1>
            <p className="subtitle">{subtitle}</p>
        </>
    );
}
