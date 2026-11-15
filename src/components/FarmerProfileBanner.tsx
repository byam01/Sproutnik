"use client";

import React from "react";
import Link from "next/link";
import { FarmerProfile, isKnownField } from "@/types";
import { ProfileSyncStatus } from "@/services/profileLifecycle";
import { getCropDisplayName } from "@/utils/cropCatalogAdapter";
import { getLocalizedGoal } from "@/utils/farmingGoalsAdapter";
import {
  SproutIcon,
  ShieldCheckIcon,
  InfoIcon,
} from "./icons";

export interface FarmerProfileBannerProps {
  profile: FarmerProfile | null;
  profileId?: string;
  onClearProfile?: () => void;
  syncStatus?: ProfileSyncStatus;
  isSynchronized?: boolean;
  recoveryOccurred?: boolean;
  profileError?: { code: string; message: string } | null;
}

export function FarmerProfileBanner({
  profile,
  profileId,
  syncStatus,
  isSynchronized = true,
  recoveryOccurred = false,
  profileError,
  onClearProfile,
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
                  DEMONSTRATION DATA — Central Punjab (Ludhiana Rice–Wheat Zone)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                  Demo Mode
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                Currently displaying historical baseline data for Central Punjab (Ludhiana Rice–Wheat zone).
                Configure your own farm profile to tailor crop rotation feasibility, water exposure, and agronomic tradeoffs to your farm.
              </p>
            </div>
          </div>

          <Link
            href="/onboarding"
            className="shrink-0 px-4 py-2 bg-forest-700 hover:bg-forest-800 active:bg-forest-900 text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <SproutIcon size={15} />
            Configure My Farm →
          </Link>
        </div>
      </div>
    );
  }

  // Extract farmer-provided or demo values
  const locationKnown = isKnownField(profile.location) ? profile.location.value : null;
  const isDemoLoc = !locationKnown || (locationKnown?.isDemonstration ?? false);
  const isLocationProvided = Boolean(locationKnown && !isDemoLoc && locationKnown.district);

  const areaHa = isKnownField(profile.landAreaHectares) ? profile.landAreaHectares.value : null;
  const isLandAreaProvided = typeof areaHa === "number" && areaHa > 0;

  const soil = isKnownField(profile.soilTexture) ? profile.soilTexture.value : null;
  const isSoilProvided = Boolean(soil);

  const irrigation = isKnownField(profile.irrigationSource) ? profile.irrigationSource.value : null;
  const isIrrigationProvided = Boolean(irrigation);

  const crops = isKnownField(profile.currentCrops) ? profile.currentCrops.value : [];
  const goals = isKnownField(profile.farmingGoals) ? profile.farmingGoals.value : [];

  const missingFields: string[] = [];
  if (!isLocationProvided) missingFields.push("Location / District");
  if (!isLandAreaProvided) missingFields.push("Operational Area");
  if (!isSoilProvided) missingFields.push("Soil Texture");
  if (!isIrrigationProvided) missingFields.push("Irrigation Water Source");

  const providedCount = 4 - missingFields.length;

  let profileTitle = "Regional Demonstration Baseline";
  let badgeLabel = "Regional Baseline";
  let badgeClass = "bg-sky-100 text-sky-800 border-sky-200";
  let statusNote = "Using Central Punjab demonstration defaults (Loam soil, Deep tubewell)";

  if (providedCount === 4) {
    profileTitle = "Farmer-Provided Farm Profile";
    badgeLabel = "Farmer-Provided Profile";
    badgeClass = "bg-emerald-100 text-emerald-800 border-emerald-200";
    statusNote = "Self-reported farm specifications combined with historical agro-climatic observations";
  } else if (providedCount > 0) {
    profileTitle = "Partially Configured Farm Profile";
    badgeLabel = `Partially Configured (${providedCount}/4 Fields)`;
    badgeClass = "bg-amber-100 text-amber-800 border-amber-300";
    statusNote = `Unconfigured attributes using regional defaults: ${missingFields.join(", ")}`;
  }

  const locationText = locationKnown
    ? `${locationKnown.district ? `${locationKnown.district}, ` : ""}${locationKnown.state || "Punjab"}`
    : "Ludhiana Demonstration Region";

  const coordsText =
    locationKnown?.latitude && locationKnown?.longitude
      ? `${locationKnown.latitude.toFixed(2)}° N, ${locationKnown.longitude.toFixed(2)}° E`
      : "30.90° N, 75.85° E";

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Top row: Profile Title, Sync Status Badge & Edit Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-forest-100 text-forest-800">
            <SproutIcon size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                {profileTitle}
              </h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badgeClass}`}
              >
                {badgeLabel}
              </span>
              {/* Profile Sync Lifecycle Status */}
              {syncStatus && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1.5 ${
                    syncStatus === "recreated" || syncStatus === "synced"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : syncStatus === "offline"
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-rose-50 text-rose-800 border-rose-200"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      syncStatus === "recreated" || syncStatus === "synced"
                        ? "bg-emerald-600"
                        : syncStatus === "offline"
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                  />
                  <span>
                    {syncStatus === "recreated"
                      ? "Restored on Server"
                      : syncStatus === "synced"
                      ? "Synchronized"
                      : syncStatus === "offline"
                      ? "Offline Cache"
                      : "Sync Error"}
                  </span>
                </span>
              )}
              {profileId && (
                <span className="font-mono text-[10px] text-slate-400">
                  ID: {profileId.slice(0, 8)}...
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {statusNote}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {onClearProfile && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Are you sure you want to reset your saved farm profile? This will revert the dashboard to demonstration mode.")) {
                  onClearProfile();
                }
              }}
              className="px-2.5 py-1.5 bg-white hover:bg-rose-50 active:bg-rose-100 text-rose-700 hover:text-rose-800 text-xs font-medium rounded-xl border border-rose-200 transition-colors"
              title="Reset saved profile and return to demonstration mode"
            >
              Reset Profile
            </button>
          )}

          <Link
            href="/onboarding"
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5"
          >
            <span>{providedCount === 4 ? "Edit Farm Details →" : "Complete Farm Setup →"}</span>
          </Link>
        </div>
      </div>

      {/* Profile Recovery Notification */}
      {recoveryOccurred && (
        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
          <span>
            <strong>Server Recovery:</strong> Stale profile was automatically re-registered on the backend following a server restart.
          </span>
        </div>
      )}

      {/* Sync Error Notification */}
      {!isSynchronized && profileError && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 text-xs flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
          <span>
            <strong>Sync Warning:</strong> {profileError.message} (Using local cache).
          </span>
        </div>
      )}

      {/* Grid of Farmer Details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {/* Location */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
          <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
            Location
          </span>
          <div className="font-semibold text-slate-900 truncate">{locationText}</div>
          <div className="text-[11px] font-mono text-slate-500">{coordsText}</div>
          <div className="text-[10px] font-medium text-slate-500 pt-0.5">
            {isLocationProvided ? "Farmer-Provided" : "Demonstration Region"}
          </div>
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
          <div className="text-[10px] font-medium text-slate-500 pt-0.5">
            {isLandAreaProvided ? "Farmer-Provided" : "Regional Default"}
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
            {soil ? "Loam-class soil" : "Loam (Central Punjab default)"}
          </div>
          <div className="text-[10px] font-medium text-slate-500 pt-0.5">
            {isSoilProvided ? "Farmer-Provided" : "Regional Default"}
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
            {irrigation ? irrigation.replace(/_/g, " ") : "Deep Tubewell default"}
          </div>
          <div className="text-[10px] font-medium text-slate-500 pt-0.5">
            {isIrrigationProvided ? "Farmer-Provided" : "Regional Default"}
          </div>
        </div>
      </div>

      {/* Partial Profile Disclosure Alert if fields missing */}
      {missingFields.length > 0 && (
        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2">
          <span>
            <strong>Partial Profile Notice:</strong> Using regional defaults for unconfigured attributes:{" "}
            <span className="font-semibold">{missingFields.join(", ")}</span>.
          </span>
          <Link
            href="/onboarding"
            className="text-amber-800 hover:text-amber-950 font-bold underline shrink-0"
          >
            Complete Setup →
          </Link>
        </div>
      )}

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

      {/* Persistence Architecture & Scientific Source Disclaimer */}
      <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100 flex items-center gap-1.5">
        <ShieldCheckIcon size={12} className="text-slate-400 shrink-0" />
        <span>
          <strong>Data Notice:</strong> Profile specifications are self-reported by the farmer (cached locally &amp; synced with server). Advisory evaluations combine these inputs with 10-year NASA POWER daily observations and Punjab Agricultural University (PAU) agronomic research.
        </span>
      </div>
    </div>
  );
}
