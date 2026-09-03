import { describe, expect, it } from "vitest";

import { validateAccessQuery } from "@/lib/access/intelligence-next/query/validate";
import {
  classifyFeatureScope,
  compileGaisQueryToAccessQueryAst,
  executeGaisStructuredQuery,
  filterFeatureByQuery,
  gaisStructuredQuerySchema,
  groupResultsByScope,
  hasUnknownAccessibilityData,
  resolveQueryBounds,
  sortResultsDeterministically,
  validateGaisQueryAst,
  GAIS_MAX_RADIUS_METRES,
} from "@/lib/gais/query";
import type { GaisFeature } from "@/lib/gais/contracts/feature";
import { mapableGaisFlags } from "@/lib/config/mapable-gais";

function makeFeature(overrides: Partial<GaisFeature> = {}): GaisFeature {
  return {
    id: "gais-test",
    type: "ENTRANCE",
    geometry: { type: "Point", coordinates: [151.21, -33.86] },
    properties: {},
    evidence: [{ sourceType: "COMMUNITY_REPORTED", sourceLabel: "Community reported" }],
    ...overrides,
  };
}

describe("gaisStructuredQuerySchema validation", () => {
  it("accepts location + featureTypes + requirements", () => {
    const parsed = gaisStructuredQuerySchema.safeParse({
      location: { lat: -33.86, lng: 151.21, radiusMetres: 1000 },
      featureTypes: ["PLACE"],
      requirements: { requiresStepFree: true },
    });
    expect(parsed.success).toBe(true);
  });

  it("requires bounds or location", () => {
    const parsed = gaisStructuredQuerySchema.safeParse({
      featureTypes: ["PLACE"],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects excessive radius", () => {
    const parsed = gaisStructuredQuerySchema.safeParse({
      location: {
        lat: -33.86,
        lng: 151.21,
        radiusMetres: GAIS_MAX_RADIUS_METRES + 1,
      },
    });
    expect(parsed.success).toBe(false);
  });
});

describe("resolveQueryBounds abuse protection", () => {
  it("rejects radius above maximum", () => {
    const result = resolveQueryBounds({
      location: { lat: -33.86, lng: 151.21, radiusMetres: GAIS_MAX_RADIUS_METRES + 100 },
    });
    expect(result.ok).toBe(false);
  });

  it("derives bounds from location radius", () => {
    const result = resolveQueryBounds({
      location: { lat: -33.86, lng: 151.21, radiusMetres: 1000 },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.bounds.minLat).toBeLessThan(-33.86);
      expect(result.bounds.maxLat).toBeGreaterThan(-33.86);
    }
  });
});

describe("compileGaisQueryToAccessQueryAst", () => {
  it("reuses Intelligence Next AST with ontology concepts", () => {
    const query = {
      location: { lat: -33.86, lng: 151.21, radiusMetres: 500 },
      requirements: { requiresStepFree: true },
    };
    const ast = compileGaisQueryToAccessQueryAst(query, "q-1");
    expect(ast.target).toBe("feature");
    expect(ast.require.some((c) => c.ontologyConceptId === "physical.step_free")).toBe(true);

    const validation = validateGaisQueryAst(query, "q-1");
    expect(validation.ok).toBe(true);
  });

  it("rejects unknown ontology via shared validateAccessQuery", () => {
    const ast = compileGaisQueryToAccessQueryAst(
      { location: { lat: 0, lng: 0, radiusMetres: 100 } },
      "q-bad",
    );
    ast.require = [{ ontologyConceptId: "physical.not_real", value: true }];
    expect(validateAccessQuery(ast).ok).toBe(false);
  });
});

describe("result scopes", () => {
  it("known step-free fact matches MATCHED_KNOWN_FACTS", () => {
    const item = classifyFeatureScope(
      makeFeature({ properties: { stepFree: true, accessFeatureTag: "step_free_entry" } }),
      { evidenceRequirements: { requiresKnownStepFreeEntrance: true } },
    );
    expect(item.scope).toBe("MATCHED_KNOWN_FACTS");
  });

  it("step-free tag without verified fact stays UNKNOWN", () => {
    const item = classifyFeatureScope(
      makeFeature({
        type: "ENTRANCE",
        properties: { accessFeatureTag: "step_free_entry", stepFree: undefined },
      }),
      { evidenceRequirements: { requiresKnownStepFreeEntrance: true } },
    );
    expect(item.scope).toBe("UNKNOWN");
    expect(item.reason).toContain("not verified");
  });

  it("false step-free is KNOWN_CONFLICTS", () => {
    const item = classifyFeatureScope(
      makeFeature({ properties: { stepFree: false } }),
      { requirements: { requiresStepFree: true } },
    );
    expect(item.scope).toBe("KNOWN_CONFLICTS");
  });

  it("requirements map compatibility to scopes", () => {
    const matched = classifyFeatureScope(
      makeFeature({ properties: { widthMm: 1200 } }),
      { requirements: { minimumWidthMm: 900 } },
    );
    expect(matched.scope).toBe("MATCHED_KNOWN_FACTS");

    const unknown = classifyFeatureScope(makeFeature({ properties: {} }), {
      requirements: { minimumWidthMm: 900 },
    });
    expect(unknown.scope).toBe("UNKNOWN");
  });

  it("accessible toilet with evidence matches", () => {
    const item = classifyFeatureScope(
      makeFeature({
        type: "TOILET",
        properties: { accessFeatureTag: "accessible_toilet" },
        evidence: [{ sourceType: "VERIFIED" }],
      }),
      { evidenceRequirements: { requiresAccessibleToiletEvidence: true } },
    );
    expect(item.scope).toBe("MATCHED_KNOWN_FACTS");
  });
});

describe("unknown preservation", () => {
  it("hasUnknownAccessibilityData for entrance without stepFree", () => {
    expect(
      hasUnknownAccessibilityData(
        makeFeature({ type: "ENTRANCE", properties: { accessFeatureTag: "step_free_entry" } }),
      ),
    ).toBe(true);
  });

  it("unknownOnly filter excludes known features", () => {
    const known = makeFeature({ type: "ENTRANCE", properties: { stepFree: true } });
    const unknown = makeFeature({ type: "ENTRANCE", properties: {} });
    expect(filterFeatureByQuery(known, { unknownOnly: true })).toBe(false);
    expect(filterFeatureByQuery(unknown, { unknownOnly: true })).toBe(true);
  });
});

describe("deterministic output", () => {
  it("sorts by feature id", () => {
    const sorted = sortResultsDeterministically([
      { feature: makeFeature({ id: "z" }), scope: "UNKNOWN", reason: "" },
      { feature: makeFeature({ id: "a" }), scope: "UNKNOWN", reason: "" },
    ]);
    expect(sorted[0].feature.id).toBe("a");
    expect(sorted[1].feature.id).toBe("z");
  });

  it("groups scopes correctly", () => {
    const grouped = groupResultsByScope([
      { feature: makeFeature({ id: "1" }), scope: "MATCHED_KNOWN_FACTS", reason: "" },
      { feature: makeFeature({ id: "2" }), scope: "UNKNOWN", reason: "" },
      { feature: makeFeature({ id: "3" }), scope: "KNOWN_CONFLICTS", reason: "" },
    ]);
    expect(grouped.MATCHED_KNOWN_FACTS).toHaveLength(1);
    expect(grouped.UNKNOWN).toHaveLength(1);
    expect(grouped.KNOWN_CONFLICTS).toHaveLength(1);
  });
});

describe("executeGaisStructuredQuery", () => {
  it("returns scoped results without accessibility ranking", async () => {
    const execution = await executeGaisStructuredQuery(
      {
        location: { lat: -33.86, lng: 151.21, radiusMetres: 1000 },
        featureTypes: ["ENTRANCE"],
        requirements: { requiresStepFree: true },
      },
      "test-query-1",
      {
        loadFeatures: async () => [
          makeFeature({
            id: "gais-a",
            properties: { stepFree: true },
          }),
          makeFeature({
            id: "gais-b",
            properties: { stepFree: undefined },
          }),
        ],
        loadEvents: async () => [],
      },
    );

    expect(execution.ok).toBe(true);
    if (execution.ok) {
      expect(execution.result.meta.rankingApplied).toBe(false);
      expect(execution.result.scopes.MATCHED_KNOWN_FACTS).toHaveLength(1);
      expect(execution.result.scopes.UNKNOWN).toHaveLength(1);
    }
  });

  it("includes active events when requested", async () => {
    const execution = await executeGaisStructuredQuery(
      {
        location: { lat: -33.86, lng: 151.21, radiusMetres: 500 },
        includeEvents: true,
      },
      "test-query-2",
      {
        loadFeatures: async () => [],
        loadEvents: async () => [
          {
            id: "evt-1",
            eventType: "OBSTRUCTION",
            label: "Community-reported temporary obstruction",
            reportedAt: "2026-08-22T10:00:00Z",
            evidence: [{ sourceType: "COMMUNITY_REPORTED" }],
            verificationState: "community_reported",
            source: "temporary_barrier",
          },
        ],
      },
    );

    expect(execution.ok).toBe(true);
    if (execution.ok) {
      expect(execution.result.events).toHaveLength(1);
    }
  });

  it("strips private fields from features", async () => {
    const execution = await executeGaisStructuredQuery(
      {
        location: { lat: -33.86, lng: 151.21, radiusMetres: 500 },
      },
      "test-query-3",
      {
        loadFeatures: async () => [
          makeFeature({
            properties: {
              reporterUserId: "secret-user",
              widthMm: 900,
            } as GaisFeature["properties"],
          }),
        ],
        loadEvents: async () => [],
      },
    );

    expect(execution.ok).toBe(true);
    if (execution.ok) {
      const json = JSON.stringify(execution.result);
      expect(json).not.toContain("secret-user");
      expect(json).not.toContain("reporterUserId");
    }
  });
});

describe("GAIS query API gate", () => {
  it("query flag defaults off", () => {
    expect(mapableGaisFlags.queryEnabled).toBe(false);
  });
});
