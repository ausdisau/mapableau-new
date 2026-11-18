import {
  ADVISORY_META,
  createDecisionAuditEvent,
  detectContinuityGaps,
  findAccessibleRoute,
  matchServices,
  modelEconomicScenario,
  planServiceDependencies,
  proposeServiceSchedule,
  type ConsentGrant,
  type ContinuityAlert,
  type DecisionAuditEvent,
  type DependencyPlan,
  type MatchResult,
  type PlannedService,
  type PolicyScenario,
  type ResourceSlot,
  type RouteResult,
  type RouteSegment,
  type ScheduleOutcome,
  type ScenarioExposure,
  type ServiceLink,
  type ServiceNode,
  type ServiceOffer,
  type ServiceRequest,
} from "@mapable/service-cartography";

import { createSyntheticCartographyAdapter } from "./adapter";
import {
  CARTOGRAPHY_ALGORITHM_VERSION,
  CARTOGRAPHY_AT,
  CARTOGRAPHY_GOAL_REF,
  CARTOGRAPHY_PARTICIPANT_ID,
  cloneOffers,
  syntheticContinuityBaseline,
  syntheticGraphLinks,
  syntheticGraphNodes,
  syntheticNeeds,
  syntheticRouteSegment,
  syntheticScenario,
  syntheticVehicleSlot,
  syntheticVisitRequest,
} from "./fixtures";
import type {
  CartographyAdapter,
  CartographyCallerContext,
  CartographyFailureMode,
} from "./types";

export type CartographyGoldenSlice = {
  sliceId: "community_visit";
  participantLabel: "synthetic-participant";
  goal: string;
  at: string;
  blocked: boolean;
  blockReason?: string;
  failureMode?: CartographyFailureMode;
  matching: MatchResult;
  graph: DependencyPlan;
  route: RouteResult;
  schedule: ScheduleOutcome;
  continuity: ContinuityAlert[];
  economic: ScenarioExposure;
  audit: DecisionAuditEvent;
  advisory: typeof ADVISORY_META;
  productionClaim: "none";
  autoAssignment: false;
  isBooking: false;
  missingDependencyExplanations: string[];
  notices: string[];
};

export type GoldenSliceInput = {
  failureMode?: CartographyFailureMode;
  context?: CartographyCallerContext;
  adapter?: CartographyAdapter;
};

type SliceWorkingSet = {
  request: ServiceRequest;
  offers: ServiceOffer[];
  matchingGrants: ConsentGrant[];
  schedulingGrants: ConsentGrant[];
  nodes: ServiceNode[];
  links: ServiceLink[];
  segments: RouteSegment[];
  slots: ResourceSlot[];
  planned: PlannedService[];
  scenario: PolicyScenario;
};

function simulateContext(): CartographyCallerContext {
  return {
    actorUserId: null,
    organisationId: null,
    source: "synthetic_simulate",
  };
}

function cloneWorkingSet(): SliceWorkingSet {
  return {
    request: { ...syntheticVisitRequest },
    offers: cloneOffers(),
    matchingGrants: [],
    schedulingGrants: [],
    nodes: syntheticGraphNodes.map((node) => ({
      ...node,
      evidence: { ...node.evidence },
    })),
    links: [...syntheticGraphLinks],
    segments: [{ ...syntheticRouteSegment, evidence: { ...syntheticRouteSegment.evidence } }],
    slots: [{ ...syntheticVehicleSlot, evidence: { ...syntheticVehicleSlot.evidence } }],
    planned: syntheticContinuityBaseline.map((item) => ({ ...item })),
    scenario: {
      ...syntheticScenario,
      verifiedCapacityUnits: { ...syntheticScenario.verifiedCapacityUnits },
    },
  };
}

function applyFailureMode(
  mode: CartographyFailureMode | undefined,
  set: SliceWorkingSet,
): SliceWorkingSet {
  if (!mode) return set;
  switch (mode) {
    case "consent_withdrawn":
      set.matchingGrants = set.matchingGrants.map((grant) => ({
        ...grant,
        revokedAt: "2026-11-17T12:00:00Z",
      }));
      set.schedulingGrants = set.schedulingGrants.map((grant) => ({
        ...grant,
        revokedAt: "2026-11-17T12:00:00Z",
      }));
      return set;
    case "stale_evidence":
      set.offers = set.offers.map((offer) => ({
        ...offer,
        evidence: { ...offer.evidence, expiresAt: "2026-11-18T00:00:00Z" },
      }));
      return set;
    case "unverified_provider":
      set.offers = set.offers.map((offer) => ({
        ...offer,
        evidence: { ...offer.evidence, status: "reported" },
      }));
      return set;
    case "communication_mismatch":
      set.offers = set.offers.map((offer) => ({
        ...offer,
        communicationSupports: [],
      }));
      return set;
    case "missing_transport_link":
      set.nodes = set.nodes.filter((node) => node.id !== "transport");
      return set;
    case "no_match":
      set.offers = [];
      return set;
    case "cancellation_without_fallback":
      set.planned = set.planned.map((item) => ({
        ...item,
        status: "cancelled",
        fallbackConfirmed: false,
      }));
      return set;
    case "unknown_supply":
      set.scenario = {
        ...set.scenario,
        verifiedCapacityUnits: { "community-access": null },
      };
      return set;
    default: {
      const _never: never = mode;
      throw new Error(`Unhandled cartography failure mode: ${_never}`);
    }
  }
}

