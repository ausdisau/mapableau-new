import { createHash, randomUUID } from "crypto";

import {
  defaultConfidenceHorizon,
  defaultForecastExpiry,
  isEvidenceFresh,
  resolveHorizon,
} from "./evidence";
import { accessCastFlags } from "./flags";
import {
  getHarbourAccessCastFixture,
  HARBOUR_ACCESSCAST_IDS,
  type HarbourSegmentSpec,
} from "./harbour-fixture";
import { aggregateJourneyState, calculateAccessCastState } from "./rules";
import {
  ACCESS_CAST_STATE_PLAIN_LANGUAGE,
  type AccessCastState,
} from "./states";
import type {
  AccessCastConfirmationTask,
  AccessCastMapListItem,
  AccessCastRequest,
  AccessCastResult,
  AccessCastSegmentOutlook,
  AccessCastTimelineItem,
  AccessCastSyntheticScenarioId,
} from "./types";

function auditId(seed: string): string {
  return createHash("sha256").update(seed).digest("hex").slice(0, 24);
}

function segmentStateFromSpec(
  spec: HarbourSegmentSpec,
  overallHints: {
    hasActiveVerifiedBlocker: boolean;
    hasConflicts: boolean;
    offlineBeyondExpiry: boolean;
  },
): AccessCastState {
  if (overallHints.offlineBeyondExpiry) return "stale";
  if (overallHints.hasConflicts && spec.nodeIds.includes(HARBOUR_ACCESSCAST_IDS.liftA)) {
    return "conflicting";
  }
  if (spec.hardRequirementEffect === "blocks") return "temporarily_unavailable";
  if (spec.hardRequirementEffect === "unresolved") {
    if (spec.isSpof) return "fragile";
    return "cannot_confirm";
  }
  if (spec.freshness === "stale") return "stale";
  if (spec.hardRequirementEffect === "supports" && spec.freshness === "fresh") {
    return "stable";
  }
  return "likely_usable";
}

function buildSegments(
  specs: HarbourSegmentSpec[],
  hints: {
    hasActiveVerifiedBlocker: boolean;
    hasConflicts: boolean;
    offlineBeyondExpiry: boolean;
  },
): AccessCastSegmentOutlook[] {
  return specs.map((spec) => {
    const currentState = segmentStateFromSpec(spec, hints);
    const confirmationTask: AccessCastConfirmationTask | null = spec.confirmationLabel
      ? {
          id: `task-${spec.id}`,
          label: spec.confirmationLabel,
          status: "suggested",
          responsibleOrganisation: spec.responsibleOrganisation,
          dueAt: null,
          segmentId: spec.id,
        }
      : null;

    return {
      id: spec.id,
      kind: spec.kind,
      label: spec.label,
      currentState,
      futureState: null,
      evidenceSummary: spec.evidenceSummary,
      evidenceClass: spec.evidenceClass,
      freshness: spec.freshness,
      reliability: spec.reliability,
      hardRequirementEffect: spec.hardRequirementEffect,
      fallback:
        spec.isSpof && spec.hardRequirementEffect !== "supports"
          ? {
              id: `fb-${spec.id}`,
              label: "No verified fallback for this segment",
              verified: false,
              summary: "No fully verified fallback is currently known for this segment.",
              limitations: [],
            }
          : null,
      confirmationTask,
      responsibleOrganisation: spec.responsibleOrganisation,
      nodeIds: spec.nodeIds,
    };
  });
}

function buildTimeline(
  intendedJourneyTime: string,
  hints: HarbourAccessCastTimelineHints[],
): AccessCastTimelineItem[] {
  const base = new Date(intendedJourneyTime).getTime();
  return hints.map((h, i) => ({
    id: `tl-${i}`,
    at: new Date(base + h.offsetMinutes * 60 * 1000).toISOString(),
    label: h.label,
    kind: h.kind as AccessCastTimelineItem["kind"],
    relatedSegmentId: null,
  }));
}

type HarbourAccessCastTimelineHints = {
  offsetMinutes: number;
  label: string;
  kind: string;
};

