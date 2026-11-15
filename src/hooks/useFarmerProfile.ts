"use client";

import { useCallback, useEffect, useState } from "react";
import { FarmerProfile } from "@/types";
import {
  initializeProfileLifecycle,
  updateActiveProfile,
  createActiveProfile,
  clearActiveProfile,
  getCurrentLifecycleState,
  ProfileLifecycleState,
  ProfileSyncStatus,
} from "@/services/profileLifecycle";
import { CreateFarmerProfileInput, UpdateFarmerProfileInput } from "@/services/api";

export interface UseFarmerProfileResult {
  profile: FarmerProfile | null;
  profileId: string | null;
  syncStatus: ProfileSyncStatus;
  isSynchronized: boolean;
  error: { code: string; message: string } | null;
  recoveryOccurred: boolean;
  lastSyncTimestamp: string | null;
  loading: boolean;
  refetch: () => Promise<void>;
  updateProfile: (updates: UpdateFarmerProfileInput) => Promise<boolean>;
  createProfile: (input: CreateFarmerProfileInput) => Promise<boolean>;
  clearProfile: () => void;
}

/**
 * React hook for consuming and updating the canonical farmer profile.
 * Automatically initializes profile verification and recovery on mount.
 */
export function useFarmerProfile(): UseFarmerProfileResult {
  const [state, setState] = useState<ProfileLifecycleState>(() => getCurrentLifecycleState());
  const [loading, setLoading] = useState<boolean>(true);

  const sync = useCallback(async () => {
    setLoading(true);
    try {
      const nextState = await initializeProfileLifecycle();
      setState(nextState);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    sync();
  }, [sync]);

  const handleUpdate = useCallback(async (updates: UpdateFarmerProfileInput): Promise<boolean> => {
    setLoading(true);
    try {
      const nextState = await updateActiveProfile(updates);
      setState(nextState);
      return nextState.isSynchronized;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreate = useCallback(async (input: CreateFarmerProfileInput): Promise<boolean> => {
    setLoading(true);
    try {
      const nextState = await createActiveProfile(input);
      setState(nextState);
      return nextState.isSynchronized;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleClear = useCallback(() => {
    const nextState = clearActiveProfile();
    setState(nextState);
  }, []);

  return {
    profile: state.profile,
    profileId: state.profileId,
    syncStatus: state.syncStatus,
    isSynchronized: state.isSynchronized,
    error: state.error,
    recoveryOccurred: state.recoveryOccurred,
    lastSyncTimestamp: state.lastSyncTimestamp,
    loading,
    refetch: sync,
    updateProfile: handleUpdate,
    createProfile: handleCreate,
    clearProfile: handleClear,
  };
}
