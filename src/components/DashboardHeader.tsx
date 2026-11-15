import React from "react";
import {
  CompassIcon,
  RefreshCwIcon,
  MapPinIcon,
  CalendarIcon,
  DatabaseIcon,
} from "./icons";

interface DashboardHeaderProps {
  isMock: boolean;
  onToggleMock: () => void;
  onRefresh: () => void;
  loading: boolean;
  periodText?: string;
  locationName?: string;
  coordsText?: string;
}

export function DashboardHeader({
  isMock,
  onToggleMock,
  onRefresh,
  loading,
  periodText = "2015 – 2024",
  locationName = "Ludhiana District, Punjab, India",
  coordsText = "30.90° N, 75.85° E",
}: DashboardHeaderProps) {
  return (
    <header className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Brand and titles */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-forest-600 text-white shadow-sm">
              <CompassIcon size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  Rotation Compass
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-forest-100 text-forest-800 border border-forest-200">
                  NASA Space Apps Challenge 2026
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Climate-Aware Crop Rotation Planning &amp; Historical Agronomic Analytics
              </p>
            </div>
          </div>
        </div>

        {/* Controls: Mode Switch & Refresh & Onboarding */}
        <div className="flex items-center gap-2.5 self-start lg:self-auto flex-wrap">
          <a
            href="/onboarding"
            className="px-3 py-1.5 bg-forest-50 hover:bg-forest-100 active:bg-forest-200 text-forest-800 border border-forest-200 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <span className="w-2 h-2 rounded-full bg-forest-600" />
            Farm Setup &amp; Constraints →
          </a>

          {/* Mock / Live Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                if (isMock) onToggleMock();
              }}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${!isMock
                  ? "bg-white text-forest-800 shadow-sm font-semibold"
                  : "text-slate-600 hover:text-slate-900"
                }`}
            >
              <span className={`w-2 h-2 rounded-full ${!isMock ? "bg-forest-600" : "bg-slate-400"}`} />
              Live NASA Data
            </button>
            <button
              type="button"
              onClick={() => {
                if (!isMock) onToggleMock();
              }}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${isMock
                  ? "bg-white text-forest-800 shadow-sm font-semibold"
                  : "text-slate-600 hover:text-slate-900"
                }`}
            >
              <span className={`w-2 h-2 rounded-full ${isMock ? "bg-amber-500" : "bg-slate-400"}`} />
              Calibrated Mock
            </button>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            aria-label="Refresh climate indicators"
            className="p-2 sm:px-3 sm:py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-medium rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCwIcon
              size={15}
              className={loading ? "animate-spin text-forest-600" : ""}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Region Metadata Bar */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <MapPinIcon size={14} className="text-forest-600 shrink-0" />
          <span className="font-medium text-slate-900">{locationName}</span>
          <span className="text-slate-400 font-mono">({coordsText})</span>
        </div>

        <div className="flex items-center gap-1.5">
          <CalendarIcon size={14} className="text-forest-600 shrink-0" />
          <span>Historical Period:</span>
          <span className="font-semibold text-slate-800">{periodText}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <DatabaseIcon size={14} className="text-forest-600 shrink-0" />
          <span>Data Source:</span>
          <span className="font-medium text-slate-800">
            {isMock ? "Calibrated Punjab Baseline Fixture" : "NASA POWER Daily API"}
          </span>
        </div>
      </div>
    </header>
  );
}

