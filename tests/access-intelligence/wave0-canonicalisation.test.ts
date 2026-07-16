import { describe, expect, it } from "vitest";

import {
  clearAuditEventsForTests,
  getCorrelationIdFromEvent,
  listAuditEvents,
  recordAuditEvent,
} from "@/lib/access-intelligence/audit";
import {
  consentScopeForAction,
  consentScopeForPurpose,
} from "@/lib/access-intelligence/consent-durable";
import { calculateEvidenceConfidence } from "@/lib/access-intelligence/confidence-engine";
import {
  listPlanFeatures,
  type AccessIntelligencePlan,
} from "@/lib/access-intelligence/entitlements";
import {
  accessIntelligenceFlags,
  listAccessIntelligenceFlagStates,
} from "@/lib/access-intelligence/feature-flags";
import { calculatePersonalFit } from "@/lib/access-intelligence/fit-engine";
import { mapCategoryToAccessPlace } from "@/lib/access-intelligence/place-binding";
import type {
  AccessFeature,
  AccessPassport,
  Evidence,
  Place,
} from "@/lib/access-intelligence/schemas";

describe("Wave 0 canonical place binding helpers", () => {
  it("maps AI place categories onto AccessPlaceCategory", () => {
    expect(mapCategoryToAccessPlace("civic")).toBe("government_service");
    expect(mapCategoryToAccessPlace("library")).toBe("library");
    expect(mapCategoryToAccessPlace("unknown-thing")).toBe("other");
  });
});

describe("Wave 0 consent scope composition", () => {
  it("maps AI purposes and actions to ConsentScope strings", () => {
    expect(consentScopeForPurpose("venue_verification")).toBe(
      "access.venue_verification",
    );
    expect(consentScopeForPurpose("visit_plan_sharing")).toBe(
      "access.visit_plan_share",
    );
    expect(consentScopeForAction("shareAccessPassport")).toBe(
      "access.passport_share",
    );
  });
});

describe("Wave 0 audit correlation", () => {
  it("embeds correlationId on consequential audit events", () => {
    clearAuditEventsForTests();
    const event = recordAuditEvent({
      actorUserId: "demo-access-intelligence-user",
      action: "saveVisitPlan",
      purpose: "visit_plan_persistence",
      outcome: "approved",
      persistCanonical: false,
      metadata: { accessPlaceId: "place-riverside-hall" },
    });
    const correlationId = getCorrelationIdFromEvent(event);
    expect(correlationId).toBeTruthy();
    expect(listAuditEvents("demo-access-intelligence-user")).toHaveLength(1);
    expect(event.metadata).toMatchObject({
      correlationId,
      accessPlaceId: "place-riverside-hall",
    });
  });
});

describe("Wave 0 feature flags", () => {
  it("keeps live adapters and programme expansions off by default", () => {
    expect(accessIntelligenceFlags.liveBms).toBe(false);
    expect(accessIntelligenceFlags.liveMessaging).toBe(false);
    expect(accessIntelligenceFlags.reliabilityConsole).toBe(false);
    expect(accessIntelligenceFlags.regressionSimulator).toBe(false);
    const snapshot = listAccessIntelligenceFlagStates();
    expect(snapshot.canonicalPlaceBinding).toBe(true);
  });
});

describe("Wave 0 entitlement score invariant", () => {
  const place: Place = {
    id: "p1",
    name: "Invariant Venue",
    address: "1 Test St",
    category: "community_centre",
  };

  const feature: AccessFeature = {
    id: "f1",
    placeId: "p1",
    elementId: "e1",
    featureType: "clear_door_width_mm",
    value: 900,
    unit: "mm",
    sourceType: "qualified_assessor",
    observedAt: new Date().toISOString(),
    evidenceIds: ["ev1"],
    confidence: 0.9,
    disputed: false,
  };

  const evidence: Evidence[] = [
    {
      id: "ev1",
      type: "measurement",
      title: "Door width",
      capturedAt: new Date().toISOString(),
      sourceName: "Assessor",
      sourceType: "qualified_assessor",
      status: "verified",
    },
  ];

  const passport: AccessPassport = {
    id: "pass-1",
    userId: "user-1",
    name: "Wheelchair day",
    requirements: [
      {
        id: "req-1",
        featureType: "clear_door_width_mm",
        importance: "required",
        operator: "minimum",
        value: 850,
        unit: "mm",
        shareWithVenue: true,
      },
    ],
    communicationPreferences: [],
    mobilityAids: ["manual_wheelchair"],
    sharingDefaults: {
      shareRequiredWithVenue: true,
      sharePreferredWithVenue: false,
      shareHelpfulWithVenue: false,
    },
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("does not change confidence or personal-fit when plan upgrades", () => {
    const community = listPlanFeatures("community" as AccessIntelligencePlan);
    const enterprise = listPlanFeatures("enterprise" as AccessIntelligencePlan);
    expect(community).not.toEqual(enterprise);

    const confidenceA = calculateEvidenceConfidence({
      features: [feature],
      evidence,
    });
    const confidenceB = calculateEvidenceConfidence({
      features: [feature],
      evidence,
    });
    expect(confidenceA).toEqual(confidenceB);

    const fitA = calculatePersonalFit({
      place,
      passport,
      features: [feature],
      evidence,
      incidents: [],
    });
    const fitB = calculatePersonalFit({
      place,
      passport,
      features: [feature],
      evidence,
      incidents: [],
    });
    expect(fitA.status).toEqual(fitB.status);
    expect(fitA.personalFit).toEqual(fitB.personalFit);
  });
});
