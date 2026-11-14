"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  OnboardingState,
  INITIAL_ONBOARDING_STATE,
  mapOnboardingToFarmerProfile,
} from "@/types/onboarding";
import { UnifiedWelcomeScreen } from "./UnifiedWelcomeScreen";
import { OnboardingFieldGuide } from "./OnboardingFieldGuide";
import { OnboardingConversational } from "./OnboardingConversational";

export function OnboardingHarness() {
  const router = useRouter();
  const [onboardingState, setOnboardingState] = useState<OnboardingState>(
    INITIAL_ONBOARDING_STATE
  );
  const [selectedLocale, setSelectedLocale] = useState<"en" | "pa" | "hi">("en");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlMode = params.get("mode");
      const urlStep = params.get("step");
      const urlLocale = params.get("lang");
      if (urlMode === "field-guide" || urlMode === "conversation" || urlMode === "welcome") {
        setOnboardingState((prev) => ({
          ...prev,
          mode: urlMode,
          currentStepIndex: urlStep !== null ? parseInt(urlStep, 10) : prev.currentStepIndex,
        }));
      }
      if (urlLocale === "en" || urlLocale === "pa" || urlLocale === "hi") {
        setSelectedLocale(urlLocale);
      }
    }
  }, []);

  const handleReturnToDashboard = () => {
    router.push("/");
  };

  const handleComplete = () => {
    // Generate the canonical FarmerProfile
    const profile = mapOnboardingToFarmerProfile(onboardingState);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("sproutnik_farmer_profile", JSON.stringify(profile));
      } catch {
        // Safe fallback
      }
    }
    router.push("/");
  };

  const isLocationWorkspaceStep =
    onboardingState.mode === "field-guide" && onboardingState.currentStepIndex === 0;

  return (
    <div className="min-h-screen bg-[#faf9f5] text-stone-900 flex flex-col justify-between selection:bg-forest-100 selection:text-forest-900">
      {/* Active Mode Render */}
      <main className="flex-1 flex flex-col">
        {onboardingState.mode === "welcome" && (
          <UnifiedWelcomeScreen
            onSelectMode={(mode) =>
              setOnboardingState((prev) => ({
                ...prev,
                mode,
                currentStepIndex: 0,
              }))
            }
            onReturnToDashboard={handleReturnToDashboard}
            locale={selectedLocale}
          />
        )}

        {onboardingState.mode === "field-guide" && (
          <OnboardingFieldGuide
            state={onboardingState}
            onChange={setOnboardingState}
            onSwitchToConversation={() =>
              setOnboardingState((prev) => ({ ...prev, mode: "conversation" }))
            }
            onComplete={handleComplete}
            onExit={handleReturnToDashboard}
          />
        )}

        {onboardingState.mode === "conversation" && (
          <OnboardingConversational
            state={onboardingState}
            onChange={setOnboardingState}
            onSwitchToFieldGuide={() =>
              setOnboardingState((prev) => ({ ...prev, mode: "field-guide" }))
            }
            onComplete={handleComplete}
            onExit={handleReturnToDashboard}
          />
        )}
      </main>

      {/* Subtle Mode Switcher & Language Footer */}
      {!isLocationWorkspaceStep && (
        <footer className="border-t border-stone-200/80 bg-white/90 backdrop-blur-xs py-3 px-4 text-xs text-stone-500">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-stone-700">Mode:</span>
                <span className="font-mono bg-stone-100 text-stone-800 px-2 py-0.5 rounded border border-stone-200 capitalize">
                  {onboardingState.mode.replace("-", " ")}
                </span>
              </div>

              {onboardingState.mode !== "welcome" && (
                <button
                  type="button"
                  onClick={() =>
                    setOnboardingState((prev) => ({ ...prev, mode: "welcome" }))
                  }
                  className="hover:text-stone-900 underline underline-offset-4"
                >
                  Return to welcome
                </button>
              )}
            </div>

            {/* Language Switcher Pill */}
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-stone-400">Language:</span>
              <button
                type="button"
                onClick={() => setSelectedLocale("en")}
                className={`px-2 py-0.5 rounded font-medium ${selectedLocale === "en"
                    ? "bg-forest-800 text-white font-bold"
                    : "text-stone-600 hover:text-stone-900 bg-stone-100"
                  }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setSelectedLocale("pa")}
                className={`px-2 py-0.5 rounded font-medium ${selectedLocale === "pa"
                    ? "bg-forest-800 text-white font-bold"
                    : "text-stone-600 hover:text-stone-900 bg-stone-100"
                  }`}
              >
                ਪੰਜਾਬੀ
              </button>
              <button
                type="button"
                onClick={() => setSelectedLocale("hi")}
                className={`px-2 py-0.5 rounded font-medium ${selectedLocale === "hi"
                    ? "bg-forest-800 text-white font-bold"
                    : "text-stone-600 hover:text-stone-900 bg-stone-100"
                  }`}
              >
                हिन्दी
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
