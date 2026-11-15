import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  initializeProfileLifecycle,
  updateActiveProfile,
  createActiveProfile,
  clearActiveProfile,
  _resetLifecycleStateForTesting,
  extractCanonicalCreationPayload,
} from "../src/services/profileLifecycle";
import { StoredProfileEnvelope } from "../src/services/profileStorage";
import { createKnownField, FarmerProfile } from "../src/types";

describe("Farmer Profile Lifecycle & Recovery Engine", () => {
  const sampleProfile: FarmerProfile = {
    profileId: "profile_stale_12345",
    location: createKnownField({
      latitude: 30.9,
      longitude: 75.85,
      district: "Ludhiana",
      countryCode: "IN",
      selectionMethod: "gps" as const,
    }),
    landAreaHectares: createKnownField(2.5),
    soilTexture: createKnownField("loam" as const),
    irrigationAvailable: createKnownField(true),
    irrigationSource: createKnownField("tubewell_deep" as const),
    currentCrops: createKnownField(["paddy_transplanted", "bread_wheat"]),
    farmingGoals: createKnownField(["reduce_water_usage" as const, "improve_soil_health" as const]),
    createdAt: "2026-11-14T10:00:00.000Z",
    updatedAt: "2026-11-14T10:00:00.000Z",
  };

  const sampleEnvelope: StoredProfileEnvelope<FarmerProfile> = {
    schemaVersion: 1,
    profileId: "profile_stale_12345",
    profile: sampleProfile,
    savedAt: "2026-11-14T10:00:00.000Z",
  };

  beforeEach(() => {
    _resetLifecycleStateForTesting();
    vi.restoreAllMocks();
  });

  it("1. preserves clean state when no profile exists in storage", async () => {
    const mockReadEnvelope = vi.fn().mockReturnValue({
      success: false,
      reason: "NO_STORED_PROFILE" as const,
    });
    const mockFetchProfile = vi.fn();
    const mockCreateProfile = vi.fn();

    const state = await initializeProfileLifecycle({
      readEnvelope: mockReadEnvelope,
      fetchProfile: mockFetchProfile,
      createProfile: mockCreateProfile,
    });

    expect(state.syncStatus).toBe("no_profile");
    expect(state.profile).toBeNull();
    expect(state.profileId).toBeNull();
    expect(state.isSynchronized).toBe(false);
    expect(state.recoveryOccurred).toBe(false);
    expect(mockFetchProfile).not.toHaveBeenCalled();
    expect(mockCreateProfile).not.toHaveBeenCalled();
  });

  it("2. retrieves and refreshes existing profile when backend verification succeeds", async () => {
    const canonicalServerProfile: FarmerProfile = {
      ...sampleProfile,
      updatedAt: "2026-11-15T01:00:00.000Z",
    };

    const mockReadEnvelope = vi.fn().mockReturnValue({
      success: true,
      envelope: sampleEnvelope,
    });
    const mockWriteEnvelope = vi.fn().mockReturnValue({ success: true });
    const mockFetchProfile = vi.fn().mockResolvedValue({
      success: true,
      data: canonicalServerProfile,
    });
    const mockCreateProfile = vi.fn();

    const state = await initializeProfileLifecycle({
      readEnvelope: mockReadEnvelope,
      writeEnvelope: mockWriteEnvelope,
      fetchProfile: mockFetchProfile,
      createProfile: mockCreateProfile,
    });

    expect(mockFetchProfile).toHaveBeenCalledWith("profile_stale_12345");
    expect(mockCreateProfile).not.toHaveBeenCalled();
    expect(mockWriteEnvelope).toHaveBeenCalledWith(
      expect.objectContaining({
        schemaVersion: 1,
        profileId: "profile_stale_12345",
        profile: canonicalServerProfile,
      })
    );
    expect(state.syncStatus).toBe("synced");
    expect(state.isSynchronized).toBe(true);
    expect(state.profileId).toBe("profile_stale_12345");
    expect(state.recoveryOccurred).toBe(false);
  });

  it("3. automatically recovers profile via POST when backend returns 404 PROFILE_NOT_FOUND", async () => {
    const recreatedServerProfile: FarmerProfile = {
      ...sampleProfile,
      profileId: "profile_new_uuid_67890",
      createdAt: "2026-11-15T02:00:00.000Z",
      updatedAt: "2026-11-15T02:00:00.000Z",
    };

    const mockReadEnvelope = vi.fn().mockReturnValue({
      success: true,
      envelope: sampleEnvelope,
    });
    const mockWriteEnvelope = vi.fn().mockReturnValue({ success: true });
    const mockFetchProfile = vi.fn().mockResolvedValue({
      success: false,
      error: {
        code: "PROFILE_NOT_FOUND",
        message: 'Farmer profile with ID "profile_stale_12345" was not found.',
      },
    });
    const mockCreateProfile = vi.fn().mockResolvedValue({
      success: true,
      data: recreatedServerProfile,
    });

    const state = await initializeProfileLifecycle({
      readEnvelope: mockReadEnvelope,
      writeEnvelope: mockWriteEnvelope,
      fetchProfile: mockFetchProfile,
      createProfile: mockCreateProfile,
    });

    expect(mockFetchProfile).toHaveBeenCalledWith("profile_stale_12345");
    expect(mockCreateProfile).toHaveBeenCalledTimes(1);

    // Verify canonical creation payload excludes stale client identity
    const creationCallArg = mockCreateProfile.mock.calls[0][0];
    expect(creationCallArg.profileId).toBeUndefined();
    expect(creationCallArg.createdAt).toBeUndefined();
    expect(creationCallArg.landAreaHectares).toEqual(sampleProfile.landAreaHectares);
    expect(creationCallArg.soilTexture).toEqual(sampleProfile.soilTexture);

    expect(state.syncStatus).toBe("recreated");
    expect(state.isSynchronized).toBe(true);
    expect(state.recoveryOccurred).toBe(true);
    expect(state.profileId).toBe("profile_new_uuid_67890");
  });

  it("4. replaces stale cached profile ID in localStorage with new server-issued UUID", async () => {
    const recreatedServerProfile: FarmerProfile = {
      ...sampleProfile,
      profileId: "profile_new_uuid_67890",
    };

    const mockReadEnvelope = vi.fn().mockReturnValue({
      success: true,
      envelope: sampleEnvelope,
    });
    const mockWriteEnvelope = vi.fn().mockReturnValue({ success: true });
    const mockFetchProfile = vi.fn().mockResolvedValue({
      success: false,
      error: { code: "PROFILE_NOT_FOUND", message: "Not found" },
    });
    const mockCreateProfile = vi.fn().mockResolvedValue({
      success: true,
      data: recreatedServerProfile,
    });

    await initializeProfileLifecycle({
      readEnvelope: mockReadEnvelope,
      writeEnvelope: mockWriteEnvelope,
      fetchProfile: mockFetchProfile,
      createProfile: mockCreateProfile,
    });

    expect(mockWriteEnvelope).toHaveBeenCalledWith(
      expect.objectContaining({
        schemaVersion: 1,
        profileId: "profile_new_uuid_67890",
        profile: recreatedServerProfile,
      })
    );
  });

  it("5. ensures subsequent PATCH requests use the newly rotated profile ID after recovery", async () => {
    const recreatedServerProfile: FarmerProfile = {
      ...sampleProfile,
      profileId: "profile_rotated_uuid_99999",
    };
    const patchedServerProfile: FarmerProfile = {
      ...recreatedServerProfile,
      landAreaHectares: createKnownField(4.0),
      updatedAt: "2026-11-15T02:05:00.000Z",
    };

    const mockReadEnvelope = vi.fn().mockReturnValue({
      success: true,
      envelope: sampleEnvelope,
    });
    const mockWriteEnvelope = vi.fn().mockReturnValue({ success: true });
    const mockFetchProfile = vi.fn().mockResolvedValue({
      success: false,
      error: { code: "PROFILE_NOT_FOUND", message: "Not found" },
    });
    const mockCreateProfile = vi.fn().mockResolvedValue({
      success: true,
      data: recreatedServerProfile,
    });
    const mockUpdateProfile = vi.fn().mockResolvedValue({
      success: true,
      data: patchedServerProfile,
    });

    // 1. Recover
    const initState = await initializeProfileLifecycle({
      readEnvelope: mockReadEnvelope,
      writeEnvelope: mockWriteEnvelope,
      fetchProfile: mockFetchProfile,
      createProfile: mockCreateProfile,
    });
    expect(initState.profileId).toBe("profile_rotated_uuid_99999");

    // 2. Perform subsequent PATCH
    const newAreaField = createKnownField(4.0);
    const patchState = await updateActiveProfile(
      { landAreaHectares: newAreaField },
      {
        writeEnvelope: mockWriteEnvelope,
        updateProfile: mockUpdateProfile,
      }
    );

    // Verify update was dispatched with NEW profileId, NOT the stale one!
    expect(mockUpdateProfile).toHaveBeenCalledWith(
      "profile_rotated_uuid_99999",
      expect.objectContaining({ landAreaHectares: newAreaField })
    );
    expect(patchState.syncStatus).toBe("synced");
    expect(patchState.isSynchronized).toBe(true);
    expect(patchState.profile?.landAreaHectares.status).toBe("known");
    expect((patchState.profile?.landAreaHectares as any).value).toBe(4.0);
  });

  it("6. preserves cached profile in 'offline' state and does NOT recreate on network errors", async () => {
    const mockReadEnvelope = vi.fn().mockReturnValue({
      success: true,
      envelope: sampleEnvelope,
    });
    const mockFetchProfile = vi.fn().mockResolvedValue({
      success: false,
      error: {
        code: "NETWORK_REQUEST_FAILED",
        message: "Failed to fetch: net::ERR_CONNECTION_REFUSED",
      },
    });
    const mockCreateProfile = vi.fn();

    const state = await initializeProfileLifecycle({
      readEnvelope: mockReadEnvelope,
      fetchProfile: mockFetchProfile,
      createProfile: mockCreateProfile,
    });

    // CRITICAL: Must NEVER recreate on network dropouts!
    expect(mockCreateProfile).not.toHaveBeenCalled();
    expect(state.syncStatus).toBe("offline");
    expect(state.isSynchronized).toBe(false);
    expect(state.profile).toEqual(sampleProfile);
    expect(state.profileId).toBe("profile_stale_12345");
    expect(state.recoveryOccurred).toBe(false);
  });

  it("7. preserves cached profile in 'unsynced_error' state and does NOT recreate on 500 errors", async () => {
    const mockReadEnvelope = vi.fn().mockReturnValue({
      success: true,
      envelope: sampleEnvelope,
    });
    const mockFetchProfile = vi.fn().mockResolvedValue({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Database connection failed on server.",
      },
    });
    const mockCreateProfile = vi.fn();

    const state = await initializeProfileLifecycle({
      readEnvelope: mockReadEnvelope,
      fetchProfile: mockFetchProfile,
      createProfile: mockCreateProfile,
    });

    // CRITICAL: Must NEVER recreate on 5xx server downtime!
    expect(mockCreateProfile).not.toHaveBeenCalled();
    expect(state.syncStatus).toBe("unsynced_error");
    expect(state.isSynchronized).toBe(false);
    expect(state.profile).toEqual(sampleProfile);
    expect(state.recoveryOccurred).toBe(false);
  });

  it("8. gracefully handles invalid or corrupted cached envelopes without crashing", async () => {
    const mockReadEnvelope = vi.fn().mockReturnValue({
      success: false,
      reason: "MALFORMED_JSON" as const,
    });
    const mockFetchProfile = vi.fn();
    const mockCreateProfile = vi.fn();

    const state = await initializeProfileLifecycle({
      readEnvelope: mockReadEnvelope,
      fetchProfile: mockFetchProfile,
      createProfile: mockCreateProfile,
    });

    expect(state.syncStatus).toBe("unsynced_error");
    expect(state.profile).toBeNull();
    expect(state.isSynchronized).toBe(false);
    expect(mockFetchProfile).not.toHaveBeenCalled();
    expect(mockCreateProfile).not.toHaveBeenCalled();
  });

  it("9. exposes explicit error state and never claims synced if automatic recreation fails", async () => {
    const mockReadEnvelope = vi.fn().mockReturnValue({
      success: true,
      envelope: sampleEnvelope,
    });
    const mockFetchProfile = vi.fn().mockResolvedValue({
      success: false,
      error: { code: "PROFILE_NOT_FOUND", message: "Not found" },
    });
    const mockCreateProfile = vi.fn().mockResolvedValue({
      success: false,
      error: {
        code: "INVALID_PROFILE_INPUT",
        message: "Server rejected recreation payload.",
      },
    });

    const state = await initializeProfileLifecycle({
      readEnvelope: mockReadEnvelope,
      fetchProfile: mockFetchProfile,
      createProfile: mockCreateProfile,
    });

    expect(state.syncStatus).toBe("unsynced_error");
    expect(state.isSynchronized).toBe(false);
    expect(state.recoveryOccurred).toBe(false);
    expect(state.profile).toEqual(sampleProfile);
    expect(state.error?.code).toBe("INVALID_PROFILE_INPUT");
  });

  it("10. prevents duplicate profile creation during concurrent initialization calls", async () => {
    const recreatedServerProfile: FarmerProfile = {
      ...sampleProfile,
      profileId: "profile_concurrent_uuid_111",
    };

    const mockReadEnvelope = vi.fn().mockReturnValue({
      success: true,
      envelope: sampleEnvelope,
    });
    const mockWriteEnvelope = vi.fn().mockReturnValue({ success: true });
    const mockFetchProfile = vi.fn().mockImplementation(async () => {
      // Simulate small network delay
      await new Promise((r) => setTimeout(r, 10));
      return {
        success: false,
        error: { code: "PROFILE_NOT_FOUND", message: "Not found" },
      };
    });
    const mockCreateProfile = vi.fn().mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 10));
      return {
        success: true,
        data: recreatedServerProfile,
      };
    });

    // Execute 3 concurrent initializations simultaneously
    const [state1, state2, state3] = await Promise.all([
      initializeProfileLifecycle({
        readEnvelope: mockReadEnvelope,
        writeEnvelope: mockWriteEnvelope,
        fetchProfile: mockFetchProfile,
        createProfile: mockCreateProfile,
      }),
      initializeProfileLifecycle({
        readEnvelope: mockReadEnvelope,
        writeEnvelope: mockWriteEnvelope,
        fetchProfile: mockFetchProfile,
        createProfile: mockCreateProfile,
      }),
      initializeProfileLifecycle({
        readEnvelope: mockReadEnvelope,
        writeEnvelope: mockWriteEnvelope,
        fetchProfile: mockFetchProfile,
        createProfile: mockCreateProfile,
      }),
    ]);

    // Guarantees exact single execution of fetch and create
    expect(mockFetchProfile).toHaveBeenCalledTimes(1);
    expect(mockCreateProfile).toHaveBeenCalledTimes(1);

    expect(state1.profileId).toBe("profile_concurrent_uuid_111");
    expect(state2.profileId).toBe("profile_concurrent_uuid_111");
    expect(state3.profileId).toBe("profile_concurrent_uuid_111");
    expect(state1.syncStatus).toBe("recreated");
    expect(state2.syncStatus).toBe("recreated");
    expect(state3.syncStatus).toBe("recreated");
  });

  it("11. helper extractCanonicalCreationPayload strips client-issued identity and timestamps", () => {
    const payload = extractCanonicalCreationPayload(sampleProfile);
    expect((payload as Record<string, unknown>).profileId).toBeUndefined();
    expect((payload as Record<string, unknown>).createdAt).toBeUndefined();
    expect((payload as Record<string, unknown>).updatedAt).toBeUndefined();
    expect(payload.location).toEqual(sampleProfile.location);
    expect(payload.soilTexture).toEqual(sampleProfile.soilTexture);
  });
});
