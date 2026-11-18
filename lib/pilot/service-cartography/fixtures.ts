import type {
  ConsentGrant,
  ConsentPurpose,
  Evidence,
  NeededSupport,
  PlannedService,
  PolicyScenario,
  ResourceSlot,
  RouteSegment,
  ServiceLink,
  ServiceNode,
  ServiceOffer,
  ServiceRequest,
} from "@mapable/service-cartography";

export const CARTOGRAPHY_AT = "2026-11-18T03:00:00Z";
export const CARTOGRAPHY_PARTICIPANT_ID = "synthetic-participant";
export const CARTOGRAPHY_GOAL_REF = "synthetic-community-visit";
export const CARTOGRAPHY_ALGORITHM_VERSION = "0.1.0";

export const syntheticVerifiedEvidence: Evidence = {
  sourceId: "SYNTHETIC-VERIFICATION",
  status: "verified",
  observedAt: "2026-11-17T00:00:00Z",
  expiresAt: "2026-12-01T00:00:00Z",
};

export const syntheticVisitRequest: ServiceRequest = {
  id: "synthetic-visit",
  participantId: CARTOGRAPHY_PARTICIPANT_ID,
  requiredCapabilities: ["community-access"],
  communicationRequirements: ["aac-text"],
  startsAt: "2026-11-19T00:00:00Z",
  endsAt: "2026-11-19T02:00:00Z",
  preferredProviderIds: ["provider-a"],
};

export const syntheticOffers: readonly ServiceOffer[] = [
  {
    id: "off-a",
    providerId: "provider-a",
    capabilities: ["community-access"],
    communicationSupports: ["aac-text"],
    availableFrom: "2026-11-18T00:00:00Z",
    availableUntil: "2026-11-20T00:00:00Z",
    confirmedAvailability: true,
    reliability: 0.93,
    estimatedTravelMinutes: 12,
    priceCentsAUD: 9500,
    evidence: syntheticVerifiedEvidence,
  },
  {
    id: "off-b",
    providerId: "provider-b",
    capabilities: ["community-access"],
    communicationSupports: ["aac-text"],
    availableFrom: "2026-11-18T00:00:00Z",
    availableUntil: "2026-11-20T00:00:00Z",
    confirmedAvailability: true,
    reliability: 0.88,
    estimatedTravelMinutes: 22,
    priceCentsAUD: 11000,
    evidence: syntheticVerifiedEvidence,
  },
];

export const syntheticVehicleSlot: ResourceSlot = {
  id: "slot-a",
  providerId: "provider-a",
  resourceIds: ["synthetic-vehicle-token"],
  capabilities: ["community-access"],
  communicationSupports: ["aac-text"],
  from: "2026-11-18T00:00:00Z",
  until: "2026-11-20T00:00:00Z",
  available: true,
  evidence: syntheticVerifiedEvidence,
};

export const syntheticRouteSegment: RouteSegment = {
  id: "accessible-path",
  fromId: "home",
  toId: "venue",
  travelMinutes: 8,
  open: true,
  hasSteps: false,
  evidence: syntheticVerifiedEvidence,
};

export const syntheticGraphNodes: readonly ServiceNode[] = [
  {
    id: "goal",
    kind: "goal",
    active: true,
    evidence: syntheticVerifiedEvidence,
  },
  {
    id: "care",
    kind: "service",
    active: true,
    evidence: syntheticVerifiedEvidence,
  },
  {
    id: "transport",
    kind: "transport",
    active: true,
    evidence: syntheticVerifiedEvidence,
  },
];

export const syntheticGraphLinks: readonly ServiceLink[] = [
  { fromId: "goal", toId: "care", relation: "requires" },
  { fromId: "goal", toId: "transport", relation: "requires" },
  { fromId: "goal", toId: "personal-care-fallback", relation: "requires" },
];

export const syntheticNeeds: readonly NeededSupport[] = [
  {
    supportType: "community-access",
    requiredUnits: 12,
    estimatedUnitCostCentsAUD: 9500,
  },
];

export const syntheticScenario: PolicyScenario = {
  scenarioId: "synthetic-fiscal-scenario",
  label: "Scenario Alpha",
  politicalAttribution: "N/A",
  fundingCeilingCentsAUD: 100000,
  verifiedCapacityUnits: { "community-access": 7 },
};

export const syntheticContinuityBaseline: readonly PlannedService[] = [
  {
    id: "synthetic-visit",
    participantToken: CARTOGRAPHY_PARTICIPANT_ID,
    scheduledStart: "2026-11-19T00:00:00Z",
    status: "confirmed",
    fallbackConfirmed: true,
    criticalContinuity: true,
  },
];

export function syntheticGrant(purpose: ConsentPurpose): ConsentGrant {
  return {
    grantId: `synthetic-${purpose}`,
    subjectId: CARTOGRAPHY_PARTICIPANT_ID,
    purpose,
    recipientIds: ["mapable-engine"],
    grantedAt: "2026-11-17T00:00:00Z",
    expiresAt: "2026-12-01T00:00:00Z",
  };
}

export function cloneOffers(): ServiceOffer[] {
  return syntheticOffers.map((offer) => ({
    ...offer,
    capabilities: [...offer.capabilities],
    communicationSupports: [...offer.communicationSupports],
    evidence: { ...offer.evidence },
  }));
}
