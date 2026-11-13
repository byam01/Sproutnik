"use client";

import React, { useState } from "react";
import { CloudRainIcon, InfoIcon } from "./icons";

interface RainfallChartProps {
  annualRainfallByYear: Record<number, number>;
  monthlyMeanPrecipitationMm: Record<number, number>;
  meanAnnualRainfallMm: number;
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

const SEASON_MAP: Record<number, { name: string; color: string }> = {
  1: { name: "Winter", color: "#38bdf8" }, // Jan
  2: { name: "Winter", color: "#38bdf8" }, // Feb
  3: { name: "Summer", color: "#fbbf24" }, // Mar
  4: { name: "Summer", color: "#fbbf24" }, // Apr
  5: { name: "Summer", color: "#fbbf24" }, // May
  6: { name: "Monsoon", color: "#2d6f4d" }, // Jun
  7: { name: "Monsoon", color: "#2d6f4d" }, // Jul
  8: { name: "Monsoon", color: "#2d6f4d" }, // Aug
  9: { name: "Monsoon", color: "#2d6f4d" }, // Sep
  10: { name: "Post-Monsoon", color: "#a3e635" }, // Oct
  11: { name: "Winter", color: "#38bdf8" }, // Nov
  12: { name: "Winter", color: "#38bdf8" }, // Dec
};

export function RainfallChart({
  annualRainfallByYear,
  monthlyMeanPrecipitationMm,
  meanAnnualRainfallMm,
}: RainfallChartProps) {
  const [viewMode, setViewMode] = useState<"annual" | "monthly">("annual");
  const [hoveredItem, setHoveredItem] = useState<{
    label: string;
    value: number;
    sublabel?: string;
    x: number;
    y: number;
  } | null>(null);

  const years = Object.keys(annualRainfallByYear)
    .map(Number)
    .sort((a, b) => a - b);
  const annualValues = years.map((y) => annualRainfallByYear[y]);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const monthlyValues = months.map((m) => monthlyMeanPrecipitationMm[m] ?? 0);

  // SVG dimensions
  const svgWidth = 640;
  const svgHeight = 280;
  const padding = { top: 30, right: 24, bottom: 44, left: 52 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  // Max scale calculation
  const maxAnnual = Math.max(...annualValues, meanAnnualRainfallMm, 850);
  const maxMonthly = Math.max(...monthlyValues, 220);

  const currentMax = viewMode === "annual" ? Math.ceil(maxAnnual / 100) * 100 : Math.ceil(maxMonthly / 50) * 50;

  // Y-axis grid ticks (4 ticks)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => Math.round(pct * currentMax));

  const getY = (val: number) => {
    return padding.top + chartHeight - (val / currentMax) * chartHeight;
  };

  const meanY = getY(meanAnnualRainfallMm);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-forest-50 text-forest-700 border border-forest-100">
                <CloudRainIcon size={18} />
              </div>
              <h3 className="font-semibold text-slate-900 text-base">
                Historical Precipitation
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              {viewMode === "annual"
                ? `Annual totals & 10-year mean benchmark (${meanAnnualRainfallMm.toFixed(1)} mm/yr)`
                : "Mean monthly rainfall profile showing extreme monsoon concentration"}
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-medium self-start sm:self-auto border border-slate-200/70">
            <button
              type="button"
              onClick={() => {
                setViewMode("annual");
                setHoveredItem(null);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === "annual"
                  ? "bg-white text-forest-800 shadow-sm font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Annual Totals
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("monthly");
                setHoveredItem(null);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === "monthly"
                  ? "bg-white text-forest-800 shadow-sm font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Monthly Profile
            </button>
          </div>
        </div>

        {/* Chart Container */}
        <div className="relative w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto max-h-[300px] select-none"
            role="img"
            aria-label={`Precipitation chart showing ${viewMode} rainfall for Ludhiana`}
          >
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
                    strokeDasharray={tick === 0 ? "none" : "3,3"}
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="text-[11px] fill-slate-400 font-mono"
                  >
                    {tick}
                  </text>
                </g>
              );
            })}

            {/* Mean Annual Reference Line (only in annual mode) */}
            {viewMode === "annual" && (
              <g>
                <line
                  x1={padding.left}
                  y1={meanY}
                  x2={svgWidth - padding.right}
                  y2={meanY}
                  stroke="#2d6f4d"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                />
                <text
                  x={svgWidth - padding.right}
                  y={meanY - 6}
                  textAnchor="end"
                  className="text-[10px] fill-forest-700 font-medium"
                >
                  10-Yr Mean: {meanAnnualRainfallMm.toFixed(1)} mm
                </text>
              </g>
            )}

