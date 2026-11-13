"use client";

import React, { useState } from "react";
import { ThermometerIcon, SunIcon, InfoIcon } from "./icons";

interface TemperatureChartProps {
  monthlyMeanMaxTempC: Record<number, number>;
  meanTemperatureC: number;
  meanMaxTemperatureC: number;
}

const MONTH_NAMES = [
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

export function TemperatureChart({
  monthlyMeanMaxTempC,
  meanTemperatureC,
  meanMaxTemperatureC,
}: TemperatureChartProps) {
  const [hoveredMonth, setHoveredMonth] = useState<{
    month: number;
    name: string;
    temp: number;
    x: number;
    y: number;
  } | null>(null);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const temps = months.map((m) => monthlyMeanMaxTempC[m] ?? 0);

  // SVG dimensions
  const svgWidth = 640;
  const svgHeight = 280;
  const padding = { top: 30, right: 24, bottom: 44, left: 48 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  const minTemp = 10;
  const maxTemp = 45;

  const getY = (t: number) => {
    return (
      padding.top +
      chartHeight -
      ((t - minTemp) / (maxTemp - minTemp)) * chartHeight
    );
  };

  const getX = (index: number) => {
    return padding.left + (index / (months.length - 1)) * chartWidth;
  };

  // Y-axis ticks: 15, 25, 35, 45
  const yTicks = [15, 25, 35, 45];

  // Construct SVG path for area & smooth curve
  const points = months.map((m, i) => {
    const t = monthlyMeanMaxTempC[m] ?? 0;
    return { x: getX(i), y: getY(t), temp: t, month: m };
  });

  // Simple smooth path generation using cubic beziers
  const pathD = points.reduce((acc, p, i, arr) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = arr[i - 1];
    const cpX1 = prev.x + (p.x - prev.x) / 2;
    const cpY1 = prev.y;
    const cpX2 = prev.x + (p.x - prev.x) / 2;
    const cpY2 = p.y;
    return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p.x} ${p.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${
    padding.top + chartHeight
  } L ${points[0].x} ${padding.top + chartHeight} Z`;

  // Terminal heat stress line for wheat grain fill (~32°C)
  const heatStressY = getY(32);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
                <ThermometerIcon size={18} />
              </div>
              <h3 className="font-semibold text-slate-900 text-base">
                Thermal Profile & Heat Stress Windows
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Monthly mean maximum daily temperatures (°C) from NASA POWER T2M_MAX
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono bg-slate-50 border border-slate-200/70 rounded-xl px-3 py-1.5 self-start sm:self-auto">
            <span className="text-slate-500">Mean:</span>
            <span className="font-semibold text-slate-800">{meanTemperatureC.toFixed(1)}°C</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">Max Avg:</span>
            <span className="font-semibold text-amber-700">{meanMaxTemperatureC.toFixed(1)}°C</span>
          </div>
        </div>

        {/* Chart Container */}
        <div className="relative w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto max-h-[300px] select-none"
            role="img"
            aria-label="Temperature chart showing monthly maximum temperatures for Ludhiana"
          >
            <defs>
              <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines and Y-axis labels */}
            {yTicks.map((tick) => {
              const y = getY(tick);
              return (
                <g key={tick}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={svgWidth - padding.right}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeDasharray="3,3"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="text-[11px] fill-slate-400 font-mono"
                  >
                    {tick}°C
                  </text>
                </g>
              );
            })}

            {/* Wheat terminal heat threshold line (32°C) */}
            <g>
              <line
                x1={padding.left}
                y1={heatStressY}
                x2={svgWidth - padding.right}
                y2={heatStressY}
                stroke="#ef4444"
                strokeWidth="1.2"
                strokeDasharray="4,4"
              />
              <text
                x={svgWidth - padding.right}
                y={heatStressY - 6}
                textAnchor="end"
                className="text-[10px] fill-rose-600 font-medium"
              >
                Wheat Heat Threshold: 32°C
              </text>
            </g>

            {/* Area fill */}
            <path d={areaD} fill="url(#tempGradient)" />

            {/* Curve stroke */}
            <path
              d={pathD}
              fill="none"
              stroke="#d97706"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Points & month labels */}
            {points.map((p, i) => {
              const monthName = MONTH_NAMES[p.month - 1];
              const isHovered = hoveredMonth?.month === p.month;
              const isExtreme = p.temp >= 38;

              return (
                <g
                  key={p.month}
                  tabIndex={0}
                  role="button"
                  aria-label={`${monthName}: ${p.temp.toFixed(1)}°C`}
                  onMouseEnter={() =>
                    setHoveredMonth({
                      month: p.month,
                      name: monthName,
                      temp: p.temp,
                      x: p.x,
                      y: p.y,
                    })
                  }
                  onMouseLeave={() => setHoveredMonth(null)}
                  onFocus={() =>
                    setHoveredMonth({
                      month: p.month,
                      name: monthName,
                      temp: p.temp,
                      x: p.x,
                      y: p.y,
                    })
                  }
                  onBlur={() => setHoveredMonth(null)}
                  className="cursor-pointer focus:outline-none"
                >
                  {/* Invisible larger hover hit area */}
                  <circle cx={p.x} cy={p.y} r={14} fill="transparent" />

                  {/* Visible point */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? 6 : isExtreme ? 4.5 : 3.5}
                    fill={isHovered ? "#b45309" : isExtreme ? "#ea580c" : "#d97706"}
                    stroke="#ffffff"
                    strokeWidth={2}
                    className="transition-all duration-150"
                  />

                  {/* X Axis label */}
                  <text
                    x={p.x}
                    y={svgHeight - padding.bottom + 18}
                    textAnchor="middle"
                    className={`text-[11px] font-mono ${
                      isHovered ? "fill-amber-900 font-bold" : "fill-slate-500"
                    }`}
                  >
                    {monthName}
                  </text>
                </g>
              );
            })}

            {/* Hover Tooltip */}
            {hoveredMonth && (
              <g
                transform={`translate(${Math.max(
                  70,
                  Math.min(svgWidth - 90, hoveredMonth.x)
                )}, ${Math.max(35, hoveredMonth.y - 12)})`}
                pointerEvents="none"
              >
                <rect
                  x="-75"
                  y="-42"
                  width="150"
                  height="44"
                  rx="6"
                  fill="#0f172a"
                  className="shadow-md"
                />
                <polygon points="-6,2 6,2 0,7" fill="#0f172a" />
                <text
                  x="0"
                  y="-26"
                  textAnchor="middle"
                  fill="#f8fafc"
                  className="text-[12px] font-semibold"
                >
                  {hoveredMonth.name}: {hoveredMonth.temp.toFixed(1)}°C
                </text>
                <text
                  x="0"
                  y="-11"
                  textAnchor="middle"
                  fill="#94a3b8"
                  className="text-[10px]"
                >
                  {hoveredMonth.temp >= 38
                    ? "Extreme Summer Heat Peak"
                    : hoveredMonth.temp >= 32
                    ? "Terminal Heat Stress Zone"
                    : "Temperate Growing Window"}
                </text>
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Chart Footer / Agronomic takeaway */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <InfoIcon size={14} className="text-amber-600 shrink-0" />
          <span>
            May–June highs peak at 40.2°C; March temperatures (28.5°C) pose terminal heat risks during wheat grain development.
          </span>
        </div>
        <span className="font-mono text-slate-400 hidden sm:inline">
          Unit: °C
        </span>
      </div>
    </div>
  );
}

