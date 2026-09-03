import { describe, expect, it } from "vitest";

import {
  handleCompatibilityRequest,
  resolveAccessRequirements,
} from "@/app/api/gais/compatibility/route";
import {
  evaluateCompatibility,
  mobilityProfileToAccessRequirements,
  type AccessRequirements,
} from "@/lib/gais/compatibility";
import type { GaisFeature } from "@/lib/gais/contracts/feature";
import { mapableGaisFlags } from "@/lib/config/mapable-gais";

function makeFeature(
  overrides: Partial<GaisFeature> & { properties?: GaisFeature["properties"] } = {},
): GaisFeature {
  return {
    id: "gais-test-feature",
    type: "PATH",
    geometry: { type: "Point", coordinates: [151.2, -33.8] },
    properties: {},
    evidence: [{ sourceType: "COMMUNITY_REPORTED", sourceLabel: "Community reported" }],
    ...overrides,
  };
}

describe("evaluateCompatibility", () => {
  it("unknown width never becomes pass", () => {
    const feature = makeFeature({ properties: {} });
    const requirements: AccessRequirements = { minimumWidthMm: 900 };
    const result = evaluateCompatibility(feature, requirements);

    expect(result.overall).toBe("UNKNOWN");
    expect(result.overall).not.toBe("COMPATIBLE_WITH_KNOWN_FACTS");
    expect(result.unknowns).toContain("Minimum width 900 mm");
  });

  it("missing evidence never becomes verified compatible for step-free", () => {
    const feature = makeFeature({
      type: "ENTRANCE",
      properties: { accessFeatureTag: "step_free_entry" },
    });
    const requirements: AccessRequirements = { requiresStepFree: true };
    const result = evaluateCompatibility(feature, requirements);

    expect(result.overall).toBe("UNKNOWN");
    const stepRule = result.rules.find((r) => r.requirement === "Step-free access required");
    expect(stepRule?.result).toBe("UNKNOWN");
    expect(stepRule?.observedValue).toBeNull();
  });

  it("detects known width conflict", () => {
    const feature = makeFeature({ properties: { widthMm: 840 } });
    const requirements: AccessRequirements = { minimumWidthMm: 900 };
    const result = evaluateCompatibility(feature, requirements);

    expect(result.overall).toBe("KNOWN_CONFLICT");
    expect(result.conflicts.length).toBeGreaterThan(0);
    expect(result.matches).toHaveLength(0);
  });

  it("detects step requirement conflict when stepFree is false", () => {
    const feature = makeFeature({
      type: "ENTRANCE",
      properties: { stepFree: false },
    });
    const requirements: AccessRequirements = { requiresStepFree: true };
    const result = evaluateCompatibility(feature, requirements);

    expect(result.overall).toBe("KNOWN_CONFLICT");
    expect(result.rules.some((r) => r.requirement === "Step-free access required")).toBe(true);
  });

  it("reports compatible when width meets requirement", () => {
    const feature = makeFeature({ properties: { widthMm: 1200 } });
    const requirements: AccessRequirements = { minimumWidthMm: 900 };
    const result = evaluateCompatibility(feature, requirements);

    expect(result.overall).toBe("COMPATIBLE_WITH_KNOWN_FACTS");
    expect(result.matches).toHaveLength(1);
  });

  it("mixed unknown and compatible yields unknown overall", () => {
    const feature = makeFeature({
      type: "ENTRANCE",
      properties: { widthMm: 1200, stepFree: undefined },
    });
    const requirements: AccessRequirements = {
      minimumWidthMm: 900,
      requiresStepFree: true,
    };
    const result = evaluateCompatibility(feature, requirements);

    expect(result.overall).toBe("UNKNOWN");
    expect(result.matches).toHaveLength(1);
    expect(result.unknowns.length).toBeGreaterThan(0);
  });

  it("requires more information when no requirements provided", () => {
    const feature = makeFeature({ properties: { widthMm: 1200 } });
    const result = evaluateCompatibility(feature, {});

    expect(result.overall).toBe("REQUIRES_MORE_INFORMATION");
    expect(result.rules).toHaveLength(0);
  });

  it("flags temporary barrier as known conflict", () => {
    const feature = makeFeature({
      type: "TEMPORARY_BARRIER",
      properties: { barrierType: "blocked_path" },
    });
    const requirements: AccessRequirements = { minimumWidthMm: 900 };
    const result = evaluateCompatibility(feature, requirements);

    expect(result.overall).toBe("KNOWN_CONFLICT");
  });
});

