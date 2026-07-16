import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { projectStaticAccessibility } from "@/lib/civic-access/assets/static-projection-service";
import { resetCivicMemoryStore } from "@/lib/civic-access/memory-store";
import {
  PILOT_ASSET_KEYS,
  seedCivicPrecinctPilot,
} from "@/lib/civic-access/pilot/pilot-seed";

describe("civic precinct pilot seed", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("MAPABLE_CIVIC_ENABLED", "true");
    vi.stubEnv("MAPABLE_CIVIC_ASSET_REGISTRY_ENABLED", "true");
    vi.stubEnv("MAPABLE_CIVIC_USE_MEMORY", "true");
    resetCivicMemoryStore();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    resetCivicMemoryStore();
  });

  it("seeds the controlled precinct without enabling public surfaces", async () => {
    const result = await seedCivicPrecinctPilot();
    expect(result.assetCount).toBe(Object.keys(PILOT_ASSET_KEYS).length);
    expect(result.publicObservatory).toBe(false);
    expect(result.liveIncidents).toBe(false);
    expect(result.simulation).toBe(false);
    expect(result.participantJourneyAccess).toBe(false);
    expect(result.source.licenceCount).toBeGreaterThan(0);

    const civic = result.assets.civicBuilding;
    expect(civic.accessPlaceId).toBeTruthy();
    expect(
      civic.externalReferences.some((r) => r.system === "access_place")
    ).toBe(true);

    const projection = await projectStaticAccessibility(civic.id);
    expect(projection.unknownClaimCount).toBeGreaterThan(0);
    expect(projection.staleClaimCount).toBeGreaterThan(0);

    const again = await seedCivicPrecinctPilot();
    expect(again.assetCount).toBe(result.assetCount);
  });
});
