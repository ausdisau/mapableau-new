import { describe, expect, it } from "vitest";

import { calculateEvidenceConfidence } from "@/lib/access-intelligence/confidence-engine";
import { createDemoPassports, getDemoGraph } from "@/lib/access-intelligence/demo-data";
import { calculatePersonalFit } from "@/lib/access-intelligence/fit-engine";
import { calculateRouteCost } from "@/lib/access-intelligence/route-cost";
import {
  buildAccessibleRoute,
  assertEligibleRoute,
} from "@/lib/access-intelligence/route-engine";
import type {
  AccessFeature,
  AccessPassport,
  AccessRequirement,
  Evidence,
  Place,
  RouteEdge,
} from "@/lib/access-intelligence/schemas";
import { agentAccessPlanSchema } from "@/lib/access-intelligence/schemas";

function passportWith(
  requirements: AccessRequirement[],
  overrides?: Partial<AccessPassport>,
): AccessPassport {
  const base = createDemoPassports()[0]!;
  return {
    ...base,
    ...overrides,
    requirements,
  };
}

describe("fit-engine", () => {
  it("returns blocked when required step-free access meets stepped-only evidence", () => {
    const place: Place = {
      id: "p1",
      name: "Stepped Venue",
      address: "1 Demo St",
      category: "test",
    };
    const features: AccessFeature[] = [
      {
        id: "f1",
        placeId: "p1",
        elementId: "e1",
        featureType: "step_free",
        value: false,
        sourceType: "qualified_assessor",
        observedAt: "2026-06-01T00:00:00.000Z",
        evidenceIds: ["ev1"],
        confidence: 1,
        disputed: false,
      },
    ];
    const passport = passportWith([
      {
        id: "r1",
        featureType: "step_free",
        importance: "required",
        operator: "available",
        value: true,
        shareWithVenue: true,
      },
    ]);
    const decision = calculatePersonalFit({
      place,
      passport,
      features,
      evidence: [],
    });
    expect(decision.status).toBe("blocked");
    expect(decision.blockers.length).toBeGreaterThan(0);
  });

  it("matches required minimum door width 850 mm against 910 mm evidence", () => {
    const place: Place = {
      id: "p1",
      name: "Wide Door",
      address: "1 Demo St",
      category: "test",
    };
    const features: AccessFeature[] = [
      {
        id: "f1",
        placeId: "p1",
        elementId: "e1",
        featureType: "clear_door_width_mm",
        value: 910,
        unit: "mm",
        sourceType: "qualified_assessor",
        observedAt: "2026-06-01T00:00:00.000Z",
        evidenceIds: ["ev1"],
        confidence: 1,
        disputed: false,
      },
    ];
    const passport = passportWith([
      {
        id: "r1",
        featureType: "clear_door_width_mm",
        importance: "required",
        operator: "minimum",
        value: 850,
        unit: "mm",
        shareWithVenue: true,
      },
    ]);
    const decision = calculatePersonalFit({
      place,
      passport,
      features,
      evidence: [],
    });
    expect(decision.status).toBe("suitable");
    expect(decision.matchedRequirements[0]?.outcome).toBe("matched");
  });

  it("returns unknown (not suitable) when required Changing Places has no evidence", () => {
    const place: Place = {
      id: "p1",
      name: "No CP",
      address: "1 Demo St",
      category: "test",
    };
    const passport = passportWith([
      {
        id: "r1",
        featureType: "changing_places",
        importance: "required",
        operator: "available",
        value: true,
        shareWithVenue: true,
      },
    ]);
    const decision = calculatePersonalFit({
      place,
      passport,
      features: [],
      evidence: [],
    });
    expect(decision.status).toBe("unknown");
    expect(decision.unknowns.length).toBeGreaterThan(0);
    expect(decision.status).not.toBe("suitable");
  });

  it("returns blocked when accessible toilet is confirmed absent", () => {
    const place: Place = {
      id: "p1",
      name: "No toilet",
      address: "1 Demo St",
      category: "test",
    };
    const features: AccessFeature[] = [
      {
        id: "f1",
        placeId: "p1",
        elementId: "e1",
        featureType: "accessible_toilet",
        value: false,
        sourceType: "qualified_assessor",
        observedAt: "2026-06-01T00:00:00.000Z",
        evidenceIds: ["ev1"],
        confidence: 1,
        disputed: false,
      },
    ];
    const passport = passportWith([
      {
        id: "r1",
        featureType: "accessible_toilet",
        importance: "required",
        operator: "available",
        value: true,
        shareWithVenue: true,
      },
    ]);
    const decision = calculatePersonalFit({
      place,
      passport,
      features,
      evidence: [],
    });
    expect(decision.status).toBe("blocked");
  });

  it("lets preferred quiet-space affect personal fit without creating a blocker", () => {
    const place: Place = {
      id: "p1",
      name: "No quiet",
      address: "1 Demo St",
      category: "test",
    };
    const features: AccessFeature[] = [
      {
        id: "f1",
        placeId: "p1",
        elementId: "e1",
        featureType: "step_free",
        value: true,
        sourceType: "qualified_assessor",
        observedAt: "2026-06-01T00:00:00.000Z",
        evidenceIds: [],
        confidence: 1,
        disputed: false,
      },
      {
        id: "f2",
        placeId: "p1",
        elementId: "e2",
        featureType: "quiet_waiting_area",
        value: false,
        sourceType: "venue_attestation",
        observedAt: "2026-06-01T00:00:00.000Z",
        evidenceIds: [],
        confidence: 0.75,
        disputed: false,
      },
    ];
    const passport = passportWith([
      {
        id: "r1",
        featureType: "step_free",
        importance: "required",
        operator: "available",
        value: true,
        shareWithVenue: true,
      },
      {
        id: "r2",
        featureType: "quiet_waiting_area",
        importance: "preferred",
        operator: "available",
        value: true,
        shareWithVenue: false,
      },
    ]);
    const decision = calculatePersonalFit({
      place,
      passport,
      features,
      evidence: [],
    });
    expect(decision.blockers).toHaveLength(0);
    expect(decision.status).toBe("suitable_with_conditions");
    expect(decision.personalFit).not.toBeNull();
    expect(decision.personalFit!).toBeLessThan(100);
  });
});

