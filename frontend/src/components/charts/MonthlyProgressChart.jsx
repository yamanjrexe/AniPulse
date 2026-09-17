import React, { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import "./ChartSetup.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";

const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
];

const COLOR_UP = "#22C55E";
const COLOR_DOWN = "#EF4444";
const COLOR_FLAT = "#9CA3AF";

export default function MonthlyProgressChart({ animeData }) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const text = isDark ? "#fff" : "#64748b";
    const grid = isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0";

    // Monthly completion counts for the current year
    const monthlyData = useMemo(() => {
        const arr = Array(12).fill(0);
        const y = new Date().getFullYear();
        (animeData || []).forEach((a) => {
            if (a.userStatus !== "Completed") return;
            const d = a.actualFinishDate || a.finishDate;
            if (!d) return;
            const [yy, mm] = d.split("-").map(Number);
            if (yy === y && mm >= 1 && mm <= 12) arr[mm - 1]++;
        });
        return arr;
    }, [animeData]);

    const currentMonth = new Date().getMonth();

    const trendData = monthlyData.map((v, i) => (i <= currentMonth ? v : null));

    const colorAt = (index) => {
        if (index <= 0) return COLOR_FLAT;
        if (index > currentMonth) return "transparent";
        const curr = monthlyData[index];
        const prev = monthlyData[index - 1];
        if (curr > prev) return COLOR_UP;
        if (curr < prev) return COLOR_DOWN;
        return COLOR_FLAT;
    };

    const chartData = {
        labels: MONTHS,
        datasets: [
            {
                type: "line",
                label: "Trend",
                data: trendData,
                borderColor: COLOR_FLAT, 
                backgroundColor: "transparent",
                tension: 0.45,
                borderWidth: 4,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBorderWidth: 2,
                pointBorderColor: "#ffffff",
                spanGaps: false,
                order: 1,
                // per-point colour
                pointBackgroundColor: (ctx) => colorAt(ctx.dataIndex),
                // per-segment colour
                segment: {
                    borderColor: (ctx) => {
                        const end = ctx.p1DataIndex;
                        if (end > currentMonth) return "transparent";
                        return colorAt(end);
                    },
                },
            },
            {
                type: "bar",
                label: "Anime Completed",
                data: monthlyData,
                backgroundColor: "rgba(99,102,241,0.75)",
                borderColor: "rgba(99,102,241,1)",
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
                order: 2,
                barPercentage: 0.65,
                categoryPercentage: 0.8,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
            legend: { display: false },
            tooltip: {
                mode: "index",
                intersect: false,
                callbacks: {
                    label: (ctx) => {
                        // Bar dataset
                        if (ctx.datasetIndex === 1) {
                            return `Completed: ${ctx.raw}`;
                        }
                        // Trend line — only meaningful from Feb onward
                        const i = ctx.dataIndex;
                        if (i <= 0 || i > currentMonth || ctx.raw == null)
                            return null;

                        const curr = monthlyData[i];
                        const prev = monthlyData[i - 1];
                        if (prev === 0 && curr === 0)
                            return "No change (0 vs 0)";
                        if (prev === 0 && curr > 0)
                            return ` Started with ${curr} anime`;
                        const change = ((curr - prev) / prev) * 100;
                        const abs = Math.abs(change);
                        if (abs < 0.5) return `No change (${curr} anime)`;
                        return change > 0
                            ? `Increased by ${abs.toFixed(1)}%`
                            : `Decreased by ${abs.toFixed(1)}%`;
                    },
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: grid },
                ticks: { color: text, stepSize: 1 },
            },
            x: { grid: { display: false }, ticks: { color: text } },
        },
    };

    return <Bar data={chartData} options={options} />;
}
