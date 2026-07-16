import { calculatePersonalFit } from "../fit-engine";
import { buildAccessibleRoute } from "../route-engine";
import type { AccessPassport, AccessDecision, LiveIncident } from "../schemas";

import {
  HARBOUR_MUTATIONS,
  MAIN_LIFT_OUTAGE_INCIDENT,
  buildHarbourLivingTwin,
} from "./harbour-civic";
import type {
  CounterfactualResult,
  LivingAccessTwin,
  PersonalAccessTwin,
  VenueMutation,
} from "./schemas";
import { getAccessStateAt } from "./temporal";

function effortScore(effort: VenueMutation["estimatedEffort"]): number {
  switch (effort) {
    case "very_low":
      return 5;
    case "low":
      return 4;
    case "moderate":
      return 3;
    case "high":
      return 2;
    case "very_high":
      return 1;
    default: {
      const _exhaustive: never = effort;
      return _exhaustive;
    }
  }
}

function statusRank(status: AccessDecision["status"]): number {
  switch (status) {
    case "suitable":
      return 4;
    case "suitable_with_conditions":
      return 3;
    case "unknown":
      return 2;
    case "blocked":
      return 1;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function applyMutation(
  twin: LivingAccessTwin,
  mutation: VenueMutation,
): LivingAccessTwin {
  const next: LivingAccessTwin = {
    ...twin,
    features: twin.features.map((f) => ({ ...f })),
    edges: twin.edges.map((e) => ({ ...e })),
    incidents: twin.incidents.map((i) => ({ ...i })),
    operatingRules: twin.operatingRules.map((r) => ({ ...r })),
    updatedAt: new Date().toISOString(),
  };

  switch (mutation.mutationType) {
    case "change_opening_hours": {
      next.operatingRules = next.operatingRules.map((r) =>
        r.id === mutation.targetRuleId || r.elementId === mutation.targetElementId
          ? {
              ...r,
              closesAfterHourLocal:
                typeof mutation.after.closesAfterHourLocal === "number"
                  ? mutation.after.closesAfterHourLocal
                  : r.closesAfterHourLocal,
              effect: {
                ...r.effect,
                available:
                  typeof mutation.after.available === "boolean"
                    ? mutation.after.available
                    : r.effect.available,
                note: "Preview: extended hours (draft mutation).",
              },
            }
          : r,
      );
      break;
    }
    case "verify_unknown":
    case "add_quiet_waiting_space":
    case "add_staff_availability":
    case "add_feature":
    case "improve_signage": {
      next.features = next.features.map((f) => {
        if (
          (mutation.targetElementId && f.elementId === mutation.targetElementId) ||
          (mutation.targetFeatureType && f.featureType === mutation.targetFeatureType)
        ) {
          return {
            ...f,
            ...(mutation.after as Partial<typeof f>),
            disputed: false,
          };
        }
        return f;
      });
      if (
        mutation.targetFeatureType &&
        !next.features.some((f) => f.featureType === mutation.targetFeatureType)
      ) {
        next.features.push({
          id: `preview-${mutation.id}`,
          placeId: twin.place.id,
          elementId: mutation.targetElementId ?? "hcc-reception",
          featureType: mutation.targetFeatureType as (typeof next.features)[0]["featureType"],
          value: (mutation.after.value as boolean | string | number) ?? true,
          sourceType: "venue_attestation",
          observedAt: new Date().toISOString(),
          evidenceIds: [],
          confidence: 0.75,
          disputed: false,
          notes: "Preview mutation — not applied to baseline.",
        });
      }
      break;
    }
    case "resolve_dispute": {
      next.features = next.features.map((f) =>
        f.featureType === mutation.targetFeatureType
          ? {
              ...f,
              disputed: false,
              value: (mutation.after.value as boolean) ?? f.value,
              confidence: Number(mutation.after.confidence ?? 0.9),
            }
          : f,
      );
      break;
    }
    case "repair_element": {
      next.incidents = next.incidents.map((i) =>
        i.id === mutation.targetIncidentId || i.elementId === mutation.targetElementId
          ? { ...i, status: "resolved" as const }
          : i,
      );
      break;
    }
    case "remove_obstruction": {
      const ids = new Set(mutation.targetEdgeIds ?? []);
      next.edges = next.edges.map((e) =>
        ids.has(e.id)
          ? {
              ...e,
              temporaryBarrier: false,
              widthMm: Number(mutation.after.widthMm ?? e.widthMm ?? 1200),
            }
          : e,
      );
      break;
    }
    case "change_measurement":
    case "add_alternative_route":
    case "add_hearing_augmentation": {
      next.features = next.features.map((f) =>
        mutation.targetFeatureType && f.featureType === mutation.targetFeatureType
          ? { ...f, ...(mutation.after as Partial<typeof f>) }
          : f,
      );
      break;
    }
    default: {
      const _exhaustive: never = mutation.mutationType;
      return _exhaustive;
    }
  }
  return next;
}

export function evaluateDecisionForTwin(input: {
  twin: LivingAccessTwin;
  personalTwin: PersonalAccessTwin;
  visitAt?: string;
}): {
  decision: AccessDecision;
  routeSummary: string | null;
  routeInstructions: string[];
  rejectedRoutes: Array<{ summary: string; reasons: string[] }>;
  evidenceSummary: Array<{
    id: string;
    title: string;
    sourceType: string;
    sourceName: string;
    capturedAt: string;
    status: string;
    description?: string;
  }>;
  stateNotes: string[];
} {
  const visitAt =
    input.visitAt ??
    input.personalTwin.journeyContext.visitAt ??
    new Date().toISOString();
  const state = getAccessStateAt(input.twin, visitAt);
  const passport = mergePassport(input.personalTwin);
  const decision = calculatePersonalFit({
    place: input.twin.place,
    passport,
    features: state.effectiveFeatures,
    evidence: input.twin.evidence,
    incidents: state.activeIncidents,
    now: new Date(visitAt),
  });

  const destinationNode =
    input.twin.destinations.find((d) =>
      d.label
        .toLowerCase()
        .includes(input.personalTwin.journeyContext.destination.toLowerCase()),
    )?.nodeId ??
    input.twin.nodes.find((n) =>
      n.label
        .toLowerCase()
        .includes(input.personalTwin.journeyContext.destination.toLowerCase()),
    )?.id ??
    "n-hcc-room";

  const rejectedRoutes: Array<{ summary: string; reasons: string[] }> = [];
  let routeSummary: string | null = null;
  let routeInstructions: string[] = [];

  // Entrance A — typically rejected for step-free passports
  try {
    const fromA = buildAccessibleRoute({
      placeId: input.twin.place.id,
      nodes: input.twin.nodes,
      edges: state.effectiveEdges,
      passport,
      fromNodeId: "n-hcc-a",
      toNodeId: destinationNode,
      incidents: state.activeIncidents,
    });
    if (!fromA.recommended) {
      rejectedRoutes.push({
        summary: "Entrance A → destination",
        reasons:
          fromA.rejected[0]?.reasons ??
          ["No eligible route from Entrance A (stepped entry)."],
      });
    }
    for (const r of fromA.rejected) {
      if (!rejectedRoutes.some((x) => x.summary === r.summary)) {
        rejectedRoutes.push(r);
      }
    }
  } catch {
    rejectedRoutes.push({
      summary: "Entrance A → destination",
      reasons: ["Entrance A is not eligible under selected hard requirements."],
    });
  }

  if (!state.closedElementIds.includes("hcc-ent-b")) {
    try {
      const route = buildAccessibleRoute({
        placeId: input.twin.place.id,
        nodes: input.twin.nodes,
        edges: state.effectiveEdges,
        passport,
        fromNodeId: "n-hcc-b",
        toNodeId: destinationNode,
        incidents: state.activeIncidents,
      });
      if (route.recommended) {
        routeInstructions = route.recommended.steps.map((s) => s.instruction);
        routeSummary = routeInstructions.join(" → ");
        decision.recommendedRouteId = route.recommended.id;
        decision.alternatives = [
          ...decision.alternatives,
          `Recommended text route (Entrance B): ${routeSummary}`,
        ];
      } else {
        decision.alternatives = [
          ...decision.alternatives,
          "No eligible step-free route from Entrance B at this time.",
        ];
        for (const r of route.rejected) rejectedRoutes.push(r);
      }
    } catch {
      decision.alternatives = [
        ...decision.alternatives,
        "Route engine could not complete under current constraints.",
      ];
    }
  } else {
    decision.conditions.push("Entrance B closed at selected visit time.");
  }

  const evidenceSummary = input.twin.evidence.map((e) => ({
    id: e.id,
    title: e.title,
    sourceType: e.sourceType,
    sourceName: e.sourceName,
    capturedAt: e.capturedAt,
    status: e.status,
    description: e.description,
  }));

  return {
    decision,
    routeSummary,
    routeInstructions,
    rejectedRoutes,
    evidenceSummary,
    stateNotes: state.notes,
  };
}

function mergePassport(personal: PersonalAccessTwin): AccessPassport {
  return {
    ...personal.passport,
    requirements: [
      ...personal.passport.requirements,
      ...personal.journeyContext.temporaryRequirements,
    ],
  };
}

export function runCounterfactual(input: {
  twin: LivingAccessTwin;
  personalTwin: PersonalAccessTwin;
  mutation: VenueMutation;
  visitAt?: string;
  /** When true, ensure main-lift outage is present before mutation for repair demos. */
  withMainLiftOutage?: boolean;
}): CounterfactualResult {
  const baseIncidents: LiveIncident[] = input.withMainLiftOutage
    ? [...input.twin.incidents, MAIN_LIFT_OUTAGE_INCIDENT]
    : input.twin.incidents;
  const beforeTwin = { ...input.twin, incidents: baseIncidents };
  const before = evaluateDecisionForTwin({
    twin: beforeTwin,
    personalTwin: input.personalTwin,
    visitAt: input.visitAt,
  });
  const afterTwin = applyMutation(beforeTwin, input.mutation);
  const after = evaluateDecisionForTwin({
    twin: afterTwin,
    personalTwin: input.personalTwin,
    visitAt: input.visitAt,
  });

  const resolvedUnknowns = before.decision.unknowns.filter(
    (u) => !after.decision.unknowns.includes(u),
  );
  const remainingBlockers = after.decision.blockers;
  const newlyEligibleRoutes: string[] = [];
  if (
    before.routeSummary !== after.routeSummary &&
    after.routeSummary
  ) {
    newlyEligibleRoutes.push(after.routeSummary);
  }

  const statusImprovement =
    statusRank(after.decision.status) - statusRank(before.decision.status);

  return {
    mutation: input.mutation,
    beforeDecision: before.decision,
    afterDecision: after.decision,
    statusChanged: before.decision.status !== after.decision.status,
    newlyEligibleRoutes,
    resolvedUnknowns,
    remainingBlockers,
    explanation: `Mutation “${input.mutation.title}” ${
      before.decision.status !== after.decision.status
        ? `changes status from ${before.decision.status} to ${after.decision.status}`
        : "does not change decision status"
    }. Ranking factors are transparent planning aids, not moral judgements.`,
    rankingFactors: {
      statusImprovement,
      journeysImproved: statusImprovement > 0 ? 1 : 0,
      evidenceConfidenceDelta:
        after.decision.evidenceConfidence - before.decision.evidenceConfidence,
      effortScore: effortScore(input.mutation.estimatedEffort),
    },
  };
}

export function listDefaultMutations(): VenueMutation[] {
  return HARBOUR_MUTATIONS;
}

export function previewAllHarbourCounterfactuals(input: {
  personalTwin: PersonalAccessTwin;
  visitAt?: string;
}): CounterfactualResult[] {
  const twin = buildHarbourLivingTwin();
  return HARBOUR_MUTATIONS.map((mutation) =>
    runCounterfactual({
      twin,
      personalTwin: input.personalTwin,
      mutation,
      visitAt: input.visitAt,
      withMainLiftOutage: mutation.id === "mut-repair-main-lift",
    }),
  ).sort((a, b) => {
    if (b.rankingFactors.statusImprovement !== a.rankingFactors.statusImprovement) {
      return b.rankingFactors.statusImprovement - a.rankingFactors.statusImprovement;
    }
    return b.rankingFactors.effortScore - a.rankingFactors.effortScore;
  });
}

export { applyMutation, mergePassport };
