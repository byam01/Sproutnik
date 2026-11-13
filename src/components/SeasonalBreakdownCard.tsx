import React from "react";
import { SeasonalRainfall } from "@/types";
import { CalendarIcon, DropletIcon } from "./icons";

interface SeasonalBreakdownCardProps {
  seasonalRainfallMm: SeasonalRainfall;
  meanAnnualRainfallMm: number;
}

export function SeasonalBreakdownCard({
  seasonalRainfallMm,
  meanAnnualRainfallMm,
}: SeasonalBreakdownCardProps) {
  const total = meanAnnualRainfallMm > 0 ? meanAnnualRainfallMm : 1;

  const seasons = [
    {
      name: "Southwest Monsoon",
      window: "June – September (4 months)",
      mm: seasonalRainfallMm.monsoonMm,
      percent: (seasonalRainfallMm.monsoonMm / total) * 100,
      color: "bg-forest-600",
      textColor: "text-forest-700",
      lightBg: "bg-forest-50",
      cropContext: "Kharif Season (Paddy Rice, Maize, Cotton)",
      agronomicImpact:
        "Highest precipitation window, yet inadequate for puddle rice (~1500-2000 mm required), creating severe groundwater overdraft.",
    },
    {
      name: "Winter Disturbances",
      window: "November – February (4 months)",
      mm: seasonalRainfallMm.winterMm,
      percent: (seasonalRainfallMm.winterMm / total) * 100,
      color: "bg-sky-600",
      textColor: "text-sky-700",
      lightBg: "bg-sky-50",
      cropContext: "Rabi Season (Wheat, Mustard, Gram)",
      agronomicImpact:
        "Vital moisture from Western Disturbances; supplemental tubewell/canal irrigation required for wheat crown root & tillering.",
    },
    {
      name: "Pre-Monsoon Summer",
      window: "March – May (3 months)",
      mm: seasonalRainfallMm.summerMm,
      percent: (seasonalRainfallMm.summerMm / total) * 100,
      color: "bg-amber-600",
      textColor: "text-amber-700",
      lightBg: "bg-amber-50",
      cropContext: "Zaid Window (Short-duration Moong, Fodder)",
      agronomicImpact:
        "High evaporative demand and soaring temperatures up to 40°C restrict un-irrigated summer crops.",
    },
    {
      name: "Post-Monsoon Transition",
      window: "October (1 month)",
      mm: seasonalRainfallMm.postMonsoonMm,
      percent: (seasonalRainfallMm.postMonsoonMm / total) * 100,
      color: "bg-emerald-500",
      textColor: "text-emerald-700",
      lightBg: "bg-emerald-50",
      cropContext: "Turnaround Window (Rice Harvest to Wheat Sowing)",
      agronomicImpact:
        "Critical 15-25 day residue management & field preparation window between kharif harvest and rabi sowing.",
    },
  ];

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-forest-50 text-forest-700 border border-forest-100">
            <CalendarIcon size={18} />
          </div>
          <h3 className="font-semibold text-slate-900 text-base">
            Seasonal Rainfall Allocation
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-500">
          Punjab Agro-Climatic Zones
        </span>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed">
        Breakdown of historical rainfall across the four distinct agro-meteorological seasons of Punjab, illustrating the stark disparity between Kharif monsoon supply and dry-season irrigation dependence.
      </p>

      {/* Stacked Progress Bar */}
      <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden">
        {seasons.map((s) => (
          <div
            key={s.name}
            className={`${s.color} transition-all duration-300`}
            style={{ width: `${Math.max(2, s.percent)}%` }}
            title={`${s.name}: ${s.mm.toFixed(1)} mm (${s.percent.toFixed(1)}%)`}
          />
        ))}
      </div>

      {/* Season Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {seasons.map((s) => (
          <div
            key={s.name}
            className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 flex flex-col justify-between space-y-2 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className={`text-xs font-semibold ${s.textColor}`}>
                  {s.name}
                </span>
                <p className="text-[11px] text-slate-500">{s.window}</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-sm font-bold text-slate-900">
                  {s.mm.toFixed(1)} mm
                </span>
                <p className="text-[10px] text-slate-400 font-mono">
                  {s.percent.toFixed(1)}% of total
                </p>
              </div>
            </div>

            <div className="text-[11px] text-slate-600 border-t border-slate-200/60 pt-2 space-y-1">
              <div className="flex items-center gap-1 font-medium text-slate-800">
                <DropletIcon size={12} className={s.textColor} />
                <span>{s.cropContext}</span>
              </div>
              <p className="text-slate-500 leading-tight">
                {s.agronomicImpact}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

