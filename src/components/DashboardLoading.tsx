import React from "react";

export function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading climate analytics dashboard">
      {/* Header skeleton */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-slate-200 rounded" />
            <div className="h-4 w-72 bg-slate-100 rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-32 bg-slate-200 rounded-full" />
            <div className="h-9 w-28 bg-slate-200 rounded-full" />
          </div>
        </div>
      </div>

      {/* Metrics grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div className="h-4 w-28 bg-slate-200 rounded" />
              <div className="h-8 w-8 bg-forest-100/50 rounded-lg" />
            </div>
            <div className="h-8 w-24 bg-slate-200 rounded" />
            <div className="h-3 w-40 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* Charts grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-5 w-44 bg-slate-200 rounded" />
            <div className="h-8 w-32 bg-slate-100 rounded-lg" />
          </div>
          <div className="h-64 bg-slate-100/70 rounded-xl" />
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-5 w-44 bg-slate-200 rounded" />
            <div className="h-8 w-28 bg-slate-100 rounded-lg" />
          </div>
          <div className="h-64 bg-slate-100/70 rounded-xl" />
        </div>
      </div>

      {/* Context & Data Transparency skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="h-5 w-56 bg-slate-200 rounded" />
          <div className="h-4 w-full bg-slate-100 rounded" />
          <div className="h-4 w-3/4 bg-slate-100 rounded" />
          <div className="h-32 bg-slate-50 border border-slate-100 rounded-xl" />
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="h-5 w-36 bg-slate-200 rounded" />
          <div className="h-4 w-full bg-slate-100 rounded" />
          <div className="space-y-2">
            <div className="h-8 bg-slate-100 rounded" />
            <div className="h-8 bg-slate-100 rounded" />
            <div className="h-8 bg-slate-100 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

