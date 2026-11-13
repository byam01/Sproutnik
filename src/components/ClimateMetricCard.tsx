import React from "react";

export interface ClimateMetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  description: string;
  contextNote?: string;
  badge?: {
    label: string;
    variant?: "success" | "warning" | "info" | "neutral";
  };
  icon?: React.ReactNode;
}

export function ClimateMetricCard({
  title,
  value,
  unit,
  description,
  contextNote,
  badge,
  icon,
}: ClimateMetricCardProps) {
  const badgeClasses = {
    success: "bg-forest-50 text-forest-700 border-forest-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    info: "bg-sky-50 text-sky-700 border-sky-200",
    neutral: "bg-slate-50 text-slate-600 border-slate-200",
  }[badge?.variant || "neutral"];

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </span>
          {icon && (
            <div className="p-2 rounded-xl bg-forest-50/80 text-forest-700 border border-forest-100 shrink-0">
              {icon}
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-3xl font-bold tracking-tight text-slate-900 font-mono">
            {value}
          </span>
          {unit && (
            <span className="text-sm font-medium text-slate-500">
              {unit}
            </span>
          )}
        </div>

        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          {description}
        </p>
      </div>

      {(badge || contextNote) && (
        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {contextNote && (
            <span className="text-slate-500 font-medium truncate">
              {contextNote}
            </span>
          )}
          {badge && (
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium border shrink-0 ${badgeClasses}`}
            >
              {badge.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

