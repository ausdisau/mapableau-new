import { describe, expect, it } from "vitest";

import {
  analyseServiceGaps,
  assessEvidence,
  auditServiceEquity,
  checkConsent,
  checkPolicyLabelInvariance,
  createDecisionAuditEvent,
  DEFAULT_MATCH_WEIGHTS,
  detectContinuityGaps,
  findAccessibleRoute,
  matchServices,
  modelEconomicScenario,
  planServiceDependencies,
  proposeServiceSchedule,
} from "@mapable/service-cartography";

const at = "2026-11-18T03:00:00.000Z";
const request = {
  id: "synthetic-request-1",
  participantId: "synthetic-person-1",
  requiredCapabilities: ["community-access"],
  communicationRequirements: ["aac-text"],
  startsAt: "2026-11-19T00:00:00.000Z",
  endsAt: "2026-11-19T02:00:00.000Z",
  preferredProviderIds: ["provider-preferred"],
  blockedProviderIds: ["provider-blocked"],
};
const verified = {
  sourceId: "synthetic-assessor-2026",
  status: "verified" as const,
  observedAt: "2026-11-17T00:00:00.000Z",
  expiresAt: "2026-12-01T00:00:00.000Z",
};
const offered = {
  id: "offer-1",
  providerId: "provider-preferred",
  capabilities: ["community-access"],
  communicationSupports: ["aac-text"],
  availableFrom: "2026-11-19T00:00:00.000Z",
  availableUntil: "2026-11-19T04:00:00.000Z",
  confirmedAvailability: true,
  reliability: 0.9,
  estimatedTravelMinutes: 15,
  priceCentsAUD: 12000,
  evidence: verified,
};
const consent = {
  grantId: "grant-1",
  subjectId: "synthetic-person-1",
  purpose: "service_matching" as const,
  recipientIds: ["mapable-engine"],
  grantedAt: "2026-11-01T00:00:00.000Z",
  expiresAt: "2026-12-01T00:00:00.000Z",
};

describe("service cartography matching kernel", () => {
  it("fails closed without purpose-bound participant consent", () => {
    const result = matchServices({ request, offers: [offered], grants: [], at });
    expect(result.status).toBe("consent_required");
    expect(result.ranked).toEqual([]);
  });

  it("recommends a verified capable option, advisory only", () => {
    const result = matchServices({
      request,
      offers: [offered],
      grants: [consent],
      at,
    });
    expect(result.status).toBe("advisory_options");
    expect(result.ranked[0]?.providerId).toBe("provider-preferred");
    expect(result.advisory.requiresParticipantConfirmation).toBe(true);
    expect(result.advisory.requiresHumanReview).toBe(true);
  });

  it("never lets a cheap communication-inaccessible offer win", () => {
    const cheap = {
      ...offered,
      id: "cheaper",
      providerId: "cheap",
      priceCentsAUD: 1,
      communicationSupports: [],
    };
    const result = matchServices({
      request,
      offers: [cheap, offered],
      grants: [consent],
      at,
    });
    expect(result.ranked).toHaveLength(1);
    expect(result.ranked[0]?.offerId).toBe("offer-1");
    expect(
      result.exclusions.find((exclusion) => exclusion.offerId === "cheaper")
        ?.reasons,
    ).toContain("communication_access_missing");
  });

  it("excludes a blocked provider even if preferred and cheapest", () => {
    const blocked = {
      ...offered,
      id: "blocked",
      providerId: "provider-blocked",
      priceCentsAUD: 0,
    };
    const result = matchServices({
      request,
      offers: [blocked],
      grants: [consent],
      at,
    });
    expect(result.status).toBe("no_verified_match");
    expect(result.exclusions[0]?.reasons).toContain("participant_blocked_provider");
  });

  it("does not promote reported or expired evidence to verified", () => {
    const reported = {
      ...offered,
      id: "reported",
      evidence: { ...verified, status: "reported" as const },
    };
    const expired = {
      ...offered,
      id: "expired",
      evidence: { ...verified, expiresAt: "2026-11-01T00:00:00.000Z" },
    };
    const result = matchServices({
      request,
      offers: [reported, expired],
      grants: [consent],
      at,
    });
    expect(result.status).toBe("no_verified_match");
    expect(assessEvidence(expired.evidence, at).status).toBe("stale");
  });

  it("enforces consent scope, expiry and revocation", () => {
    expect(
      checkConsent({
        grants: [consent],
        subjectId: request.participantId,
        purpose: "service_scheduling",
        recipientId: "mapable-engine",
        at,
      }).authorised,
    ).toBe(false);
    expect(
      checkConsent({
        grants: [{ ...consent, revokedAt: "2026-11-17T00:00:00.000Z" }],
        subjectId: request.participantId,
        purpose: "service_matching",
        recipientId: "mapable-engine",
        at,
      }).reason,
    ).toBe("revoked");
    expect(
      checkConsent({
        grants: [consent],
        subjectId: request.participantId,
        purpose: "service_matching",
        recipientId: "different-recipient",
        at,
      }).reason,
    ).toBe("missing");
  });

  it("rejects invalid weight vectors", () => {
    expect(() =>
      matchServices({
        request,
        offers: [offered],
        grants: [consent],
        at,
        weights: { ...DEFAULT_MATCH_WEIGHTS, estimatedCost: 2 },
      }),
    ).toThrow();
  });

  it("is deterministic across input order", () => {
    const another = { ...offered, id: "offer-2", providerId: "provider-other" };
    const a = matchServices({
      request,
      offers: [offered, another],
      grants: [consent],
      at,
    });
    const b = matchServices({
      request,
      offers: [another, offered],
      grants: [consent],
      at,
    });
    expect(a).toEqual(b);
  });

  it("rejects verified records without a credible expiry covering the service", () => {
    const expiring = {
      ...offered,
      evidence: { ...verified, expiresAt: "2026-11-18T12:00:00.000Z" },
    };
    const eternal = {
      ...offered,
      id: "eternal",
      evidence: {
        sourceId: "unbounded",
        status: "verified" as const,
        observedAt: verified.observedAt,
      },
    };
    const result = matchServices({
      request,
      offers: [expiring, eternal],
      grants: [consent],
      at,
    });
    expect(result.status).toBe("no_verified_match");
  });

  it("rejects past requests and timezone-ambiguous timestamps", () => {
    expect(
      matchServices({
        request: {
          ...request,
          startsAt: "2026-11-18T02:00:00Z",
          endsAt: "2026-11-18T02:30:00Z",
        },
        offers: [offered],
        grants: [consent],
        at,
      }).status,
    ).toBe("invalid_request");
    expect(
      matchServices({
        request: { ...request, startsAt: "2026-11-19" },
        offers: [offered],
        grants: [consent],
        at,
      }).status,
    ).toBe("invalid_request");
  });
});

