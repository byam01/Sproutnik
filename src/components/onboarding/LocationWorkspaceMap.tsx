"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Location } from "@/types";
import {
  CompassIcon,
  ZoomInIcon,
  ZoomOutIcon,
  LayersToggleIcon,
  CheckCircleIcon,
  InfoIcon,
} from "../icons";

interface LocationWorkspaceMapProps {
  location: Location | null;
  isDemo: boolean;
  onLocationChange: (loc: Location, isDemo: boolean) => void;
  locale?: string;
}

export function LocationWorkspaceMap({
  location,
  isDemo,
  onLocationChange,
}: LocationWorkspaceMapProps) {
  // Map viewport state: pan offsets (px) and zoom level (scale)
  const [zoom, setZoom] = useState<number>(1.2);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [mapLayer, setMapLayer] = useState<"satellite" | "hybrid" | "terrain">("satellite");
  const [pinPos, setPinPos] = useState<{ x: number; y: number }>({ x: 550, y: 360 });

  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Synchronize pin position when location changes from search/district selection
  useEffect(() => {
    if (location) {
      // Deterministically derive pin offset within the visual agricultural grid
      const hashLat = Math.sin(location.latitude * 100) * 120;
      const hashLon = Math.cos(location.longitude * 100) * 160;
      setPinPos({ x: 550 + hashLat, y: 360 + hashLon });
    }
  }, [location?.latitude, location?.longitude]);

  // Handle Pan Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Click on map to place or adjust the pin
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Avoid dropping pin if user was actively dragging/panning
    if (Math.abs(e.movementX) > 2 || Math.abs(e.movementY) > 2) return;

    if (!mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const clickX = (e.clientX - rect.left - offset.x) / zoom;
    const clickY = (e.clientY - rect.top - offset.y) / zoom;

    setPinPos({ x: clickX, y: clickY });

    // Derive slight realistic delta coordinates around selected district
    const baseLat = location?.latitude ?? 30.9;
    const baseLon = location?.longitude ?? 75.85;
    const deltaLat = Number(((360 - clickY) * 0.0004).toFixed(4));
    const deltaLon = Number(((clickX - 550) * 0.0004).toFixed(4));

    const newLoc: Location = {
      latitude: Number((baseLat + deltaLat).toFixed(4)),
      longitude: Number((baseLon + deltaLon).toFixed(4)),
      name: location?.name ?? "Custom Farm Plot",
      district: location?.district ?? "Ludhiana",
      state: location?.state ?? "Punjab",
      country: "India",
      elevationMeters: location?.elevationMeters ?? 247,
    };

    onLocationChange(newLoc, false);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 2.5));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.75));
  const toggleMapLayer = () => {
    setMapLayer((prev) =>
      prev === "satellite" ? "hybrid" : prev === "hybrid" ? "terrain" : "satellite"
    );
  };

  return (
    <div
      ref={mapContainerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleMapClick}
      className={`relative w-full h-full min-h-[500px] lg:min-h-[640px] overflow-hidden select-none bg-[#1a2c22] ${
        isDragging ? "cursor-grabbing" : "cursor-crosshair"
      }`}
      title="Click anywhere to adjust your farm location pin"
    >
      {/* High-Resolution Agricultural Satellite Imagery Canvas */}
      <div
        className="absolute inset-0 transition-transform duration-75 origin-center will-change-transform"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          width: "1400px",
          height: "900px",
          left: "calc(50% - 700px)",
          top: "calc(50% - 450px)",
        }}
      >
        {/* Base Satellite Imagery: Rich High-Res Agricultural Fields */}
        <svg
          viewBox="0 0 1400 900"
          className="w-full h-full object-cover pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Satellite Field Patterns & Textures */}
            <pattern id="cropField1" width="120" height="90" patternUnits="userSpaceOnUse">
              <rect width="120" height="90" fill="#2d4f3b" />
              <path d="M0,15 L120,15 M0,30 L120,30 M0,45 L120,45 M0,60 L120,60 M0,75 L120,75" stroke="#375d46" strokeWidth="2" opacity="0.6" />
            </pattern>
            <pattern id="cropField2" width="140" height="110" patternUnits="userSpaceOnUse">
              <rect width="140" height="110" fill="#355e43" />
              <path d="M15,0 L15,110 M35,0 L35,110 M55,0 L55,110 M75,0 L75,110 M95,0 L95,110 M115,0 L115,110" stroke="#417050" strokeWidth="2.5" opacity="0.7" />
            </pattern>
            <pattern id="cropFieldPaddy" width="100" height="100" patternUnits="userSpaceOnUse">
              <rect width="100" height="100" fill="#244534" />
              <rect x="5" y="5" width="90" height="90" fill="#2b503c" stroke="#1c3629" strokeWidth="2" opacity="0.8" />
            </pattern>
            <pattern id="alluvialSoil" width="80" height="80" patternUnits="userSpaceOnUse">
              <rect width="80" height="80" fill="#4d4c38" />
              <circle cx="20" cy="20" r="1.5" fill="#5c5b44" />
              <circle cx="60" cy="50" r="2" fill="#3f3e2e" />
            </pattern>
            <filter id="satGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Agricultural Landscape */}
          <rect width="1400" height="900" fill="#1f3729" />

          {/* Regional Field Parcels (Punjab Canal Colony Grid Geometry) */}
          <g opacity={mapLayer === "terrain" ? "0.85" : "1"}>
            <polygon points="40,30 380,20 420,320 60,340" fill="url(#cropField1)" stroke="#1a2e22" strokeWidth="3" />
            <polygon points="420,20 780,10 820,280 440,300" fill="url(#cropField2)" stroke="#1a2e22" strokeWidth="3" />
            <polygon points="800,15 1160,25 1200,310 840,300" fill="url(#cropFieldPaddy)" stroke="#1a2e22" strokeWidth="3" />
            <polygon points="1180,30 1380,35 1370,330 1220,320" fill="url(#alluvialSoil)" stroke="#1a2e22" strokeWidth="3" />

            <polygon points="50,370 410,350 440,680 70,690" fill="url(#cropFieldPaddy)" stroke="#1a2e22" strokeWidth="3" />
            <polygon points="430,330 830,310 880,660 460,670" fill="url(#cropField1)" stroke="#1a2e22" strokeWidth="3" />
            <polygon points="850,330 1210,340 1240,670 870,660" fill="url(#cropField2)" stroke="#1a2e22" strokeWidth="3" />

            <polygon points="80,720 430,710 450,880 90,880" fill="url(#alluvialSoil)" stroke="#1a2e22" strokeWidth="3" />
            <polygon points="460,690 860,680 870,880 470,880" fill="url(#cropFieldPaddy)" stroke="#1a2e22" strokeWidth="3" />
            <polygon points="880,690 1230,690 1220,880 890,880" fill="url(#cropField1)" stroke="#1a2e22" strokeWidth="3" />
          </g>

          {/* Irrigation Canal Network (Water blue lines) */}
          <path
            d="M0,335 C300,330 600,325 900,320 C1200,315 1400,325 1400,325"
            fill="none"
            stroke="#2b6b7a"
            strokeWidth="7"
            opacity="0.85"
          />
          <path
            d="M425,0 C430,300 445,600 455,900"
            fill="none"
            stroke="#2b6b7a"
            strokeWidth="5"
            opacity="0.8"
          />
          <path
            d="M835,0 C845,300 860,600 875,900"
            fill="none"
            stroke="#2b6b7a"
            strokeWidth="5"
            opacity="0.8"
          />

          {/* Field Farm Access Roads (Beige pathways) */}
          <path
            d="M0,150 L1400,140 M0,500 L1400,490 M0,700 L1400,690"
            stroke="#736f58"
            strokeWidth="3.5"
            strokeDasharray="18 4"
            opacity="0.65"
          />
          <path
            d="M200,0 L210,900 M650,0 L660,900 M1050,0 L1060,900"
            stroke="#736f58"
            strokeWidth="3.5"
            strokeDasharray="18 4"
            opacity="0.65"
          />

          {/* Active Highlighted Parcel Geometry (Matching locationpng.png Green Polygon) */}
          <polygon
            points={`${pinPos.x - 120},${pinPos.y - 70} ${pinPos.x + 110},${pinPos.y - 100} ${pinPos.x + 140},${pinPos.y + 80} ${pinPos.x - 90},${pinPos.y + 110}`}
            fill="#4ade80"
            fillOpacity="0.28"
            stroke="#86efac"
            strokeWidth="3.5"
            filter="url(#satGlow)"
          />

          {/* NASA 0.5° Grid Boundary Overlay (Dotted Geospatial Grid) */}
          <rect
            x={pinPos.x - 280}
            y={pinPos.y - 200}
            width="560"
            height="400"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="1.5"
            strokeDasharray="6 6"
            opacity="0.45"
          />
          <text
            x={pinPos.x - 270}
            y={pinPos.y - 180}
            fill="#e2e8f0"
            fontSize="10"
            fontFamily="monospace"
            opacity="0.65"
          >
            NASA POWER Grid Cell (0.5° × 0.5° ~50km)
          </text>
        </svg>

        {/* Active Farm Location Marker Pin (Pulsing Reticle & Tag matching locationpng.png) */}
        <div
          className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200"
          style={{ left: `${pinPos.x}px`, top: `${pinPos.y}px` }}
        >
          {/* Animated Radar Pulse Rings */}
          <div className="absolute -inset-6 rounded-full bg-emerald-400/25 animate-ping" />
          <div className="absolute -inset-3 rounded-full bg-emerald-400/40" />
          
          {/* Luminous Center Pin */}
          <div className="relative w-6 h-6 rounded-full bg-emerald-500 border-2 border-white shadow-lg flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>

          {/* Floating Callout Tag matching locationpng.png */}
          <div className="absolute left-8 top-1/2 -translate-y-1/2 bg-[#1c2920]/95 backdrop-blur-md text-white px-3 py-1.5 rounded-xl border border-emerald-500/40 shadow-xl whitespace-nowrap flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <p className="text-xs font-bold leading-tight">
                {location?.name ?? "Selected Farm Location"}
              </p>
              <p className="text-[10px] text-stone-300 font-mono">
                {location ? `${location.latitude.toFixed(2)}° N, ${location.longitude.toFixed(2)}° E` : "30.90° N, 75.85° E"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FLOATING TOP-RIGHT HUD OVERLAY: Real Climate Information (matching locationpng.png) */}
      <div className="absolute top-4 right-4 max-w-[280px] sm:max-w-[320px] bg-[#16251c]/90 backdrop-blur-md text-white border border-stone-600/50 rounded-2xl p-4 shadow-2xl z-10 space-y-3 pointer-events-auto">
        <div className="flex items-center justify-between border-b border-stone-700/60 pb-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-stone-300">
            Local Climate Information
          </span>
          <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-semibold px-2 py-0.5 rounded-full font-mono">
            Active
          </span>
        </div>

        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
            <CompassIcon size={14} className="text-emerald-400" />
            {location?.district ? `${location.district} District Grid` : "Ludhiana District Grid"}
          </h4>
          <p className="text-[11px] text-stone-300 font-mono mt-0.5">
            {location ? `${location.latitude.toFixed(2)}° N, ${location.longitude.toFixed(2)}° E` : "30.90° N, 75.85° E"}
            {location?.elevationMeters ? ` • ${location.elevationMeters}m MSL` : " • 247m MSL"}
          </p>
        </div>

        <div className="space-y-1.5 text-xs text-stone-300 pt-1 border-t border-stone-800">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-stone-400">Data Source:</span>
            <span className="font-semibold text-stone-200">NASA POWER Satellite</span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-stone-400">Grid Resolution:</span>
            <span className="font-mono text-stone-200">0.5° × 0.5° (~50 km)</span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-stone-400">Historical Series:</span>
            <span className="font-semibold text-emerald-400">10-Year Validated</span>
          </div>
        </div>

        {isDemo && (
          <div className="bg-amber-950/80 border border-amber-600/40 rounded-xl p-2 text-[10px] text-amber-200 flex items-start gap-1.5">
            <InfoIcon size={12} className="text-amber-400 shrink-0 mt-0.5" />
            <span>
              Prototype reference dataset active. You can select another Punjab district or move the pin anytime.
            </span>
          </div>
        )}
      </div>

      {/* FLOATING BOTTOM-LEFT SELECTED FARM LOCATION SUMMARY (matching locationpng.png) */}
      <div className="absolute bottom-4 left-4 max-w-[280px] sm:max-w-[340px] bg-[#16251c]/90 backdrop-blur-md text-white border border-stone-600/50 rounded-2xl p-3.5 shadow-2xl z-10 pointer-events-auto space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-800 text-white flex items-center justify-center shrink-0">
            <CheckCircleIcon size={15} />
          </div>
          <div>
            <span className="text-xs font-bold block leading-tight text-white">
              {location?.district ?? "Ludhiana District"}
            </span>
            <span className="text-[10px] text-stone-300 block">
              {location?.state ?? "Punjab, India"}
            </span>
          </div>
        </div>
        <p className="text-[10px] text-stone-400 leading-tight">
          Click or drag anywhere on the satellite view to refine your farm boundary.
        </p>
      </div>

      {/* FLOATING BOTTOM-RIGHT MAP CONTROLS (Zoom & Layer Toggle matching locationpng.png) */}
      <div className="absolute bottom-4 right-4 flex flex-col items-center gap-2 z-10 pointer-events-auto">
        <button
          type="button"
          onClick={handleZoomIn}
          className="w-10 h-10 rounded-xl bg-[#16251c]/90 hover:bg-[#23382c] text-white border border-stone-600/60 shadow-lg flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
          title="Zoom in"
          aria-label="Zoom in"
        >
          <ZoomInIcon size={18} />
        </button>

        <button
          type="button"
          onClick={handleZoomOut}
          className="w-10 h-10 rounded-xl bg-[#16251c]/90 hover:bg-[#23382c] text-white border border-stone-600/60 shadow-lg flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
          title="Zoom out"
          aria-label="Zoom out"
        >
          <ZoomOutIcon size={18} />
        </button>

        <button
          type="button"
          onClick={toggleMapLayer}
          className={`w-10 h-10 rounded-xl border shadow-lg flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
            mapLayer === "hybrid"
              ? "bg-emerald-700 text-white border-emerald-500"
              : "bg-[#16251c]/90 hover:bg-[#23382c] text-white border-stone-600/60"
          }`}
          title={`Toggle map mode (Current: ${mapLayer})`}
          aria-label="Toggle map mode"
        >
          <LayersToggleIcon size={18} />
        </button>
      </div>
    </div>
  );
}