function outcomeFor(slice: {
  blocked: boolean;
  matching: MatchResult;
}): DecisionAuditEvent["outcome"] {
  if (slice.blocked) return "blocked";
  if (slice.matching.status !== "advisory_options") return "no_confirmed_option";
  return "advisory";
}

export async function runGoldenSlice(
  input: GoldenSliceInput = {},
): Promise<CartographyGoldenSlice> {
  const context = input.context ?? simulateContext();
  const adapter = input.adapter ?? createSyntheticCartographyAdapter();
  const set = cloneWorkingSet();
  set.offers = await adapter.loadVerifiedOffersForGoal(CARTOGRAPHY_GOAL_REF, context);
  set.matchingGrants = await adapter.loadPurposeBoundGrant(
    CARTOGRAPHY_PARTICIPANT_ID,
    "service_matching",
    context,
  );
  set.schedulingGrants = await adapter.loadPurposeBoundGrant(
    CARTOGRAPHY_PARTICIPANT_ID,
    "service_scheduling",
    context,
  );
  applyFailureMode(input.failureMode, set);

  const matching = matchServices({
    request: set.request,
    offers: set.offers,
    grants: set.matchingGrants,
    at: CARTOGRAPHY_AT,
  });
  const graph = planServiceDependencies({
    targetId: "goal",
    nodes: set.nodes,
    links: set.links,
    at: CARTOGRAPHY_AT,
  });
  const route = findAccessibleRoute({
    originId: "home",
    destinationId: "venue",
    segments: set.segments,
    needs: { requireStepFree: true },
    at: CARTOGRAPHY_AT,
  });
  const schedule = proposeServiceSchedule({
    requests: [set.request],
    slots: set.slots,
    grants: set.schedulingGrants,
    at: CARTOGRAPHY_AT,
  });
  const continuity = detectContinuityGaps(set.planned);
  const economic = modelEconomicScenario({
    needs: syntheticNeeds,
    scenario: set.scenario,
  });

  const notices: string[] = [
    "Synthetic advisory preview only. This is not a booking, payment, NDIS claim, or live matching decision.",
  ];
  const missingDependencyExplanations = graph.missingNodeIds.map(
    (id) => `Required dependency '${id}' is missing from the verified service graph.`,
  );

  let blocked = false;
  let blockReason: string | undefined;
  const failureMode = input.failureMode;

  if (matching.status === "consent_required") {
    blocked = true;
    blockReason = "consent_required";
    notices.push("Purpose-bound consent is missing, revoked, or out of scope.");
  } else if (matching.status === "no_verified_match" || matching.ranked.length === 0) {
    blocked = true;
    blockReason = "no_verified_match";
    notices.push("No verified, consented, communication-accessible option is available.");
  } else if (failureMode === "missing_transport_link") {
    blocked = true;
    blockReason = "missing_transport_link";
    notices.push("The community visit still requires a verified transport dependency.");
  } else if (failureMode === "cancellation_without_fallback") {
    blocked = true;
    blockReason = "cancellation_without_fallback";
    notices.push("A critical service was cancelled without a confirmed fallback.");
  }

  if (failureMode === "unknown_supply") {
    notices.push("Verified capacity is unknown; unknown is not treated as zero supply.");
  }
  if (graph.status === "needs_review") {
    notices.push("Service dependencies need human review before any authorised action.");
  }
  if (matching.status === "advisory_options") {
    notices.push(
      "Ranked options require participant confirmation and human review; they cannot be executed by this engine.",
    );
  }

  const audit = createDecisionAuditEvent({
    eventId: `synthetic-slice-${failureMode ?? "baseline"}`,
    occurredAt: CARTOGRAPHY_AT,
    algorithmId: "MATCH-001",
    algorithmVersion: CARTOGRAPHY_ALGORITHM_VERSION,
    inputReferenceIds: [
      set.request.id,
      ...set.offers.map((offer) => offer.id),
      ...graph.missingNodeIds,
    ],
    outcome: outcomeFor({ blocked, matching }),
    reasonCodes: [
      matching.status,
      graph.status,
      route.status,
      ...(blockReason ? [blockReason] : []),
    ],
    humanReviewRequired: true,
  });
  await adapter.recordAdvisoryOutcome(audit, context);

  const slice: CartographyGoldenSlice = {
    sliceId: "community_visit",
    participantLabel: "synthetic-participant",
    goal: "Accessible community visit with optional care and transport",
    at: CARTOGRAPHY_AT,
    blocked,
    matching,
    graph,
    route,
    schedule,
    continuity,
    economic,
    audit,
    advisory: ADVISORY_META,
    productionClaim: "none",
    autoAssignment: false,
    isBooking: false,
    missingDependencyExplanations,
    notices,
  };
  if (blockReason) slice.blockReason = blockReason;
  if (failureMode) slice.failureMode = failureMode;
  return slice;
}
