import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { registerCivicAsset } from "@/lib/civic-access/assets/asset-registry-service";
import { projectStaticAccessibility } from "@/lib/civic-access/assets/static-projection-service";
import { resetCivicMemoryStore } from "@/lib/civic-access/memory-store";

describe("static accessibility projection", () => {
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

  it("preserves unknown, stale, and disputed claims", async () => {
    const asset = await registerCivicAsset({
      stableKey: "proj.civic",
      accessPlaceId: "place_civic",
      assetClass: "buildings_services",
      assetType: "council_office",
      title: "Civic Hall",
      geometry: { type: "Point", coordinates: [151, -33] },
      accessibilityClaims: [
        {
          claimKey: "step_free_entry",
          label: "Step-free",
          state: "evidenced",
          sourceDate: "2026-06-01",
        },
        {
          claimKey: "toilet",
          label: "Toilet",
          state: "stale",
          sourceDate: "2023-01-01",
        },
        {
          claimKey: "loop",
          label: "Hearing loop",
          state: "unknown",
        },
        {
          claimKey: "parking",
          label: "Parking",
          state: "disputed",
          sourceDate: "2026-05-01",
        },
      ],
    });

    const projection = await projectStaticAccessibility(asset.id);
    expect(projection.geometryProvesAccessibility).toBe(false);
    expect(projection.geometryImported).toBe(true);
    expect(projection.unknownClaimCount).toBe(1);
    expect(projection.staleClaimCount).toBe(1);
    expect(projection.disputedClaimCount).toBe(1);
    expect(projection.evidencedClaimCount).toBe(1);
    expect(projection.accessPlaceRef).toBe("access_place:place_civic");
    expect(projection.sourceDates).toContain("2026-06-01");
    expect(projection.limitations.length).toBeGreaterThan(0);
    expect(
      "universalScore" in (projection as unknown as Record<string, unknown>)
    ).toBe(false);
  });
});