function buildListAlternative(
  segments: AccessCastSegmentOutlook[],
  conditions: ReturnType<typeof getHarbourAccessCastFixture>["conditions"],
  state: AccessCastState,
): AccessCastMapListItem[] {
  const items: AccessCastMapListItem[] = segments.map((s) => ({
    id: `list-${s.id}`,
    label: s.label,
    mapState:
      s.currentState === "temporarily_unavailable"
        ? "known_disrupted"
        : s.currentState === "stale"
          ? "stale"
          : s.currentState === "conflicting"
            ? "conflicting"
            : s.currentState === "stable" || s.currentState === "likely_usable"
              ? "known_available"
              : s.currentState === "unknown"
                ? "unknown"
                : "unknown",
    summary: `${s.currentState}: ${s.evidenceSummary}`,
    nodeId: s.nodeIds[0] ?? null,
  }));

  for (const c of conditions) {
    items.push({
      id: `list-cond-${c.id}`,
      label: c.label,
      mapState: c.kind === "construction" ? "scheduled_change" : "unknown",
      summary: c.summary,
      nodeId: c.affectsNodeIds[0] ?? null,
    });
  }

  items.push({
    id: "list-overall",
    label: "Overall Access Outlook",
    mapState:
      state === "temporarily_unavailable"
        ? "known_disrupted"
        : state === "stale"
          ? "stale"
          : state === "conflicting"
            ? "conflicting"
            : state === "stable" || state === "likely_usable"
              ? "known_available"
              : "unknown",
    summary: ACCESS_CAST_STATE_PLAIN_LANGUAGE[state],
    nodeId: HARBOUR_ACCESSCAST_IDS.placeNodeId,
  });

  return items;
}

/**
 * Deterministic AccessCast forecast pipeline (synthetic Harbour fixtures).
 * Does not write to places, trips, incidents, or participant requirements.
 */