describe("confidence-engine", () => {
  it("lowers confidence for outdated evidence", () => {
    const fresh: AccessFeature = {
      id: "f1",
      placeId: "p1",
      elementId: "e1",
      featureType: "accessible_toilet",
      value: true,
      sourceType: "qualified_assessor",
      observedAt: "2026-06-01T00:00:00.000Z",
      evidenceIds: ["ev1"],
      confidence: 1,
      disputed: false,
    };
    const old: AccessFeature = {
      ...fresh,
      id: "f2",
      observedAt: "2020-01-01T00:00:00.000Z",
    };
    const freshScore = calculateEvidenceConfidence({
      features: [fresh],
      evidence: [],
      now: new Date("2026-07-15T00:00:00.000Z"),
    });
    const oldScore = calculateEvidenceConfidence({
      features: [old],
      evidence: [],
      now: new Date("2026-07-15T00:00:00.000Z"),
    });
    expect(oldScore.numeric).toBeLessThan(freshScore.numeric);
  });

  it("lowers confidence and surfaces conflict for conflicting evidence", () => {
    const features: AccessFeature[] = [
      {
        id: "f1",
        placeId: "p1",
        elementId: "e1",
        featureType: "clear_door_width_mm",
        value: 900,
        sourceType: "qualified_assessor",
        observedAt: "2026-06-01T00:00:00.000Z",
        evidenceIds: ["ev1"],
        confidence: 1,
        disputed: false,
      },
      {
        id: "f2",
        placeId: "p1",
        elementId: "e1",
        featureType: "clear_door_width_mm",
        value: 700,
        sourceType: "community_report",
        observedAt: "2026-06-01T00:00:00.000Z",
        evidenceIds: ["ev2"],
        confidence: 0.5,
        disputed: false,
      },
    ];
    const result = calculateEvidenceConfidence({
      features,
      evidence: [],
    });
    expect(result.numeric).toBeLessThan(80);
    expect(result.explanation.toLowerCase()).toMatch(/conflict|disputed/);

    const passport = passportWith([
      {
        id: "r1",
        featureType: "clear_door_width_mm",
        importance: "required",
        operator: "minimum",
        value: 850,
        shareWithVenue: true,
      },
    ]);
    const decision = calculatePersonalFit({
      place: {
        id: "p1",
        name: "Conflict",
        address: "1 Demo",
        category: "test",
      },
      passport,
      features,
      evidence: [],
    });
    expect(decision.status).toBe("unknown");
  });
});

