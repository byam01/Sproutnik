"use client";

import React, { useState } from "react";
import { Location } from "@/types";
import {
  LocationChoice,
  RECENT_PUNJAB_LOCATIONS,
  LUDHIANA_DEMO_LOCATION,
} from "@/types/onboarding";
import {
  CompassIcon,
  SearchIcon,
  MapPinIcon,
  ChevronRightIcon,
  CrosshairIcon,
  InfoIcon,
  CheckCircleIcon,
} from "../icons";

interface LocationWorkspacePanelProps {
  location: Location | null;
  isDemo: boolean;
  onSelectLocation: (loc: Location, isDemo: boolean) => void;
  onConfirm: () => void;
  onBack: () => void;
  locale?: string;
}

export function LocationWorkspacePanel({
  location,
  isDemo,
  onSelectLocation,
  onConfirm,
  onBack,
}: LocationWorkspacePanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Filter Punjab districts based on search query
  const filteredLocations = RECENT_PUNJAB_LOCATIONS.filter((loc) =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Request browser geolocation with explicit user permission
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const lat = Number(position.coords.latitude.toFixed(4));
        const lon = Number(position.coords.longitude.toFixed(4));

        const userLoc: Location = {
          latitude: lat,
          longitude: lon,
          name: "My Farm Location",
          district: "Detected Coordinates",
          state: "Punjab",
          country: "India",
          elevationMeters: 240,
        };

        onSelectLocation(userLoc, false);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError(
            "Location permission was not granted. Please select your district from the list below."
          );
        } else {
          setLocationError("Unable to retrieve location. Please choose your district.");
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="w-full lg:w-[410px] xl:w-[440px] shrink-0 h-full bg-[#faf9f5] border-r border-stone-200/80 flex flex-col justify-between overflow-y-auto">
      {/* Top Content Area */}
      <div className="p-5 sm:p-7 space-y-5 sm:space-y-6">
        {/* Brand Bar */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-forest-900 text-white flex items-center justify-center">
            <CompassIcon size={16} />
          </div>
          <span className="text-sm font-serif italic font-bold tracking-tight text-forest-950">
            Sproutnik
          </span>
        </div>

        {/* Headline & Description matching locationpng.png */}
        <div className="space-y-1.5 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 font-sans">
            Define your <span className="font-serif italic text-forest-800">Workspace.</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Select your farm's location so Sproutnik can explore local climate conditions and environmental data for your crop rotation plan.
          </p>
        </div>

        {/* Location Search Input */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
            Search for your farm
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
              <SearchIcon size={16} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter a village, district, address or coordinates"
              className="w-full pl-10 pr-4 py-3 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-forest-700 focus:border-forest-700 shadow-2xs transition-all"
            />
          </div>

          {/* Use My Current Location Action Button */}
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="w-full mt-1.5 py-2 px-3 bg-white hover:bg-stone-50 text-forest-800 border border-stone-200/90 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <CrosshairIcon size={14} className={isLocating ? "animate-spin" : ""} />
            <span>
              {isLocating ? "Requesting device coordinates..." : "Use my current location"}
            </span>
          </button>

          {locationError && (
            <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 leading-tight">
              {locationError}
            </p>
          )}
        </div>

        {/* Selected Location Summary Card */}
        {location ? (
          <div className="p-3.5 bg-white rounded-xl border border-stone-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <MapPinIcon size={14} className="text-forest-700" />
                Selected location
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${
                  isDemo
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : "bg-emerald-50 text-emerald-800 border-emerald-200"
                }`}
              >
                {isDemo ? "Demo Reference" : "Confirmed"}
              </span>
            </div>

            <div className="pt-0.5">
              <h3 className="text-sm font-bold text-stone-900 leading-tight">
                {location.name ?? `${location.district} District`}
              </h3>
              <p className="text-xs text-stone-500 font-mono mt-0.5">
                {location.latitude.toFixed(2)}° N, {location.longitude.toFixed(2)}° E
                {location.elevationMeters ? ` • ${location.elevationMeters}m MSL` : ""}
              </p>
            </div>

            <p className="text-[11px] text-stone-500 leading-relaxed border-t border-stone-100 pt-2">
              Pin positioned on satellite map. Click or drag anywhere on the map to adjust the pin.
            </p>
          </div>
        ) : (
          <div className="p-3.5 bg-stone-100/70 rounded-xl border border-dashed border-stone-300 text-stone-500 text-xs flex items-center gap-2">
            <InfoIcon size={16} className="text-stone-400 shrink-0" />
            <span>No location chosen yet. Choose a district below or click on the map.</span>
          </div>
        )}

        {/* Recent Locations List matching locationpng.png */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
            Recent locations
          </span>
          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-0.5">
            {filteredLocations.map((loc) => {
              const isSelected =
                location?.district === loc.district &&
                (loc.isDemo ? isDemo : !isDemo);

              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => {
                    const chosenLoc: Location = {
                      latitude: loc.coordinates.lat,
                      longitude: loc.coordinates.lon,
                      name: loc.name,
                      district: loc.district,
                      state: loc.state,
                      country: "India",
                      elevationMeters: loc.elevationMeters,
                    };
                    onSelectLocation(chosenLoc, loc.isDemo);
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group ${
                    isSelected
                      ? "bg-white border-forest-600 ring-2 ring-forest-600/20 shadow-xs"
                      : "bg-white hover:bg-stone-50/80 border-stone-200"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? "bg-forest-800 text-white"
                          : "bg-stone-100 text-stone-600 group-hover:bg-forest-50 group-hover:text-forest-800"
                      }`}
                    >
                      <MapPinIcon size={14} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-900 block leading-tight">
                          {loc.district} District
                        </span>
                        {loc.isDemo && (
                          <span className="text-[9px] px-1.5 py-0.2 bg-amber-50 text-amber-800 border border-amber-200 font-mono rounded">
                            Demo
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-stone-500 font-mono block mt-0.5">
                        {loc.coordinates.lat.toFixed(2)}° N, {loc.coordinates.lon.toFixed(2)}° E
                      </span>
                    </div>
                  </div>
                  <ChevronRightIcon
                    size={16}
                    className={`shrink-0 transition-transform ${
                      isSelected
                        ? "text-forest-700 translate-x-0.5"
                        : "text-stone-400 group-hover:text-stone-700"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Natural Language Informational Callout (matching locationpng.png Environmental Sync) */}
        <div className="p-3.5 bg-forest-950 text-white rounded-xl space-y-1.5 shadow-xs">
          <div className="flex items-center gap-2">
            <InfoIcon size={14} className="text-emerald-400 shrink-0" />
            <h4 className="text-xs font-bold text-white">Climate data for your location</h4>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed">
            NASA POWER satellite observations are retrieved for a 0.5° × 0.5° grid (~50 km) covering your area. Historical rainfall, heatwaves, and seasonal patterns will be evaluated for the last 10–15 years.
          </p>
        </div>
      </div>

      {/* Bottom Sticky Action Bar matching locationpng.png */}
      <div className="p-4 sm:p-5 bg-white border-t border-stone-200/90 flex items-center gap-3 sticky bottom-0 z-20 shadow-md sm:shadow-none">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 px-4 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold text-xs sm:text-sm transition-colors text-center"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 py-3 px-4 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-semibold text-xs sm:text-sm shadow-xs transition-all text-center flex items-center justify-center gap-2"
        >
          <span>Confirm location</span>
          <ChevronRightIcon size={16} />
        </button>
      </div>
    </div>
  );
}
