import React from "react";
import { DataQuality, Location, ClimatePeriod } from "@/types";
import { DatabaseIcon, ShieldCheckIcon, AlertTriangleIcon, InfoIcon, MapPinIcon, CalendarIcon } from "./icons";

interface DataSourceInfoProps {
  location: Location;
  period: ClimatePeriod;
  quality: DataQuality;
  meta: {
    dataSource: string;
    processingTimestamp: string;
    version: string;
  } | null;
  isMock: boolean;
}

export function DataSourceInfo({
  location,
  period,
  quality,
  meta,
  isMock,
}: DataSourceInfoProps) {
  const isComplete =
    quality.precipitationCompletenessPercent >= 90 &&
    quality.temperatureCompletenessPercent >= 90;

  return (
    <div id="data-sources" className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-forest-50 text-forest-700 border border-forest-100">
              <DatabaseIcon size={18} />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">
              Data Transparency & Quality Disclosure
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Open-science verification for NASA Space Apps Challenge 2026
          </p>
        </div>

        {/* Live vs Mock Badge */}
        <div className="flex items-center gap-2">
          {isMock ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Demo Mode: Calibrated Punjab Baseline (Mock)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-forest-50 text-forest-700 border border-forest-200">
              <span className="w-2 h-2 rounded-full bg-forest-600" />
              Live NASA POWER Daily Data
            </span>
          )}
        </div>
      </div>

      {/* Grid of Key Attribution & Audit metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Source */}
        <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Data Source
          </span>
          <div className="font-medium text-slate-900 text-xs">
            {meta?.dataSource || "NASA POWER Daily API"}
          </div>
          <p className="text-[10px] text-slate-500">
            PRECTOTCORR, T2M, T2M_MAX
          </p>
        </div>

        {/* Location Coordinates */}
        <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <MapPinIcon size={12} className="text-forest-600" />
            Grid Coordinates
          </span>
          <div className="font-mono text-xs font-semibold text-slate-900">
            {location.latitude.toFixed(2)}° N, {location.longitude.toFixed(2)}° E
          </div>
          <p className="text-[10px] text-slate-500 truncate">
            {location.name || "Ludhiana Demonstration Region"}
          </p>
        </div>

        {/* Time Period */}
        <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <CalendarIcon size={12} className="text-forest-600" />
            Temporal Scope
          </span>
          <div className="font-mono text-xs font-semibold text-slate-900">
            {period.startYear} – {period.endYear} (10 Years)
          </div>
          <p className="text-[10px] text-slate-500">
            {quality.totalReceivedDays} of {quality.totalExpectedDays} days received
          </p>
        </div>

        {/* Validation Status */}
        <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <ShieldCheckIcon size={12} className="text-forest-600" />
            Completeness Score
          </span>
          <div className="font-mono text-xs font-bold text-forest-700">
            Rainfall {quality.precipitationCompletenessPercent.toFixed(1)}% | Temp {quality.temperatureCompletenessPercent.toFixed(1)}%
          </div>
          <p className="text-[10px] text-slate-500">
            {quality.excludedYears.length === 0
              ? "0 Incomplete Years Excluded"
              : `Excluded Years: ${quality.excludedYears.join(", ")}`}
          </p>
        </div>
      </div>

      {/* Backend Quality Audit Notes */}
      {quality.notes && quality.notes.length > 0 && (
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/70 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
            <InfoIcon size={14} className="text-slate-500" />
            System Quality Notes &amp; Scientific Caveats
          </div>
          <ul className="space-y-1.5 text-xs text-slate-600 list-disc list-inside">
            {quality.notes.map((note, idx) => (
              <li key={idx} className="leading-relaxed">
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Timestamp and version footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400 border-t border-slate-100 pt-3">
        <div>
          Processing Version: <span className="font-mono text-slate-600">{meta?.version || "1.0.0"}</span>
        </div>
        <div>
          {meta?.processingTimestamp && (
            <span>
              Calculated at:{" "}
              <span className="font-mono text-slate-600">
                {new Date(meta.processingTimestamp).toLocaleString()}
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