export function runAccessCastForecast(request: AccessCastRequest): AccessCastResult {
  if (!accessCastFlags.allowSyntheticExecution) {
    throw new Error("AccessCast synthetic execution is disabled");
  }

  const scenario: AccessCastSyntheticScenarioId =
    request.scenario ??
    (request.journeyRef ? "starting_work_tomorrow" : "harbour_place_baseline");

  const asOf = request.asOf ?? new Date().toISOString();
  const fixture = getHarbourAccessCastFixture(
    scenario,
    request.intendedJourneyTime,
    asOf,
  );

  const horizon = resolveHorizon(fixture.intendedJourneyTime, fixture.asOf);
  const generatedAt = fixture.asOf;

  const criticalStale =
    fixture.criticalEvidenceStale ||
    fixture.evidence.some(
      (e) =>
        (e.ontologyConceptId === "physical.lift_operational" ||
          e.ontologyConceptId === "transport.accessible_vehicle") &&
        !isEvidenceFresh(e, fixture.asOf),
    );

  const state = calculateAccessCastState({
    requirements: fixture.requirements,
    hasActiveVerifiedBlocker: fixture.hasActiveVerifiedBlocker,
    hasConflicts: fixture.hasConflicts,
    criticalEvidenceStale: criticalStale,
    hasSinglePointOfFailure: fixture.hasSinglePointOfFailure,
    fallback: fixture.fallback,
    hasAdditionalBurden: fixture.hasAdditionalBurden,
    blockingEvidenceClasses: fixture.blockingEvidenceClasses,
    offlineBeyondExpiry: fixture.offlineBeyondExpiry,
    horizon,
    serviceRequestedButUnconfirmed: fixture.serviceRequestedButUnconfirmed,
    overlappingUncertaintyOnHardRequirement:
      fixture.overlappingUncertaintyOnHardRequirement,
  });

  const segments = buildSegments(fixture.segmentSpecs, {
    hasActiveVerifiedBlocker: fixture.hasActiveVerifiedBlocker,
    hasConflicts: fixture.hasConflicts,
    offlineBeyondExpiry: fixture.offlineBeyondExpiry,
  });

  const hardSegmentFailed = segments.some(
    (s) =>
      s.hardRequirementEffect === "blocks" ||
      (s.hardRequirementEffect === "unresolved" &&
        s.currentState === "temporarily_unavailable"),
  );

  const journeyState = aggregateJourneyState(
    segments.map((s) => s.currentState),
    hardSegmentFailed,
  );

  // Whole journey must not hide a worse segment; prefer rule state when stricter
  const conclusionState =
    scenario === "harbour_place_baseline"
      ? state
      : aggregateJourneyState([state, journeyState], hardSegmentFailed);

  const forecastId = `accesscast_${scenario}_${randomUUID().slice(0, 8)}`;
  const confidenceHorizon = defaultConfidenceHorizon(
    fixture.intendedJourneyTime,
    horizon,
  );
  const expiry = fixture.offlineBeyondExpiry
    ? new Date(new Date(generatedAt).getTime() - 60 * 60 * 1000).toISOString()
    : defaultForecastExpiry(generatedAt, horizon);

  const confirmationTasks: AccessCastConfirmationTask[] = segments
    .filter((s) => s.confirmationTask)
    .map((s) => s.confirmationTask!);

  const matched = fixture.requirements.filter((r) => r.status === "matched");
  const failed = fixture.requirements.filter((r) => r.status === "failed");
  const unresolved = fixture.requirements.filter((r) => r.status === "unresolved");

  const oldest = fixture.evidence.reduce<string | null>((acc, e) => {
    if (!acc || e.observedAt < acc) return e.observedAt;
    return acc;
  }, null);
  const newest = fixture.evidence.reduce<string | null>((acc, e) => {
    if (!acc || e.observedAt > acc) return e.observedAt;
    return acc;
  }, null);

  const staleConceptIds = fixture.evidence
    .filter((e) => e.ontologyConceptId && !isEvidenceFresh(e, fixture.asOf))
    .map((e) => e.ontologyConceptId!)
    .filter((v, i, a) => a.indexOf(v) === i);

  const timeline = accessCastFlags.timeline || accessCastFlags.allowSyntheticExecution
    ? buildTimeline(fixture.intendedJourneyTime, fixture.timelineHints)
    : [];

  const placeRef = request.placeId ?? fixture.placeRef;
  const journeyRef =
    request.journeyRef ??
    (scenario === "harbour_place_baseline"
      ? placeRef
      : `journey:synthetic:taylor-harbour:${scenario}`);

  return {
    envelope: {
      forecastId,
      journeyOrPlaceRef: journeyRef,
      requirementSetRef: request.requirementSetRef ?? fixture.requirementSetRef,
      forecastGenerationTime: generatedAt,
      intendedJourneyTime: fixture.intendedJourneyTime,
      horizon,
      conclusionState,
      matchedRequirements: matched,
      failedRequirements: failed,
      unresolvedRequirements: unresolved,
      conditions: fixture.conditions,
      sourceEvidence: fixture.evidence,
      evidenceClasses: [...new Set(fixture.evidence.map((e) => e.class))],
      freshness: {
        oldestEvidenceAt: oldest,
        newestEvidenceAt: newest,
        staleConceptIds,
      },
      reliability: fixture.reliability,
      conflicts: fixture.hasConflicts
        ? ["Venue declaration vs recent participant observation for Lift A"]
        : [],
      assumptions: [
        "Synthetic Harbour Civic fixture IDs are placeholders, not production AccessPlace IDs",
        "Participant requirements are fixture-selected functional requirements, not a diagnosis",
      ],
      fallback: fixture.fallback,
      confirmationTasks,
      confidenceHorizon,
      expiry,
      auditCorrelationId: auditId(`${forecastId}:${journeyRef}`),
      limitations: fixture.limitations,
      operatingMode: accessCastFlags.mode,
      synthetic: true,
      productionClaim: "none",
    },
    plainLanguageSummary: [
      `Access outlook for ${fixture.journeyLabel}.`,
      `State: ${conclusionState}.`,
      ACCESS_CAST_STATE_PLAIN_LANGUAGE[conclusionState],
    ].join(" "),
    why: fixture.why,
    suggestedChecks: fixture.suggestedChecks,
    segments,
    timeline,
    advisories: fixture.conditions.map((c) => ({
      id: `adv-${c.id}`,
      title: c.label,
      body: c.summary,
      state: conclusionState,
      placeRef: fixture.placeRef,
      nodeIds: c.affectsNodeIds,
      evidenceIds: [],
      effectiveFrom: c.effectiveFrom,
      expiresAt: c.effectiveTo,
    })),
    listAlternative: buildListAlternative(segments, fixture.conditions, conclusionState),
    recoveryBuffer:
      conclusionState === "fragile" || conclusionState === "cannot_confirm"
        ? {
            recommendedMinutes: 15,
            summary:
              "Allow at least 15 minutes recovery buffer and complete confirmation checks before departure.",
          }
        : null,
    fragilityWindows:
      conclusionState === "fragile"
        ? [
            {
              id: "fw-lift-vehicle",
              from: confidenceHorizon,
              to: fixture.intendedJourneyTime,
              reason:
                "Journey depends on unconfirmed accessible vehicle and/or unverified lift status",
              segmentId: "seg-lift",
            },
          ]
        : [],
  };
}

/** Place outlook helper — Harbour Civic Centre synthetic. */
export function runHarbourPlaceOutlook(input?: {
  intendedJourneyTime?: string;
  asOf?: string;
  scenario?: AccessCastSyntheticScenarioId;
}): AccessCastResult {
  return runAccessCastForecast({
    placeId: HARBOUR_ACCESSCAST_IDS.placeCanonicalRef,
    intendedJourneyTime:
      input?.intendedJourneyTime ?? "2026-07-17T08:30:00.000+10:00",
    asOf: input?.asOf ?? "2026-07-16T18:00:00.000+10:00",
    scenario: input?.scenario ?? "harbour_place_baseline",
  });
}