describe("service cartography scheduling kernel", () => {
  const slots = [
    {
      id: "slot-1",
      providerId: "provider-preferred",
      resourceIds: ["worker-token-1"],
      capabilities: ["community-access"],
      communicationSupports: ["aac-text"],
      from: "2026-11-19T00:00:00.000Z",
      until: "2026-11-19T04:00:00.000Z",
      available: true,
      evidence: verified,
    },
    {
      id: "slot-2",
      providerId: "provider-other",
      resourceIds: ["worker-token-2"],
      capabilities: ["community-access"],
      communicationSupports: ["aac-text"],
      from: "2026-11-19T00:00:00.000Z",
      until: "2026-11-19T04:00:00.000Z",
      available: true,
      evidence: verified,
    },
  ];

  function grant(subjectId: string) {
    return {
      grantId: `grant-${subjectId}`,
      subjectId,
      purpose: "service_scheduling" as const,
      recipientIds: ["mapable-engine"],
      grantedAt: "2026-11-01T00:00:00.000Z",
      expiresAt: "2026-12-01T00:00:00.000Z",
    };
  }

  it("proposes slots that still require human and participant confirmation", () => {
    const result = proposeServiceSchedule({
      requests: [request],
      slots,
      grants: [grant(request.participantId)],
      at,
    });
    expect(result.proposals[0]?.providerId).toBe("provider-preferred");
    expect(result.proposals[0]?.requiresParticipantConfirmation).toBe(true);
    expect(result.proposals[0]?.requiresHumanReview).toBe(true);
  });

  it("disallows shared resource overlapping bookings", () => {
    const r2 = {
      ...request,
      id: "r2",
      participantId: "synthetic-person-2",
      preferredProviderIds: [],
    };
    const result = proposeServiceSchedule({
      requests: [request, r2],
      slots: [slots[0]!],
      grants: [grant(request.participantId), grant(r2.participantId)],
      at,
    });
    expect(result.proposals).toHaveLength(1);
    expect(result.notScheduled).toHaveLength(1);
  });

  it("requires scope-specific consent for every participant", () => {
    const result = proposeServiceSchedule({
      requests: [request],
      slots,
      grants: [],
      at,
    });
    expect(result.proposals).toHaveLength(0);
    expect(result.notScheduled[0]?.reason).toBe("consent_required");
  });

  it("ignores unverified resources and missing communication capability", () => {
    const result = proposeServiceSchedule({
      requests: [request],
      slots: [
        {
          ...slots[0]!,
          communicationSupports: [],
          evidence: { ...verified, status: "unknown" },
        },
      ],
      grants: [grant(request.participantId)],
      at,
    });
    expect(result.notScheduled[0]?.reason).toBe("no_verified_suitable_capacity");
  });
});

