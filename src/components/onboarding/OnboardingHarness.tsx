"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  OnboardingState,
  INITIAL_ONBOARDING_STATE,
  mapOnboardingToFarmerProfile,
} from "@/types/onboarding";
import { FarmerProfile } from "@/types";
import {
  loadStoredProfile,
  saveStoredProfile,
  loadOnboardingDraft,
  saveOnboardingDraft,
  clearOnboardingDraft,
  OnboardingDraftRawState,
} from "@/services/profileStorage";
import {
  createFarmerProfile,
  getFarmerProfile,
  updateFarmerProfile,
} from "@/services/api";
import { UnifiedWelcomeScreen } from "./UnifiedWelcomeScreen";
import { OnboardingFieldGuide } from "./OnboardingFieldGuide";
import { OnboardingConversational } from "./OnboardingConversational";

export type ProfileSyncStatus =
  | "idle"
  | "saving"
  | "saved_remote"
  | "saved_local"
  | "waiting_connection"
  | "error";

export function OnboardingHarness() {
  const router = useRouter();
  const [onboardingState, setOnboardingState] = useState<OnboardingState>(
    INITIAL_ONBOARDING_STATE
  );
  const [selectedLocale, setSelectedLocale] = useState<"en" | "pa" | "hi">("en");
  const [profileId, setProfileId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<ProfileSyncStatus>("idle");
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);
  const isHydratedRef = useRef(false);

  // Helper to hydrate state from canonical FarmerProfile
  const hydrateFromProfile = (prof: FarmerProfile, existingId: string) => {
    setOnboardingState((prev) => {
      const nextState: OnboardingState = { ...prev };

      // Location
      if (prof.location?.status === "known" && prof.location.value) {
        nextState.location = {
          latitude: prof.location.value.latitude ?? 30.9,
          longitude: prof.location.value.longitude ?? 75.85,
          name: prof.location.value.name,
          district: prof.location.value.district,
          state: prof.location.value.state,
          country: prof.location.value.country,
          elevationMeters: prof.location.value.elevationMeters,
        };
        nextState.locationStatus = "known";
        nextState.isDemonstrationLocation =
          Boolean(prof.location.value.isDemonstration);
      } else if (prof.location?.status) {
        nextState.locationStatus = prof.location.status;
      }

      // Land Area (stored in hectares)
      if (prof.landAreaHectares?.status === "known" && typeof prof.landAreaHectares.value === "number") {
        nextState.landArea = prof.landAreaHectares.value;
        nextState.landUnit = "hectares";
        nextState.landAreaStatus = "known";
      } else if (prof.landAreaHectares?.status) {
        nextState.landAreaStatus = prof.landAreaHectares.status;
      }

      // Soil Texture
      if (prof.soilTexture?.status === "known" && prof.soilTexture.value) {
        nextState.soilTexture = prof.soilTexture.value;
        nextState.soilStatus = "known";
      } else if (prof.soilTexture?.status) {
        nextState.soilStatus = prof.soilTexture.status;
      }

      // Irrigation Source
      if (prof.irrigationSource?.status === "known" && prof.irrigationSource.value) {
        nextState.irrigationSource = prof.irrigationSource.value;
        nextState.irrigationStatus = "known";
      } else if (prof.irrigationSource?.status) {
        nextState.irrigationStatus = prof.irrigationSource.status;
      }

      // Current Crops
      if (prof.currentCrops?.status === "known" && Array.isArray(prof.currentCrops.value)) {
        nextState.currentCrops = prof.currentCrops.value;
        nextState.cropsStatus = "known";
      } else if (prof.currentCrops?.status) {
        nextState.cropsStatus = prof.currentCrops.status;
      }

      // Farming Goals
      if (prof.farmingGoals?.status === "known" && Array.isArray(prof.farmingGoals.value)) {
        nextState.farmingGoals = prof.farmingGoals.value;
        nextState.goalsStatus = "known";
      } else if (prof.farmingGoals?.status) {
        nextState.goalsStatus = prof.farmingGoals.status;
      }

      return nextState;
    });
    setProfileId(existingId);
  };

  // Helper to hydrate state from pending draft (including UI rawState)
  const hydrateFromDraft = (draft: FarmerProfile, rawState?: OnboardingDraftRawState) => {
    setOnboardingState((prev) => {
      const nextState: OnboardingState = { ...prev };

      if (rawState?.mode === "field-guide" || rawState?.mode === "conversation" || rawState?.mode === "welcome") {
        nextState.mode = rawState.mode;
      }
      if (typeof rawState?.currentStepIndex === "number") {
        nextState.currentStepIndex = rawState.currentStepIndex;
      }
      if (rawState?.landUnit === "acres" || rawState?.landUnit === "kanals" || rawState?.landUnit === "bighas" || rawState?.landUnit === "hectares") {
        nextState.landUnit = rawState.landUnit;
      }
      if (typeof rawState?.isDemonstrationLocation === "boolean") {
        nextState.isDemonstrationLocation = rawState.isDemonstrationLocation;
      }

      // Location
      if (draft.location?.status === "known" && draft.location.value) {
        nextState.location = {
          latitude: draft.location.value.latitude ?? 30.9,
          longitude: draft.location.value.longitude ?? 75.85,
          name: draft.location.value.name,
          district: draft.location.value.district,
          state: draft.location.value.state,
          country: draft.location.value.country,
          elevationMeters: draft.location.value.elevationMeters,
        };
        nextState.locationStatus = "known";
        if (typeof draft.location.value.isDemonstration === "boolean") {
          nextState.isDemonstrationLocation = draft.location.value.isDemonstration;
        }
      } else if (draft.location?.status) {
        nextState.locationStatus = draft.location.status;
      }

      // Land Area
      if (draft.landAreaHectares?.status === "known" && typeof draft.landAreaHectares.value === "number") {
        nextState.landArea = draft.landAreaHectares.value;
        if (!rawState?.landUnit) nextState.landUnit = "hectares";
        nextState.landAreaStatus = "known";
      } else if (draft.landAreaHectares?.status) {
        nextState.landAreaStatus = draft.landAreaHectares.status;
      }

      // Soil Texture
      if (draft.soilTexture?.status === "known" && draft.soilTexture.value) {
        nextState.soilTexture = draft.soilTexture.value;
        nextState.soilStatus = "known";
      } else if (draft.soilTexture?.status) {
        nextState.soilStatus = draft.soilTexture.status;
      }

      // Irrigation Source
      if (draft.irrigationSource?.status === "known" && draft.irrigationSource.value) {
        nextState.irrigationSource = draft.irrigationSource.value;
        nextState.irrigationStatus = "known";
      } else if (draft.irrigationSource?.status) {
        nextState.irrigationStatus = draft.irrigationSource.status;
      }

      // Current Crops
      if (draft.currentCrops?.status === "known" && Array.isArray(draft.currentCrops.value)) {
        nextState.currentCrops = draft.currentCrops.value;
        nextState.cropsStatus = "known";
      } else if (draft.currentCrops?.status) {
        nextState.cropsStatus = draft.currentCrops.status;
      }

      // Farming Goals
      if (draft.farmingGoals?.status === "known" && Array.isArray(draft.farmingGoals.value)) {
        nextState.farmingGoals = draft.farmingGoals.value;
        nextState.goalsStatus = "known";
      } else if (draft.farmingGoals?.status) {
        nextState.goalsStatus = draft.farmingGoals.status;
      }

      return nextState;
    });
  };

  // Phase 7 Lifecycle: Initial mount hydration with safe conflict resolution
  useEffect(() => {
    if (isHydratedRef.current) return;
    isHydratedRef.current = true;

    // 1. Read URL query parameters first
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

    // 2. Read stored profile envelope and pending draft
    const stored = loadStoredProfile();
    const draft = loadOnboardingDraft();

    if (stored && stored.profileId && draft) {
      // Conflict resolution: compare timestamps
      const storedTime = Date.parse(stored.savedAt);
      const draftTime = Date.parse(draft.savedAt);

      if (!isNaN(draftTime) && !isNaN(storedTime) && draftTime > storedTime) {
        // Draft has newer local edits than the finalized profile
        hydrateFromDraft(draft.draft, draft.rawState);
        setProfileId(stored.profileId);
        setSyncStatus("saved_local");
      } else {
        // Finalized profile is more recent or equal
        setProfileId(stored.profileId);
        hydrateFromProfile(stored.profile, stored.profileId);
        setSyncStatus("saved_remote");
      }

      // Sync latest from backend if available
      getFarmerProfile(stored.profileId)
        .then((res) => {
          if (res.success) {
            const remoteTime = Date.parse(res.data.updatedAt ?? "");
            if (isNaN(draftTime) || remoteTime > draftTime) {
              hydrateFromProfile(res.data, stored.profileId);
              saveStoredProfile(stored.profileId, res.data);
              setSyncStatus("saved_remote");
            }
          } else if (res.error.code === "PROFILE_NOT_FOUND" || res.error.code === "HTTP_404") {
            // Ephemeral server state reset; local data is preserved and will re-sync on completion
            setSyncStatus("saved_local");
          }
        })
        .catch(() => { });
    } else if (stored && stored.profileId) {
      // Only stored finalized profile exists
      setProfileId(stored.profileId);
      hydrateFromProfile(stored.profile, stored.profileId);
      setSyncStatus("saved_remote");

      getFarmerProfile(stored.profileId)
        .then((res) => {
          if (res.success) {
            hydrateFromProfile(res.data, stored.profileId);
            saveStoredProfile(stored.profileId, res.data);
          } else if (res.error.code === "PROFILE_NOT_FOUND" || res.error.code === "HTTP_404") {
            setSyncStatus("saved_local");
          }
        })
        .catch(() => { });
    } else if (draft) {
      // Only pending local draft exists (unauthenticated / offline onboarding)
      hydrateFromDraft(draft.draft, draft.rawState);
      setProfileId(null);
      setSyncStatus("saved_local");
    }
  }, []);

  // Continuous auto-saving of draft on state change (debounced 400ms)
  useEffect(() => {
    if (!isHydratedRef.current) return;

    const timer = setTimeout(() => {
      const { backendProfile } = mapOnboardingToFarmerProfile(onboardingState);
      saveOnboardingDraft(backendProfile, {
        mode: onboardingState.mode,
        currentStepIndex: onboardingState.currentStepIndex,
        landUnit: onboardingState.landUnit,
        isDemonstrationLocation: onboardingState.isDemonstrationLocation,
      });
      if (syncStatus === "idle") {
        setSyncStatus("saved_local");
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [onboardingState]);

  const handleReturnToDashboard = () => {
    router.push("/");
  };

  // Completion lifecycle with real API contract connection
  const handleComplete = async () => {
    if (syncStatus === "saving") return;
    setSyncStatus("saving");
    setSyncErrorMessage(null);

    const { backendProfile } = mapOnboardingToFarmerProfile(onboardingState);

    try {
      if (!profileId) {
        // Initial creation via POST /api/farmer-profile
        const res = await createFarmerProfile(backendProfile);
        if (res.success) {
          const newId = res.data?.profileId;
          if (newId) {
            const remoteProfile: FarmerProfile = res.data?.profile ?? {
              ...backendProfile,
              ...res.data,
              profileId: newId,
            };
            setProfileId(newId);
            saveStoredProfile(newId, remoteProfile);
            // Clear pending draft ONLY after successful cloud confirmation
            clearOnboardingDraft();
            setSyncStatus("saved_remote");
            router.push("/");
          } else {
            setSyncStatus("error");
            setSyncErrorMessage("Remote profile response was missing profileId.");
          }
        } else {
          // Backend returned non-2xx or validation failure:
          // Preserve pending draft with latest inputs without inventing a profile ID.
          saveOnboardingDraft(backendProfile, {
            mode: onboardingState.mode,
            currentStepIndex: onboardingState.currentStepIndex,
            landUnit: onboardingState.landUnit,
            isDemonstrationLocation: onboardingState.isDemonstrationLocation,
          });
          setSyncStatus("error");
          const errorDetails = Array.isArray(res.error?.details)
            ? res.error.details.map((d: any) => `${d.field}: ${d.message}`).join(", ")
            : null;
          setSyncErrorMessage(
            errorDetails
              ? `${res.error?.message ?? "Profile validation failed"}: ${errorDetails}`
              : (res.error?.message ?? "Unable to create profile on remote server. Changes saved to this device.")
          );
        }
      } else {
        // Update existing profile via PATCH /api/farmer-profile/{profileId}
        const res = await updateFarmerProfile(profileId, backendProfile);
        if (res.success) {
          const updatedProfile: FarmerProfile = res.data ?? {
            ...backendProfile,
            profileId,
          };
          saveStoredProfile(profileId, updatedProfile);
          clearOnboardingDraft();
          setSyncStatus("saved_remote");
          router.push("/");
        } else if (res.error?.code === "PROFILE_NOT_FOUND" || res.error?.code === "HTTP_404") {
          // Stale profile ID after server restart: recover transparently by creating new profile
          const createRes = await createFarmerProfile(backendProfile);
          if (createRes.success) {
            const newId = createRes.data.profileId;
            const remoteProfile: FarmerProfile = createRes.data.profile ?? {
              ...backendProfile,
              ...createRes.data,
              profileId: newId,
            };
            setProfileId(newId);
            saveStoredProfile(newId, remoteProfile);
            clearOnboardingDraft();
            setSyncStatus("saved_remote");
            router.push("/");
          } else {
            saveStoredProfile(profileId, backendProfile);
            setSyncStatus("saved_local");
            setSyncErrorMessage(
              createRes.error.message ?? "Profile session expired; saved locally."
            );
          }
        } else {
          // Update failed remotely; cache profile locally with known backend profileId
          saveStoredProfile(profileId, backendProfile);
          saveOnboardingDraft(backendProfile, {
            mode: onboardingState.mode,
            currentStepIndex: onboardingState.currentStepIndex,
            landUnit: onboardingState.landUnit,
            isDemonstrationLocation: onboardingState.isDemonstrationLocation,
          });
          setSyncStatus("saved_local");
          setSyncErrorMessage(
            res.error?.message ?? "Remote update was unreachable; profile cached locally."
          );
        }
      }
    } catch (err) {
      // Save draft to guarantee zero data loss
      saveOnboardingDraft(backendProfile, {
        mode: onboardingState.mode,
        currentStepIndex: onboardingState.currentStepIndex,
        landUnit: onboardingState.landUnit,
        isDemonstrationLocation: onboardingState.isDemonstrationLocation,
      });
      setSyncStatus("error");
      setSyncErrorMessage(
        err instanceof Error ? err.message : "Unexpected error during profile save."
      );
    }
  };

  const handleProceedOffline = () => {
    // Guarantees current draft is written to storage before leaving
    const { backendProfile } = mapOnboardingToFarmerProfile(onboardingState);
    saveOnboardingDraft(backendProfile, {
      mode: onboardingState.mode,
      currentStepIndex: onboardingState.currentStepIndex,
      landUnit: onboardingState.landUnit,
      isDemonstrationLocation: onboardingState.isDemonstrationLocation,
    });
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
            locale={selectedLocale}
            syncStatus={syncStatus}
            syncErrorMessage={syncErrorMessage}
            onProceedOffline={handleProceedOffline}
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
            locale={selectedLocale}
            syncStatus={syncStatus}
            syncErrorMessage={syncErrorMessage}
            onProceedOffline={handleProceedOffline}
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