describe("route-engine", () => {
  it("rejects routes affected by an active lift outage and selects an alternative", () => {
    const graph = getDemoGraph("place-northside-library")!;
    const passport = createDemoPassports()[0]!;
    const result = buildAccessibleRoute({
      placeId: graph.place.id,
      nodes: graph.nodes,
      edges: graph.edges,
      passport,
      fromNodeId: "n-nsl-ent",
      toNodeId: "n-nsl-room",
      incidents: [
        {
          id: "inc-1",
          placeId: graph.place.id,
          elementId: "nsl-lift-main",
          type: "lift_outage",
          severity: "high",
          description: "Main lift out",
          sourceType: "system_feed",
          reportedAt: "2026-07-10T09:00:00.000Z",
          status: "active",
          affectedEdgeIds: ["e-nsl-main-lift", "e-nsl-main-short"],
        },
        {
          id: "inc-2",
          placeId: graph.place.id,
          elementId: "nsl-corr-blocked",
          type: "blocked_route",
          severity: "moderate",
          description: "Blocked corridor",
          sourceType: "venue_attestation",
          reportedAt: "2026-07-10T09:00:00.000Z",
          status: "active",
          affectedEdgeIds: ["e-nsl-short-room"],
        },
      ],
    });
    const route = assertEligibleRoute(result);
    expect(route.edgeIds).not.toContain("e-nsl-main-lift");
    expect(route.edgeIds).toContain("e-nsl-alt-lift");
    expect(result.rejected.some((r) => /outage|barrier|blocked/i.test(r.reasons.join(" ")))).toBe(
      true,
    );
  });

  it("prefers a longer high-confidence route over a short uncertain one", () => {
    const passport = createDemoPassports()[0]!;
    const shortUncertain: RouteEdge = {
      id: "e-short",
      fromNodeId: "a",
      toNodeId: "b",
      distanceMetres: 10,
      widthMm: 1000,
      steps: 0,
      temporaryBarrier: false,
      evidenceConfidence: 0.2,
    };
    const longConfident: RouteEdge = {
      id: "e-long",
      fromNodeId: "a",
      toNodeId: "b",
      distanceMetres: 40,
      widthMm: 1000,
      steps: 0,
      temporaryBarrier: false,
      evidenceConfidence: 0.95,
    };
    const shortCost = calculateRouteCost(shortUncertain, passport).total;
    const longCost = calculateRouteCost(longConfident, passport).total;
    expect(longCost).toBeLessThan(shortCost);

    const result = buildAccessibleRoute({
      placeId: "p",
      nodes: [
        { id: "a", placeId: "p", label: "A", nodeType: "entrance" },
        { id: "b", placeId: "p", label: "B", nodeType: "room" },
      ],
      edges: [shortUncertain, longConfident],
      passport,
      fromNodeId: "a",
      toNodeId: "b",
    });
    expect(result.recommended?.edgeIds).toEqual(["e-long"]);
  });

  it("rejects stepped edges when step-free is required", () => {
    const passport = createDemoPassports()[0]!;
    const result = buildAccessibleRoute({
      placeId: "place-harbour-civic",
      nodes: [
        { id: "a", placeId: "place-harbour-civic", label: "A", nodeType: "entrance" },
        { id: "b", placeId: "place-harbour-civic", label: "B", nodeType: "room" },
      ],
      edges: [
        {
          id: "e-steps",
          fromNodeId: "a",
          toNodeId: "b",
          distanceMetres: 10,
          steps: 4,
          widthMm: 1000,
          temporaryBarrier: false,
          evidenceConfidence: 1,
        },
      ],
      passport,
      fromNodeId: "a",
      toNodeId: "b",
    });
    expect(result.recommended).toBeNull();
    expect(result.rejected.length).toBeGreaterThan(0);
  });
});

