"use client";

import React from "react";
import Link from "next/link";
import { FarmerProfile, isKnownField } from "@/types";
import { getCropDisplayName } from "@/utils/cropCatalogAdapter";
import { getApprovedFarmingGoalsList, getLocalizedGoal } from "@/utils/farmingGoalsAdapter";
import {
  MapPinIcon,
  SproutIcon,
  ShieldCheckIcon,
  InfoIcon,
} from "./icons";

interface FarmerProfileBannerProps {
  profile: FarmerProfile | null;
  profileId?: string;
  onClearProfile?: () => void;
}

export function FarmerProfileBanner({
  profile,
  profileId,
}: FarmerProfileBannerProps) {
  if (!profile) {
    return (
      <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
              <InfoIcon size={20} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Demonstration Mode Active — Prototype Reference Dataset
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                  Unpersonalized
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                Currently displaying historical baseline data for Central Punjab (Ludhiana Rice–Wheat zone).
                Complete farmer onboarding to tailor crop rotation feasibility, water exposure, and agronomic tradeoffs to your farm.
              </p>
            </div>
          </div>

          <Link
            href="/onboarding"
            className="shrink-0 px-4 py-2 bg-forest-700 hover:bg-forest-800 active:bg-forest-900 text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <SproutIcon size={15} />
            Start Farmer Onboarding →
          </Link>
        </div>
      </div>
    );
  }

  // Extract farmer-confirmed or demo values
  const locationKnown = isKnownField(profile.location) ? profile.location.value : null;
  const isDemoLoc = locationKnown?.isDemonstration ?? false;
  const areaHa = isKnownField(profile.landAreaHectares) ? profile.landAreaHectares.value : null;
  const soil = isKnownField(profile.soilTexture) ? profile.soilTexture.value : null;
  const irrigation = isKnownField(profile.irrigationSource) ? profile.irrigationSource.value : null;
  const crops = isKnownField(profile.currentCrops) ? profile.currentCrops.value : [];
  const goals = isKnownField(profile.farmingGoals) ? profile.farmingGoals.value : [];

  const locationText = locationKnown
    ? `${locationKnown.district ? `${locationKnown.district}, ` : ""}${locationKnown.state || "Punjab"}`
    : "Ludhiana Demonstration Region";

  const coordsText =
    locationKnown?.latitude && locationKnown?.longitude
      ? `${locationKnown.latitude.toFixed(2)}° N, ${locationKnown.longitude.toFixed(2)}° E`
      : "30.90° N, 75.85° E";

  const provenanceBadge = isDemoLoc
    ? { label: "Demonstration Region (Ludhiana)", bg: "bg-amber-100 text-amber-800 border-amber-200" }
    : { label: "Farmer-Confirmed Location", bg: "bg-forest-100 text-forest-800 border-forest-200" };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Top row: Profile Title & Edit Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-forest-100 text-forest-800">
            <SproutIcon size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Personalized Farmer Profile
              </h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${provenanceBadge.bg}`}
              >
                {provenanceBadge.label}
              </span>
              {profileId && (
                <span className="font-mono text-[10px] text-slate-400">
                  ID: {profileId.slice(0, 8)}...
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Crop rotation feasibility and climate risks configured for this farm
            </p>
          </div>
        </div>

        <Link
          href="/onboarding"
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>Edit Farm Details →</span>
        </Link>
      </div>

      {/* Grid of Farmer Details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {/* Location */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
          <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
            Location
          </span>
          <div className="font-semibold text-slate-900 truncate">{locationText}</div>
          <div className="text-[11px] font-mono text-slate-500">{coordsText}</div>
        </div>

        {/* Land Holding */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
          <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
            Operational Area
          </span>
          <div className="font-semibold text-slate-900">
            {areaHa !== null ? `${areaHa} ha` : "Not specified"}
          </div>
          <div className="text-[11px] text-slate-500">
            {areaHa !== null ? `≈ ${(areaHa * 2.47105).toFixed(1)} acres` : "Regional avg applied"}
          </div>
        </div>

        {/* Soil Texture */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
          <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
            Soil Texture
          </span>
          <div className="font-semibold text-slate-900 capitalize">
            {soil ? soil.replace(/_/g, " ") : "Not specified"}
          </div>
          <div className="text-[11px] text-slate-500">
            {soil ? "Confirmed in profile" : "Regional default (Loam)"}
          </div>
        </div>

        {/* Irrigation Source */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
          <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
            Irrigation Water
          </span>
          <div className="font-semibold text-slate-900 capitalize">
            {irrigation ? irrigation.replace(/_/g, " ") : "Not specified"}
          </div>
          <div className="text-[11px] text-slate-500">
            {irrigation ? "Water source confirmed" : "Default (Deep Tubewell)"}
          </div>
        </div>
      </div>

      {/* Selected Crops & Goals Badges */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 text-xs">
        {/* Crops */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-medium text-slate-500 text-[11px]">Current Crops:</span>
          {crops.length > 0 ? (
            crops.map((c) => (
              <span
                key={c}
                className="px-2 py-0.5 bg-forest-50 text-forest-800 border border-forest-200 rounded-lg text-[11px] font-medium"
              >
                {getCropDisplayName(c, "en")}
              </span>
            ))
          ) : (
            <span className="text-slate-400 italic text-[11px]">None specified</span>
          )}
        </div>

        {/* Goals */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-medium text-slate-500 text-[11px]">Farming Goals:</span>
          {goals.length > 0 ? (
            goals.map((g) => {
              const meta = getLocalizedGoal(g, "en");
              return (
                <span
                  key={g}
                  className="px-2 py-0.5 bg-sky-50 text-sky-800 border border-sky-200 rounded-lg text-[11px] font-medium flex items-center gap-1"
                >
                  <span>{meta.icon}</span>
                  <span>{meta.title}</span>
                </span>
              );
            })
          ) : (
            <span className="text-slate-400 italic text-[11px]">None specified</span>
          )}
        </div>
      </div>

      {/* Persistence Architecture Disclaimer (Section 9 Conformance) */}
      <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100 flex items-center gap-1.5">
        <ShieldCheckIcon size={12} className="text-slate-400 shrink-0" />
        <span>
          <strong>Architecture Note:</strong> Profile data is securely cached in local device storage and synchronized with in-memory server state. Full backend process restart clears remote server cache.
        </span>
      </div>
    </div>
  );
}
