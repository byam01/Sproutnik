import React from "react";
import { AlertTriangleIcon, RefreshCwIcon, DatabaseIcon } from "./icons";

interface DashboardErrorProps {
  error: {
    code: string;
    message: string;
  };
  onRetry: () => void;
  onUseMock: () => void;
  isMock: boolean;
}

export function DashboardError({
  error,
  onRetry,
  onUseMock,
  isMock,
}: DashboardErrorProps) {
  const isNetworkOrFetchFailed =
    error.code === "CLIMATE_FETCH_FAILED" ||
    error.code === "NETWORK_REQUEST_FAILED" ||
    error.code === "NETWORK_ERROR" ||
    error.code === "NO_DATA_RETURNED";

  return (
    <div
      role="alert"
      className="bg-white border border-amber-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 max-w-2xl mx-auto my-12"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 bg-amber-50 rounded-xl text-amber-600 shrink-0 border border-amber-100">
          <AlertTriangleIcon size={28} />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-900">
              Climate Data Retrieval Failed
            </h3>
            <span className="text-xs font-mono bg-amber-100/70 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
              {error.code}
            </span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            {error.message}
          </p>
        </div>
      </div>

      {isNetworkOrFetchFailed && !isMock && (
        <div className="bg-forest-50/60 border border-forest-100 rounded-xl p-4 text-xs text-forest-900 space-y-2">
          <p className="font-semibold flex items-center gap-1.5 text-forest-800">
            <DatabaseIcon size={14} className="text-forest-600" />
            NASA POWER API Sandbox / Latency Note:
          </p>
          <p className="text-forest-700 leading-relaxed">
            The NASA POWER Daily API can occasionally experience server-side rate limits, high latency, or network restrictions in sandbox test environments. You can immediately switch to the <strong>calibrated 10-year Ludhiana mock baseline</strong> to explore all dashboard visualizations and indicators without delay.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          onClick={onRetry}
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 text-sm font-medium rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
        >
          <RefreshCwIcon size={16} />
          Retry Request
        </button>

        {!isMock && (
          <button
            onClick={onUseMock}
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 bg-forest-600 text-white hover:bg-forest-700 active:bg-forest-800 text-sm font-medium rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-forest-400 focus:ring-offset-2"
          >
            <DatabaseIcon size={16} />
            Switch to Calibrated Mock Baseline
          </button>
        )}
      </div>
    </div>
  );
}

