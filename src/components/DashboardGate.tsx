"use client";

import React from "react";
import Link from "next/link";
import { CompassIcon, SproutIcon, ShieldCheckIcon, InfoIcon, LayersIcon } from "./icons";

interface DashboardGateProps {
  onEnableDemo: () => void;
  incompleteFields?: string[];
}

export function DashboardGate({ onEnableDemo, incompleteFields }: DashboardGateProps) {
  const isIncomplete = incompleteFields && incompleteFields.length > 0;

  return (
    <div className="min-h-screen bg-[#f8faf8] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="max-w-xl w-full bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-10 shadow-sm text-center space-y-6">
        {/* Brand Icon */}
        <div className="w-16 h-16 rounded-2xl bg-forest-900 text-white mx-auto flex items-center justify-center shadow-xs">
          <CompassIcon size={32} />
        </div>

        {/* Header & Subtitle */}
        <div className="space-y-2">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-forest-800 bg-forest-50 px-3 py-1 rounded-full border border-forest-200/60 inline-block">
            Rotation Compass • Sproutnik
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight font-heading">
            {isIncomplete ? "Complete Your Farm Setup" : "Welcome to Your Farm Advisory Portal"}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-md mx-auto">
            {isIncomplete
              ? `Your profile is missing required farm specifications (${incompleteFields.join(", ")}). Complete setup to view personalized recommendations.`
              : "To evaluate accurate crop rotation feasibility, water savings, and economic returns for your exact land, please set up your farm profile. It takes less than 2 minutes."}
          </p>
        </div>

        {/* Informative Explanation Box */}
        <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/70 text-left space-y-2 text-xs text-stone-600">
          <div className="font-bold text-stone-800 flex items-center gap-1.5">
            <ShieldCheckIcon size={16} className="text-forest-700" />
            <span>Why configure your farm?</span>
          </div>
          <p className="text-[11px] text-stone-500 leading-relaxed">
            Crop recommendations depend strictly on physical soil texture (percolation rates, iron deficiency risk) and irrigation capacity (canal vs. deep tubewell). We never show generic or fabricated advice.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/onboarding"
            className="w-full sm:w-auto px-6 py-3 bg-forest-800 hover:bg-forest-900 active:bg-forest-950 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <SproutIcon size={16} />
            <span>{isIncomplete ? "Complete Missing Details →" : "Start Farm Setup (2 Mins)"}</span>
          </Link>
          <button
            type="button"
            onClick={onEnableDemo}
            className="w-full sm:w-auto px-5 py-3 bg-white hover:bg-stone-100 active:bg-stone-200 text-stone-700 font-semibold text-xs sm:text-sm rounded-xl border border-stone-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Explore Demo Data</span>
            <span className="text-[10px] text-stone-400 font-normal">(Central Punjab)</span>
          </button>
        </div>

        {/* Local Storage Privacy Note */}
        <p className="text-[11px] text-stone-400 font-medium">
          🔒 Private &amp; Local: Stored safely in your web browser. No cloud account or tracking required.
        </p>
      </div>
    </div>
  );
}