describe("mobilityProfileToAccessRequirements", () => {
  it("maps stored profile fields without fabricating limits", () => {
    const requirements = mobilityProfileToAccessRequirements({
      mobilityAidType: "power_wheelchair",
      minimumPreferredPathWidthMm: 1200,
      preferredMaximumSlopePercent: 5,
      stairsAllowed: false,
      liftRequirement: true,
      avoidedSurfaceTypes: ["GRAVEL"],
    });

    expect(requirements.minimumWidthMm).toBe(1200);
    expect(requirements.maximumPreferredGradientPercent).toBe(5);
    expect(requirements.requiresStepFree).toBe(true);
    expect(requirements.requiresLift).toBe(true);
    expect(requirements.avoidedSurfaces).toEqual(["GRAVEL"]);
    expect(requirements.maximumPreferredCrossSlopePercent).toBeUndefined();
  });

  it("does not require diagnosis fields", () => {
    const requirements = mobilityProfileToAccessRequirements({
      mobilityAidType: "manual_wheelchair",
      minimumPreferredPathWidthMm: 1000,
    });

    expect(requirements.minimumWidthMm).toBe(1000);
    expect(Object.keys(requirements)).not.toContain("diagnosis");
  });

  it("leaves requirements empty when profile has no mapped fields", () => {
    const requirements = mobilityProfileToAccessRequirements({
      mobilityAidType: "mobility_scooter",
    });

    expect(Object.keys(requirements)).toHaveLength(0);
  });
});

describe("resolveAccessRequirements", () => {
  it("allows manual requirements without stored profile", async () => {
    const result = await resolveAccessRequirements(
      { requirements: { minimumWidthMm: 900 } },
      { userId: null, getProfileForUser: async () => null, loadFeature: async () => null },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.requirements.minimumWidthMm).toBe(900);
    }
  });

  it("requires auth for stored profile", async () => {
    const result = await resolveAccessRequirements(
      { useStoredProfile: true },
      { userId: null, getProfileForUser: async () => null, loadFeature: async () => null },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(401);
    }
  });
});

describe("handleCompatibilityRequest profile isolation", () => {
  it("participant A cannot access participant B profile", async () => {
    const feature = makeFeature({ properties: { widthMm: 840 } });

    const result = await handleCompatibilityRequest(
      { featureId: "gais-test-feature", useStoredProfile: true },
      {
        userId: "participant-a",
        getProfileForUser: async (userId) => {
          if (userId !== "participant-a") {
            throw new Error("Profile access denied");
          }
          return { minimumWidthMm: 900 };
        },
        loadFeature: async () => feature,
      },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.evaluation.overall).toBe("KNOWN_CONFLICT");
    }
  });

  it("rejects cross-user profile lookup via getProfileForUser scoping", async () => {
    const profiles = new Map<string, AccessRequirements>([
      ["participant-a", { minimumWidthMm: 900 }],
      ["participant-b", { minimumWidthMm: 1500 }],
    ]);

    const getProfileForUser = async (userId: string) => profiles.get(userId) ?? null;

    const resultA = await handleCompatibilityRequest(
      { featureId: "f1", useStoredProfile: true },
      {
        userId: "participant-a",
        getProfileForUser,
        loadFeature: async () => makeFeature({ properties: { widthMm: 1000 } }),
      },
    );

    const resultB = await handleCompatibilityRequest(
      { featureId: "f1", useStoredProfile: true },
      {
        userId: "participant-b",
        getProfileForUser,
        loadFeature: async () => makeFeature({ properties: { widthMm: 1000 } }),
      },
    );

    expect(resultA.ok).toBe(true);
    expect(resultB.ok).toBe(true);
    if (resultA.ok && resultB.ok) {
      expect(resultA.requirements.minimumWidthMm).toBe(900);
      expect(resultB.requirements.minimumWidthMm).toBe(1500);
      expect(resultA.evaluation.overall).toBe("COMPATIBLE_WITH_KNOWN_FACTS");
      expect(resultB.evaluation.overall).toBe("KNOWN_CONFLICT");
    }
  });

  it("manual requirements work without stored profile", async () => {
    const result = await handleCompatibilityRequest(
      {
        featureId: "gais-test",
        requirements: { minimumWidthMm: 900 },
      },
      {
        userId: null,
        getProfileForUser: async () => {
          throw new Error("Should not load profile");
        },
        loadFeature: async () => makeFeature({ properties: { widthMm: 950 } }),
      },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.evaluation.overall).toBe("COMPATIBLE_WITH_KNOWN_FACTS");
    }
  });
});

describe("GAIS compatibility API gates", () => {
  it("compatibility flag defaults off", () => {
    expect(mapableGaisFlags.compatibilityEnabled).toBe(false);
  });
});