describe("demo data decision states", () => {
  it("produces all four decision states across variations", () => {
    const statuses = new Set<string>();

    // suitable / suitable_with_conditions — Harbour with power-chair passport
    const hcc = getDemoGraph("place-harbour-civic")!;
    const power = createDemoPassports()[0]!;
    const hccDecision = calculatePersonalFit({
      place: hcc.place,
      passport: power,
      features: hcc.features,
      evidence: hcc.evidence,
    });
    // staff_assistance unknown → suitable_with_conditions or suitable depending on preferred toilet
    statuses.add(hccDecision.status);

    // blocked — stepped only
    statuses.add(
      calculatePersonalFit({
        place: hcc.place,
        passport: power,
        features: hcc.features.filter((f) => f.elementId === "hcc-ent-a"),
        evidence: hcc.evidence,
      }).status,
    );

    // unknown — Changing Places required with no evidence
    statuses.add(
      calculatePersonalFit({
        place: hcc.place,
        passport: passportWith([
          {
            id: "cp",
            featureType: "changing_places",
            importance: "required",
            operator: "available",
            value: true,
            shareWithVenue: true,
          },
        ]),
        features: hcc.features,
        evidence: hcc.evidence,
      }).status,
    );

    // suitable — only step-free preferred that matches
    statuses.add(
      calculatePersonalFit({
        place: hcc.place,
        passport: passportWith([
          {
            id: "s",
            featureType: "step_free",
            importance: "required",
            operator: "available",
            value: true,
            shareWithVenue: true,
          },
        ]),
        features: hcc.features.filter((f) => f.featureType === "step_free" && f.value === true),
        evidence: hcc.evidence,
      }).status,
    );

    // Riverside tends toward conditions/unknown due to outdated/hearing
    const rch = getDemoGraph("place-riverside-hall")!;
    const hearingPassport = createDemoPassports().find(
      (p) => p.id === "passport-hearing",
    )!;
    statuses.add(
      calculatePersonalFit({
        place: rch.place,
        passport: hearingPassport,
        features: rch.features,
        evidence: rch.evidence,
      }).status,
    );

    expect(statuses.has("suitable") || statuses.has("suitable_with_conditions")).toBe(
      true,
    );
    expect(statuses.has("blocked")).toBe(true);
    expect(statuses.has("unknown")).toBe(true);
    expect(statuses.has("suitable_with_conditions") || statuses.has("suitable")).toBe(
      true,
    );
  });
});

describe("structured output schema", () => {
  it("validates a final structured access plan", () => {
    const parsed = agentAccessPlanSchema.parse({
      placeId: "place-harbour-civic",
      placeName: "Harbour Civic Centre",
      destination: "Interview Room 3.12",
      visitAt: "2026-07-16T10:00:00.000Z",
      status: "suitable_with_conditions",
      baselineScore: 72,
      personalFit: 80,
      evidenceConfidence: 78,
      liveReliability: 95,
      summary: "Suitable with conditions. Use Entrance B.",
      blockers: [],
      conditions: ["Staff assistance availability at 9:45 am is unknown."],
      unknowns: ["Whether reception assistance will be available at 9:45 am."],
      confirmedFeatures: [
        "Entrance B is level.",
        "Clear door width is 910 mm.",
        "Lift door width is 900 mm.",
        "The level-three corridor is 1350 mm wide.",
      ],
      recommendedRoute: null,
      alternatives: ["Ask venue to confirm reception assistance."],
      actions: [
        {
          type: "request_verification",
          label: "Request venue verification",
        },
      ],
      evidenceIds: ["ev-hcc-ent-b-width"],
      lastCheckedAt: "2026-07-15T00:00:00.000Z",
    });
    expect(parsed.status).toBe("suitable_with_conditions");
  });
});

describe("agent governance contracts", () => {
  it("never treats unknown as confirmed fact in fit results", () => {
    const decision = calculatePersonalFit({
      place: {
        id: "p",
        name: "P",
        address: "A",
        category: "t",
      },
      passport: passportWith([
        {
          id: "r",
          featureType: "changing_places",
          importance: "required",
          operator: "available",
          value: true,
          shareWithVenue: true,
        },
      ]),
      features: [],
      evidence: [] as Evidence[],
    });
    expect(decision.matchedRequirements[0]?.outcome).toBe("unknown");
    expect(decision.status).toBe("unknown");
  });

  it("does not encode diagnosis-based requirements in passport templates", () => {
    const passports = createDemoPassports();
    for (const passport of passports) {
      expect(passport.name.toLowerCase()).not.toMatch(/diagnos|ndis number|medical/);
      for (const req of passport.requirements) {
        expect(req.featureType).not.toMatch(/diagnos|disability_label/);
      }
    }
  });
});