describe("service cartography routing, graph, gaps and equity", () => {
  const segments = [
    {
      id: "a-b",
      fromId: "a",
      toId: "b",
      travelMinutes: 4,
      open: true,
      hasSteps: false,
      minimumClearanceMm: 1000,
      gradientPercent: 3,
      evidence: verified,
    },
    {
      id: "b-c",
      fromId: "b",
      toId: "c",
      travelMinutes: 5,
      open: true,
      hasSteps: false,
      minimumClearanceMm: 1000,
      gradientPercent: 2,
      evidence: verified,
    },
    {
      id: "a-c-stairs",
      fromId: "a",
      toId: "c",
      travelMinutes: 1,
      open: true,
      hasSteps: true,
      minimumClearanceMm: 1000,
      gradientPercent: 3,
      evidence: verified,
    },
  ];

  it("takes the shortest accessible verified path and still requires confirmation", () => {
    const result = findAccessibleRoute({
      originId: "a",
      destinationId: "c",
      segments,
      needs: {
        requireStepFree: true,
        maximumGradientPercent: 5,
        minimumClearanceMm: 850,
      },
      at,
    });
    expect(result.status).toBe("advisory_verified_route");
    expect(result.segmentIds).toEqual(["a-b", "b-c"]);
    expect(result.estimatedMinutes).toBe(9);
    expect(result.requiresRealWorldConfirmation).toBe(true);
  });

  it("fails closed on unknown step status and reported evidence", () => {
    const result = findAccessibleRoute({
      originId: "a",
      destinationId: "c",
      segments: [
        { ...segments[0]!, hasSteps: undefined },
        {
          ...segments[1]!,
          evidence: { ...verified, status: "reported" },
        },
      ],
      needs: { requireStepFree: true },
      at,
    });
    expect(result.status).toBe("no_verified_route");
    expect(result.excluded.length).toBeGreaterThanOrEqual(2);
  });

  it("does not declare a missing route physically impossible", () => {
    const result = findAccessibleRoute({
      originId: "a",
      destinationId: "unknown",
      segments,
      needs: { requireStepFree: true },
      at,
    });
    expect(result.status).toBe("no_verified_route");
  });

  it("orders dependencies before the goal and detects cycles", () => {
    const nodes = ["goal", "care", "transport"].map((id) => ({
      id,
      kind: "service" as const,
      active: true,
      evidence: verified,
    }));
    const links = [
      { fromId: "goal", toId: "care", relation: "requires" as const },
      { fromId: "goal", toId: "transport", relation: "requires" as const },
    ];
    const ok = planServiceDependencies({ targetId: "goal", nodes, links, at });
    expect(ok.status).toBe("verified_dependencies");
    expect(ok.orderedNodeIds).toEqual(["care", "transport", "goal"]);
    const cycle = planServiceDependencies({
      targetId: "goal",
      nodes,
      links: [...links, { fromId: "care", toId: "goal", relation: "requires" }],
      at,
    });
    expect(cycle.status).toBe("needs_review");
    expect(cycle.cycles.length).toBeGreaterThan(0);
  });

  it("creates a review need for a missing dependency instead of inventing a provider", () => {
    const result = planServiceDependencies({
      targetId: "goal",
      nodes: [{ id: "goal", kind: "goal", active: true, evidence: verified }],
      links: [{ fromId: "goal", toId: "missing-transport", relation: "requires" }],
      at,
    });
    expect(result.status).toBe("needs_review");
    expect(result.missingNodeIds).toEqual(["missing-transport"]);
  });

  it("suppresses small service-gap cells and preserves unknown supply", () => {
    const gaps = analyseServiceGaps({
      demands: [
        { region: "metro", service: "care", requestedUnits: 9 },
        { region: "rural", service: "care", requestedUnits: 3 },
        { region: "metro", service: "transport", requestedUnits: 7 },
      ],
      capacities: [
        {
          region: "metro",
          service: "care",
          availableUnits: 5,
          status: "verified",
        },
        {
          region: "metro",
          service: "transport",
          availableUnits: null,
          status: "unknown",
        },
      ],
      minimumAggregateCount: 5,
    });
    expect(gaps.find((gap) => gap.region === "rural")?.requestedUnits).toBeNull();
    expect(
      gaps.find((gap) => gap.service === "transport")?.unmetUnits,
    ).toBeNull();
    expect(
      gaps.find((gap) => gap.service === "care" && gap.region === "metro")
        ?.unmetUnits,
    ).toBe(4);
  });

  it("screens equity as a descriptive disparity, not a discrimination finding", () => {
    const result = auditServiceEquity({
      cohorts: [
        { cohortId: "region-a", eligibleServiceRequests: 20, fulfilledServiceRequests: 18 },
        { cohortId: "region-b", eligibleServiceRequests: 20, fulfilledServiceRequests: 2 },
        { cohortId: "small-region", eligibleServiceRequests: 4, fulfilledServiceRequests: 0 },
      ],
      minimumCohortSize: 10,
      reviewThresholdPercentagePoints: 0.15,
    });
    expect(result.visiblePooledRate).toBe(0.5);
    expect(
      result.findings.find((finding) => finding.cohortId === "small-region")
        ?.fulfilmentRate,
    ).toBeNull();
    expect(
      result.findings.filter((finding) => finding.requiresHumanInvestigation),
    ).toHaveLength(2);
  });
});