            {/* Bars: Annual Mode */}
            {viewMode === "annual" &&
              years.map((year, i) => {
                const val = annualRainfallByYear[year];
                const barWidth = Math.min(36, chartWidth / years.length - 12);
                const barSpacing = chartWidth / years.length;
                const x = padding.left + i * barSpacing + (barSpacing - barWidth) / 2;
                const y = getY(val);
                const height = padding.top + chartHeight - y;
                const isHovered = hoveredItem?.label === String(year);
                const isAboveMean = val >= meanAnnualRainfallMm;

                return (
                  <g
                    key={year}
                    tabIndex={0}
                    role="button"
                    aria-label={`Year ${year}: ${val.toFixed(1)} mm`}
                    onMouseEnter={() =>
                      setHoveredItem({
                        label: String(year),
                        value: val,
                        sublabel: `${isAboveMean ? "+" : ""}${(
                          val - meanAnnualRainfallMm
                        ).toFixed(1)} mm vs 10-yr mean`,
                        x: x + barWidth / 2,
                        y,
                      })
                    }
                    onMouseLeave={() => setHoveredItem(null)}
                    onFocus={() =>
                      setHoveredItem({
                        label: String(year),
                        value: val,
                        sublabel: `${isAboveMean ? "+" : ""}${(
                          val - meanAnnualRainfallMm
                        ).toFixed(1)} mm vs 10-yr mean`,
                        x: x + barWidth / 2,
                        y,
                      })
                    }
                    onBlur={() => setHoveredItem(null)}
                    className="cursor-pointer focus:outline-none"
                  >
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={Math.max(2, height)}
                      rx={4}
                      fill={
                        isHovered
                          ? "#1b4332"
                          : isAboveMean
                          ? "#3d8b63"
                          : "#8cc6a4"
                      }
                      className="transition-colors duration-150"
                    />
                    <text
                      x={x + barWidth / 2}
                      y={svgHeight - padding.bottom + 18}
                      textAnchor="middle"
                      className={`text-[11px] font-mono ${
                        isHovered ? "fill-forest-900 font-bold" : "fill-slate-500"
                      }`}
                    >
                      {year}
                    </text>
                  </g>
                );
              })}

            {/* Bars: Monthly Mode */}
            {viewMode === "monthly" &&
              months.map((month, i) => {
                const val = monthlyMeanPrecipitationMm[month] ?? 0;
                const barWidth = Math.min(32, chartWidth / 12 - 8);
                const barSpacing = chartWidth / 12;
                const x = padding.left + i * barSpacing + (barSpacing - barWidth) / 2;
                const y = getY(val);
                const height = padding.top + chartHeight - y;
                const monthName = MONTH_NAMES[month - 1];
                const seasonInfo = SEASON_MAP[month];
                const isHovered = hoveredItem?.label === monthName;
                const isMonsoon = month >= 6 && month <= 9;

                return (
                  <g
                    key={month}
                    tabIndex={0}
                    role="button"
                    aria-label={`${monthName}: ${val.toFixed(1)} mm (${seasonInfo.name})`}
                    onMouseEnter={() =>
                      setHoveredItem({
                        label: monthName,
                        value: val,
                        sublabel: `${seasonInfo.name} Season (${(
                          (val / meanAnnualRainfallMm) *
                          100
                        ).toFixed(1)}% of annual)`,
                        x: x + barWidth / 2,
                        y,
                      })
                    }
                    onMouseLeave={() => setHoveredItem(null)}
                    onFocus={() =>
                      setHoveredItem({
                        label: monthName,
                        value: val,
                        sublabel: `${seasonInfo.name} Season`,
                        x: x + barWidth / 2,
                        y,
                      })
                    }
                    onBlur={() => setHoveredItem(null)}
                    className="cursor-pointer focus:outline-none"
                  >
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={Math.max(2, height)}
                      rx={4}
                      fill={
                        isHovered
                          ? "#1b4332"
                          : isMonsoon
                          ? "#2d6f4d"
                          : "#8cc6a4"
                      }
                      className="transition-colors duration-150"
                    />
                    <text
                      x={x + barWidth / 2}
                      y={svgHeight - padding.bottom + 18}
                      textAnchor="middle"
                      className={`text-[11px] font-mono ${
                        isHovered ? "fill-forest-900 font-bold" : "fill-slate-500"
                      }`}
                    >
                      {monthName}
                    </text>
                  </g>
                );
              })}

            {/* Hover Tooltip rendered in SVG */}
            {hoveredItem && (
              <g
                transform={`translate(${Math.max(
                  70,
                  Math.min(svgWidth - 90, hoveredItem.x)
                )}, ${Math.max(35, hoveredItem.y - 12)})`}
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
                  {hoveredItem.label}: {hoveredItem.value.toFixed(1)} mm
                </text>
                {hoveredItem.sublabel && (
                  <text
                    x="0"
                    y="-11"
                    textAnchor="middle"
                    fill="#94a3b8"
                    className="text-[10px]"
                  >
                    {hoveredItem.sublabel}
                  </text>
                )}
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Chart Footer / Agronomic takeaway */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <InfoIcon size={14} className="text-forest-600 shrink-0" />
          <span>
            {viewMode === "annual"
              ? "Annual rainfall ranges from 589 mm (2016) to 812 mm (2023 wet monsoon events)."
              : "77.8% of rainfall occurs in June–September, necessitating irrigation for dry-season crops."}
          </span>
        </div>
        <span className="font-mono text-slate-400 hidden sm:inline">
          Unit: mm
        </span>
      </div>
    </div>
  );
}

