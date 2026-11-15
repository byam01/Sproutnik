"use client";

import React, { useEffect } from "react";
import {
  FarmerAdvisoryReportData,
  printAdvisoryReport,
  downloadAdvisoryReportHtml,
} from "@/reports/advisoryReportGenerator";
import {
  XIcon,
  ShieldCheckIcon,
  DropletIcon,
  CalendarIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  InfoIcon,
} from "./icons";

interface FarmerAdvisoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: FarmerAdvisoryReportData | null;
}

export function FarmerAdvisoryModal({
  isOpen,
  onClose,
  reportData,
}: FarmerAdvisoryModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !reportData) return null;

  const isSimulated = reportData.scenarioDisclosure.isSimulated;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="advisory-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Control Bar */}
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80">
          <div>
            <h2
              id="advisory-modal-title"
              className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2"
            >
              <ShieldCheckIcon size={20} className="text-forest-700" />
              Farmer Agro-Climatic Advisory Report
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
              <span>{reportData.reportId}</span>
              <span>•</span>
              <span>{reportData.formattedDate}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => printAdvisoryReport(reportData)}
              className="px-3.5 py-1.5 bg-forest-700 hover:bg-forest-800 active:bg-forest-900 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>🖨️ Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={() => downloadAdvisoryReportHtml(reportData)}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl border border-slate-200 transition-colors"
            >
              Download HTML
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Close advisory report"
            >
              <XIcon size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Document Preview (Styled as A4 Advisory Document) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/60">
          <div className="max-w-3xl mx-auto bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 text-slate-800 text-xs">
            {/* Document Header */}
            <div className="border-b-2 border-forest-700 pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <span className="text-xl font-black text-forest-800 tracking-tight block">
                  Rotation Compass • Sproutnik
                </span>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Farmer Agro-Climatic Advisory Report
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  NASA Space Apps Challenge 2026 • Open Science Decision Support
                </span>
              </div>
              <div className="text-left sm:text-right text-[11px] text-slate-600 font-mono space-y-0.5">
                <div>ID: <strong>{reportData.reportId}</strong></div>
                <div>Date: {reportData.formattedDate}</div>
                <div>Mode: <strong>{reportData.mode === "head_to_head" ? "Candidate Comparison" : "Baseline Benchmark"}</strong></div>
              </div>
            </div>

            {/* What-If Scenario / Baseline Disclosure */}
            <div
              className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                isSimulated
                  ? "bg-amber-50/80 border-amber-300 text-amber-950"
                  : reportData.scenarioDisclosure.isProfileConfirmed
                  ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                  : "bg-sky-50/80 border-sky-200 text-sky-950"
              }`}
            >
              <strong className="block font-bold text-[11px] uppercase tracking-wider mb-0.5">
                {reportData.scenarioDisclosure.bannerTitle}
              </strong>
              <p>{reportData.scenarioDisclosure.disclosureNote}</p>
            </div>

            {/* 1. Farm Context & Baseline Grid */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                1. Farm &amp; Agro-Climatic Baseline Context
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Location &amp; Area</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                      reportData.farmContext.fieldProvenance?.location === "farmer_provided"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-200 text-slate-700"
                    }`}>
                      {reportData.farmContext.fieldProvenance?.location === "farmer_provided" ? "Farmer-Provided" : "Demonstration Default"}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 text-xs mt-0.5">{reportData.farmContext.locationName}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{reportData.farmContext.coordinatesText} • {reportData.farmContext.landAreaText}</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Soil Texture</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                      reportData.farmContext.fieldProvenance?.soilTexture === "farmer_provided"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-200 text-slate-700"
                    }`}>
                      {reportData.farmContext.fieldProvenance?.soilTexture === "farmer_provided" ? "Farmer-Provided" : "Regional Default"}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 text-xs mt-0.5">
                    {isSimulated && reportData.scenarioDisclosure.simulatedSoilLabel
                      ? `${reportData.scenarioDisclosure.simulatedSoilLabel} (Simulated)`
                      : reportData.farmContext.savedSoilLabel}
                  </div>
                  <div className="text-[10px] text-slate-500">Profile: {reportData.farmContext.savedSoilLabel}</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Irrigation Source</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                      reportData.farmContext.fieldProvenance?.irrigationSource === "farmer_provided"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-200 text-slate-700"
                    }`}>
                      {reportData.farmContext.fieldProvenance?.irrigationSource === "farmer_provided" ? "Farmer-Provided" : "Regional Default"}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 text-xs mt-0.5">
                    {isSimulated && reportData.scenarioDisclosure.simulatedIrrigationLabel
                      ? `${reportData.scenarioDisclosure.simulatedIrrigationLabel} (Simulated)`
                      : reportData.farmContext.savedIrrigationLabel}
                  </div>
                  <div className="text-[10px] text-slate-500">Profile: {reportData.farmContext.savedIrrigationLabel}</div>
                </div>
              </div>

              {reportData.farmContext.completeness === "partially_configured" && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs mt-2">
                  <strong>Partial Profile Notice:</strong> Evaluated with {4 - (reportData.farmContext.unconfiguredFields?.length || 0)}/4 core fields provided. Regional defaults applied for: {reportData.farmContext.unconfiguredFields?.join(", ")}.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Mean Annual Rainfall</span>
                  <div className="font-bold text-slate-900 text-xs mt-0.5">{reportData.climateSummary.meanAnnualRainfallMm} mm/yr</div>
                  <div className="text-[10px] text-slate-500 font-mono">{reportData.climateSummary.periodText}</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Monsoon Rainfall</span>
                  <div className="font-bold text-slate-900 text-xs mt-0.5">
                    {reportData.climateSummary.monsoonMm !== null ? `${reportData.climateSummary.monsoonMm.toFixed(0)} mm` : "N/A"}
                  </div>
                  <div className="text-[10px] text-slate-500">June–Sept Kharif window</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Thermal Baseline</span>
                  <div className="font-bold text-slate-900 text-xs mt-0.5">{reportData.climateSummary.meanTemperatureC.toFixed(1)}°C</div>
                  <div className="text-[10px] text-slate-500">Daily mean 2m air temp</div>
                </div>
              </div>
            </div>

            {/* 2. Evaluated Systems & Stage A Feasibility Table */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                2. Evaluated Cropping Systems &amp; Physical Feasibility
              </h3>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] uppercase font-bold">
                      <th className="p-2.5">Cropping System</th>
                      <th className="p-2.5">Crop Sequence</th>
                      <th className="p-2.5">Annual Irrigation Demand</th>
                      <th className="p-2.5">Min. Turnaround</th>
                      <th className="p-2.5">Stage A Physical Viability</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData.rotations.map((r) => (
                      <tr key={r.rotationId} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-bold text-slate-900">
                          {r.name}
                          <span className="block text-[9px] text-slate-400 font-normal uppercase">
                            Role: {r.role.replace("_", " ")}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-700">{r.cropSequence.join(" → ")}</td>
                        <td className="p-2.5 font-mono">
                          ~{r.waterDemandMm} mm/yr
                          <span className="block text-[9px] text-slate-400 uppercase">{r.groundwaterPressureIndex} depletion tier</span>
                        </td>
                        <td className="p-2.5 font-mono">
                          {r.minTurnaroundDays} Days
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              r.isFeasible
                                ? "bg-emerald-100 text-emerald-900 border-emerald-200"
                                : "bg-rose-100 text-rose-900 border-rose-200"
                            }`}
                          >
                            {r.isFeasible ? "✓ Viable" : "⚠️ Restricted"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-[10px] text-slate-500 pt-0.5">
                *Estimated annual supplemental irrigation application based on Punjab Agricultural University (PAU) Package of Practices. Does not represent measured farm groundwater metering.
              </div>

              {/* Physical rejection notes / warnings */}
              {reportData.rotations
                .filter((r) => !r.isFeasible || r.warnings.length > 0)
                .map((r) => (
                  <div
                    key={r.rotationId}
                    className={`p-2.5 rounded-xl border text-[11px] leading-relaxed ${
                      !r.isFeasible
                        ? "bg-rose-50/70 border-rose-200 text-rose-950"
                        : "bg-amber-50/70 border-amber-200 text-amber-950"
                    }`}
                  >
                    <strong>[{r.name}] {!r.isFeasible ? "Physical Constraint:" : "Operational Warning:"} </strong>
                    {r.rejectionReasons.length > 0
                      ? r.rejectionReasons.join(" ")
                      : r.warnings.join(" ")}
                  </div>
                ))}
            </div>

            {/* 3. Agronomic Comparison Highlights */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                3. Comparative Agronomic Analysis &amp; Stage B Trade-Offs
              </h3>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-[11px]">
                <div>• <strong>Water Demand Contrast:</strong> {reportData.comparisonHighlights.waterDemandContrast}</div>
                <div>• <strong>Field Turnaround Buffer:</strong> {reportData.comparisonHighlights.turnaroundContrast}</div>
                <div>• <strong>Physical Feasibility:</strong> {reportData.comparisonHighlights.feasibilityContrast}</div>
              </div>

              {/* Five Dimensions Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] uppercase font-bold">
                      <th className="p-2.5 w-1/4">Trade-Off Dimension</th>
                      {reportData.rotations.map((r) => (
                        <th key={r.rotationId} className="p-2.5">
                          {r.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      "Climate & Thermal Risk",
                      "Water Demand & Groundwater",
                      "Agrobiodiversity & Pest Cycles",
                      "Soil Health & Nutrient Cycling",
                      "Turnaround & Residue Management",
                    ].map((dimName) => (
                      <tr key={dimName} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-bold text-slate-900">{dimName}</td>
                        {reportData.rotations.map((r) => {
                          const tradeoff = r.tradeoffs.find((t) => t.dimensionName === dimName);
                          const score = tradeoff?.scoreLabel || "moderate";
                          return (
                            <td key={r.rotationId} className="p-2.5">
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider border ${
                                  score === "favorable"
                                    ? "bg-emerald-100 text-emerald-900 border-emerald-200"
                                    : score === "caution" || score === "unfavorable"
                                    ? "bg-amber-100 text-amber-900 border-amber-200"
                                    : "bg-slate-100 text-slate-700 border-slate-200"
                                }`}
                              >
                                {score}
                              </span>
                              <p className="text-[10px] text-slate-600 mt-1 leading-snug">
                                {tradeoff?.summary}
                              </p>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Practical On-Farm Verification Steps */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                4. Practical On-Farm Verification Steps Before Sowing
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                {reportData.farmerInvestigationChecklist.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2"
                  >
                    <span className="font-bold text-forest-700 shrink-0">
                      {idx + 1}.
                    </span>
                    <span className="text-slate-700">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Scientific Provenance & Disclaimers */}
            <div className="pt-2 border-t border-slate-200 space-y-2 text-[10px] text-slate-500 leading-relaxed">
              <div>
                <strong>Scientific Attribution:</strong> Punjab Agricultural University (PAU) Package of Practices; Central Ground Water Board (CGWB) Dynamic Ground Water Resources Assessment of Punjab; ICAR-IIFSR Crop Diversification Trials.
              </div>
              <div>
                <strong>Decision Support Notice:</strong> {reportData.scientificDisclaimer}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