describe("service cartography scenarios, continuity and audit", () => {
  const needs = [
    { supportType: "care", requiredUnits: 20, estimatedUnitCostCentsAUD: 5000 },
    { supportType: "transport", requiredUnits: 4, estimatedUnitCostCentsAUD: 8000 },
  ];
  const scenario = {
    scenarioId: "scenario-a",
    label: "Policy assumption A",
    fundingCeilingCentsAUD: 100000,
    verifiedCapacityUnits: { care: 15, transport: null },
    politicalAttribution: "not attributed",
  };

  it("does not reduce stated need when the funding ceiling decreases", () => {
    const a = modelEconomicScenario({ needs, scenario });
    const b = modelEconomicScenario({
      needs,
      scenario: { ...scenario, fundingCeilingCentsAUD: 0 },
    });
    expect(a.requiredUnitsBySupportType).toEqual({ care: 20, transport: 4 });
    expect(b.requiredUnitsBySupportType).toEqual({ care: 20, transport: 4 });
    expect(a.estimatedCostOfStatedNeedsCentsAUD).toBe(132000);
    expect(a.estimatedFundingGapCentsAUD).toBe(32000);
    expect(b.estimatedFundingGapCentsAUD).toBe(132000);
    expect(a.knownCapacityGapUnits).toBe(5);
    expect(a.hasUnknownCapacity).toBe(true);
  });

  it("keeps political labels from affecting modelled outcomes", () => {
    const result = checkPolicyLabelInvariance({
      needs,
      scenario,
      alternativeLabel: "Different political label",
      alternativePoliticalAttribution: "Hypothetical administration",
    });
    expect(result.passed).toBe(true);
    expect(result.differences).toEqual([]);
  });

  it("rejects impossible or overflowing financial figures", () => {
    expect(() =>
      modelEconomicScenario({
        needs,
        scenario: { ...scenario, fundingCeilingCentsAUD: -1 },
      }),
    ).toThrow();
    expect(() =>
      modelEconomicScenario({
        needs: [
          {
            supportType: "care",
            requiredUnits: 10000000000000,
            estimatedUnitCostCentsAUD: 10000000000000,
          },
        ],
        scenario,
      }),
    ).toThrow();
  });

  it("models prototype-like support keys as data rather than inherited properties", () => {
    const result = modelEconomicScenario({
      needs: [
        {
          supportType: "constructor",
          requiredUnits: 2,
          estimatedUnitCostCentsAUD: 200,
        },
      ],
      scenario: { ...scenario, verifiedCapacityUnits: {} },
    });
    expect(result.requiredUnitsBySupportType.constructor).toBe(2);
    expect(result.hasUnknownCapacity).toBe(true);
  });

  it("alerts on operational continuity gaps without ranking participants", () => {
    const alerts = detectContinuityGaps([
      {
        id: "a",
        participantToken: "person-a",
        scheduledStart: "2026-11-19T00:00:00Z",
        status: "cancelled",
        fallbackConfirmed: false,
        criticalContinuity: true,
      },
      {
        id: "b",
        participantToken: "person-b",
        scheduledStart: "2026-11-19T00:00:00Z",
        status: "completed",
        fallbackConfirmed: false,
        criticalContinuity: true,
      },
      {
        id: "c",
        participantToken: "person-c",
        scheduledStart: "2026-11-19T00:00:00Z",
        status: "unknown",
        fallbackConfirmed: false,
        criticalContinuity: true,
      },
    ]);
    expect(alerts.map((alert) => alert.serviceId)).toEqual(["a", "c"]);
    expect(alerts.every((alert) => alert.action === "human_follow_up_required")).toBe(
      true,
    );
  });

  it("normalises audit provenance without raw participant data", () => {
    const result = createDecisionAuditEvent({
      eventId: "e1",
      algorithmId: "matching",
      algorithmVersion: "0.1.0",
      occurredAt: "2026-11-18T03:00:00Z",
      inputReferenceIds: ["b", "a", "a"],
      outcome: "advisory",
      reasonCodes: ["ok", "ok"],
      humanReviewRequired: true,
    });
    expect(result.inputReferenceIds).toEqual(["a", "b"]);
    expect(result.reasonCodes).toEqual(["ok"]);
  });
});
