"use client";

import React from "react";
import {
  CompassIcon,
  LayersIcon,
  SproutIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  InfoIcon,
} from "../icons";

interface UnifiedWelcomeScreenProps {
  onSelectMode: (mode: "field-guide" | "conversation") => void;
  onReturnToDashboard: () => void;
  locale?: string;
}

export function UnifiedWelcomeScreen({
  onSelectMode,
  onReturnToDashboard,
}: UnifiedWelcomeScreenProps) {
  return (
    <div className="w-full max-w-4xl mx-auto py-10 px-4 sm:px-6 space-y-8">
      {/* Top Header Identity */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-forest-900 text-white flex items-center justify-center shadow-xs">
            <CompassIcon size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif italic font-extrabold text-stone-900 text-xl tracking-tight">
                Sproutnik
              </span>
              <span className="text-stone-300">|</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-forest-800 bg-forest-50 px-2.5 py-0.5 rounded border border-forest-200/60 font-mono">
                Rotation Compass
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium">
              Climate-Aware Agricultural Planning · Powered by NASA POWER
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onReturnToDashboard}
          className="text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-50 px-3.5 py-2 rounded-xl transition-colors border border-stone-200 shadow-2xs self-start sm:self-auto"
        >
          ← Return to dashboard
        </button>
      </div>

      {/* Hero Headline Section matching home.png / locationpng.png */}
      <div className="space-y-3 pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-50 border border-forest-200/80 text-forest-900 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-forest-600 animate-pulse" />
          Demonstration Region: Ludhiana District, Punjab (Rice–Wheat Cropping Belt)
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-stone-900 font-sans leading-tight">
          Cultivating the <span className="font-serif italic text-forest-800">Future</span> of your farm.
        </h1>

        <p className="text-sm sm:text-base text-stone-600 max-w-2xl leading-relaxed">
          Sproutnik connects historical NASA satellite climate data to your soil, groundwater, and crop turnaround schedule to recommend sustainable, resilient crop rotations.
        </p>
      </div>

      {/* The Two Primary Choices: Step-by-Step Guide vs. Guided Conversation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* OPTION 1: Step-by-Step Field Guide */}
        <div className="rounded-2xl border-2 border-stone-200 hover:border-forest-700 bg-white p-6 sm:p-7 flex flex-col justify-between space-y-6 shadow-xs hover:shadow-md transition-all group">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-forest-50 text-forest-800 border border-forest-200/70 flex items-center justify-center group-hover:bg-forest-800 group-hover:text-white transition-colors">
                <LayersIcon size={22} />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-forest-800 bg-forest-50 px-2.5 py-1 rounded-full border border-forest-200/60 font-semibold">
                Visual & Structured
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 group-hover:text-forest-900 transition-colors">
                Option 1: Use the step-by-step guide
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Answer a few simple questions about your farm, one step at a time.
              </p>
            </div>

            <ul className="text-xs text-stone-600 space-y-2 pt-3 border-t border-stone-100">
              <li className="flex items-center gap-2">
                <CheckCircleIcon size={14} className="text-forest-700 shrink-0" />
                <span>One focused question per screen</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircleIcon size={14} className="text-forest-700 shrink-0" />
                <span>Interactive satellite field map with adjustable pin</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircleIcon size={14} className="text-forest-700 shrink-0" />
                <span>Visual soil feel test and Punjab land area conversions</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => onSelectMode("field-guide")}
            className="w-full py-3 px-4 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-semibold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <span>Start step-by-step guide</span>
            <ChevronRightIcon size={16} />
          </button>
        </div>

        {/* OPTION 2: Start a Conversation */}
        <div className="rounded-2xl border-2 border-stone-200 hover:border-forest-700 bg-white p-6 sm:p-7 flex flex-col justify-between space-y-6 shadow-xs hover:shadow-md transition-all group">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-forest-50 text-forest-800 border border-forest-200/70 flex items-center justify-center group-hover:bg-forest-800 group-hover:text-white transition-colors">
                <SproutIcon size={22} />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-forest-800 bg-forest-50 px-2.5 py-1 rounded-full border border-forest-200/60 font-semibold">
                Guided Dialogue
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 group-hover:text-forest-900 transition-colors">
                Option 2: Start a conversation
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Tell us about your farm naturally, and we'll guide you through the details.
              </p>
            </div>

            <ul className="text-xs text-stone-600 space-y-2 pt-3 border-t border-stone-100">
              <li className="flex items-center gap-2">
                <CheckCircleIcon size={14} className="text-forest-700 shrink-0" />
                <span>Conversational flow with Sproutnik assistant</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircleIcon size={14} className="text-forest-700 shrink-0" />
                <span>Helpful suggested reply chips and natural responses</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircleIcon size={14} className="text-forest-700 shrink-0" />
                <span>Live synchronized farm profile summary</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => onSelectMode("conversation")}
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-stone-50 text-forest-800 border-2 border-forest-800 font-semibold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <span>Start guided conversation</span>
            <ChevronRightIcon size={16} />
          </button>
        </div>
      </div>

      {/* Reassurance Footer Callout */}
      <div className="p-4 rounded-xl bg-white border border-stone-200 flex items-start gap-3 text-xs text-stone-600 leading-relaxed">
        <InfoIcon size={16} className="text-forest-700 shrink-0 mt-0.5" />
        <p>
          You can skip questions you are unsure about and update your answers at any time. Both options use the same underlying farm profile and preserve your progress when switching.
        </p>
      </div>
    </div>
  );
}
