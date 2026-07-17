import { randomUUID } from "crypto";

import { z } from "zod";

import { calculatePersonalFit } from "@/lib/access-intelligence/fit-engine";
import {
  buildHarbourAccessGraph,
  buildHarbourLivingTwin,
  HARBOUR_PLACE_ID,
  MAIN_LIFT_OUTAGE_INCIDENT,
} from "@/lib/access-intelligence/living/harbour-civic";
import { buildTaylorInterviewPassport } from "@/lib/access-intelligence/living/personal-twin";
import { getAccessStateAt } from "@/lib/access-intelligence/living/temporal";
import { buildAccessibleRoute } from "@/lib/access-intelligence/route-engine";
import type {
  AccessDecision,
  LiveIncident,
} from "@/lib/access-intelligence/schemas";

import { auraFlags } from "../feature-flags";
import { assertLease } from "../leases";
import type { AuraMissionRecord } from "../mission/store";
import { requireMission, saveMission } from "../mission/store";
import { assertMissionNotStopped, getAbortSignal } from "../stop";
import { appendWitness } from "../witness";

export const auraCounterfactualMutationSchema = z.object({
  category: z.enum([
    "environment",
    "time",
    "evidence",
    "route",
    "support",
    "transport",
    "communication",
  ]),
  targetId: z.string().optional(),
  featureType: z.string().optional(),
  operation: z.enum([
    "set_available",
    "set_unavailable",
    "set_value",
    "set_time",
    "confirm_present",
    "confirm_absent",
    "mark_unknown",
    "resolve_dispute",
  ]),
  value: z.union([z.boolean(), z.number(), z.string()]).optional(),
  unit: z.string().optional(),
  simulated: z.literal(true),
  label: z.string().min(1),
});

export const auraCounterfactualInputSchema = z.object({
  missionId: z.string(),
  basePlanId: z.string(),
  mutation: auraCounterfactualMutationSchema,
});

export type AuraCounterfactualInput = z.infer<
  typeof auraCounterfactualInputSchema
>;

type Snapshot = {
  status: AccessDecision["status"];
  routeId?: string;
  evidenceConfidence: number;
  liveReliability: number;
  blockers: string[];
  unknowns: string[];
  conditions: string[];
  routeNodeIds?: string[];
  additionalDistanceMetres?: number;
  additionalMinutes?: number;
};

export type AuraCounterfactualResult = {
  id: string;
  missionId: string;
  basePlanId: string;
  mutation: AuraCounterfactualInput["mutation"];
  before: Snapshot;
  after: Snapshot;
  changeSummary: {
    statusChanged: boolean;
    routeChanged: boolean;
    newlyBlocked: string[];
    newlyUnknown: string[];
    resolvedUnknowns: string[];
    newlyAvailableAlternatives: string[];
    lostAlternatives: string[];
    additionalDistanceMetres?: number;
    additionalMinutes?: number;
  };
  evidenceReferences: string[];
  deterministicEngineVersions: string[];
  simulated: true;
  generatedAt: string;
  expiresAt: string;
  disclaimer: string;
};

const runs = new Map<string, AuraCounterfactualResult[]>();
const MAX_PER_MISSION = 12;

export function resetCounterfactualStore(): void {
  runs.clear();
}

export function listCounterfactuals(
  missionId: string,
): AuraCounterfactualResult[] {
  return runs.get(missionId) ?? [];
}

function snapshotFromEngines(input: {
  incidents: LiveIncident[];
  featuresOverride?: ReturnType<typeof buildHarbourLivingTwin>["features"];
  visitAt?: string;
  operatingRules?: ReturnType<typeof buildHarbourLivingTwin>["operatingRules"];
}): Snapshot {
  const twin = buildHarbourLivingTwin({
    incidents: input.incidents,
    features: input.featuresOverride,
    operatingRules: input.operatingRules,
  });
  const visitAt = input.visitAt ?? new Date().toISOString();
  const state = getAccessStateAt(twin, visitAt);
  const passport = buildTaylorInterviewPassport("demo-participant-taylor");
  const fit = calculatePersonalFit({
    place: twin.place,
    passport,
    features: state.effectiveFeatures,
    evidence: twin.evidence,
    incidents: state.activeIncidents,
    now: new Date(visitAt),
  });
  const graph = buildHarbourAccessGraph();
  let routeId: string | undefined;
  let routeNodeIds: string[] | undefined;
  let additionalDistanceMetres: number | undefined;
  let additionalMinutes: number | undefined;
  if (!state.closedElementIds.includes("hcc-ent-b")) {
    try {
      const route = buildAccessibleRoute({
        placeId: HARBOUR_PLACE_ID,
        nodes: graph.nodes,
        edges: state.effectiveEdges,
        passport,
        fromNodeId: "n-hcc-drop",
        toNodeId: "n-hcc-room",
        incidents: state.activeIncidents,
      });
      if (route.recommended) {
        routeId = route.recommended.id;
        routeNodeIds = route.recommended.nodeIds;
        additionalDistanceMetres = route.recommended.totalDistanceMetres;
        additionalMinutes = route.recommended.estimatedAdditionalMinutes;
      }
    } catch {
      /* no route */
    }
  }
  return {
    status: fit.status,
    routeId,
    evidenceConfidence: fit.evidenceConfidence ?? 0.7,
    liveReliability: fit.liveReliability ?? 0.7,
    blockers: fit.blockers ?? [],
    unknowns: fit.unknowns ?? [],
    conditions: fit.conditions ?? [],
    routeNodeIds,
    additionalDistanceMetres,
    additionalMinutes,
  };
}

function baseIncidents(): LiveIncident[] {
  return [{ ...MAIN_LIFT_OUTAGE_INCIDENT, status: "active" as const }];
}

/**
 * Apply allowlisted simulated mutation onto a copy of Harbour twin state.
 * Does not mutate production venue evidence or the base mission plan.
 */
function applySimulatedMutation(
  mutation: AuraCounterfactualInput["mutation"],
  base: LiveIncident[],
): {
  incidents: LiveIncident[];
  features?: ReturnType<typeof buildHarbourLivingTwin>["features"];
  visitAt?: string;
  operatingRules?: ReturnType<typeof buildHarbourLivingTwin>["operatingRules"];
} {
  const twin = buildHarbourLivingTwin({ incidents: base });
  let incidents = [...base];
  let features = twin.features.map((f) => ({ ...f }));
  let visitAt: string | undefined;
  const operatingRules = twin.operatingRules.map((r) => ({ ...r }));

  const label = mutation.label.toLowerCase();

  if (mutation.category === "environment" || mutation.category === "route") {
    if (
      mutation.operation === "set_unavailable" &&
      /western.?lift|west.?lift|hcc-lift-west/i.test(
        label + (mutation.targetId ?? ""),
      )
    ) {
      incidents = [
        ...incidents,
        {
          id: "inc-sim-west-lift",
          placeId: HARBOUR_PLACE_ID,
          elementId: "hcc-lift-west",
          type: "lift_outage",
          severity: "critical",
          description: "SIMULATED: Western lift unavailable.",
          sourceType: "system_feed",
          reportedAt: new Date().toISOString(),
          status: "active",
          affectedEdgeIds: ["e-hcc-west-lift", "e-hcc-west-corr"],
        },
      ];
    }
    if (
      mutation.operation === "set_unavailable" &&
      /entrance.?b|hcc-ent-b/i.test(label + (mutation.targetId ?? ""))
    ) {
      incidents = [
        ...incidents,
        {
          id: "inc-sim-ent-b",
          placeId: HARBOUR_PLACE_ID,
          elementId: "hcc-ent-b",
          type: "locked_entrance",
          severity: "high",
          description: "SIMULATED: Entrance B closed.",
          sourceType: "system_feed",
          reportedAt: new Date().toISOString(),
          status: "active",
          affectedEdgeIds: ["e-hcc-b-rec", "e-hcc-drop-b"],
        },
      ];
    }
  }

  if (mutation.category === "time" && mutation.operation === "set_time") {
    // Temporal engine uses UTC+10 Sydney approximation. 09:00Z → local hour 19.
    // Entrance B closes after local 18:00 unless special access is arranged.
    const eveningIso = "2026-07-16T09:00:00.000Z";
    visitAt = typeof mutation.value === "string" ? mutation.value : eveningIso;
  }

  if (mutation.category === "evidence") {
    if (
      mutation.operation === "confirm_present" &&
      /toilet/i.test(label + (mutation.featureType ?? ""))
    ) {
      features = features.map((f) =>
        f.featureType === "accessible_toilet"
          ? {
              ...f,
              value: true,
              notes:
                "SIMULATED confirmation — not applied to production evidence.",
              observedAt: new Date().toISOString(),
              confidence: 0.9,
            }
          : f,
      );
    }
    if (
      mutation.operation === "confirm_absent" &&
      /toilet/i.test(label + (mutation.featureType ?? ""))
    ) {
      features = features.map((f) =>
        f.featureType === "accessible_toilet"
          ? {
              ...f,
              value: false,
              notes: "SIMULATED absence — not applied to production evidence.",
              observedAt: new Date().toISOString(),
            }
          : f,
      );
    }
  }

  if (
    mutation.category === "support" &&
    mutation.operation === "confirm_present" &&
    /reception|staff/i.test(label)
  ) {
    features = features.map((f) =>
      f.featureType === "staff_assistance"
        ? {
            ...f,
            value: true,
            notes: "SIMULATED reception assistance confirmed.",
          }
        : f,
    );
  }

  // communication category — usability only; do not alter physical route
  return { incidents, features, visitAt, operatingRules };
}

function rejectsHardRequirementWeakening(
  mutation: AuraCounterfactualInput["mutation"],
): void {
  // Never allow a mutation that silently drops a hard requirement from the passport
  if (
    mutation.operation === "set_unavailable" &&
    mutation.featureType === "step_free" &&
    /requirement|passport|weaken/i.test(mutation.label)
  ) {
    throw new Error("AURA_CF_HARD_REQUIREMENT_PROTECTED");
  }
}

const SUPPORTED_MUTATION_KEYS = new Set([
  "environment:set_unavailable",
  "route:set_unavailable",
  "time:set_time",
  "evidence:confirm_present",
  "evidence:confirm_absent",
  "evidence:mark_unknown",
  "evidence:resolve_dispute",
  "support:confirm_present",
  "support:confirm_absent",
  "support:set_unavailable",
  "transport:set_unavailable",
  "transport:set_time",
  "communication:set_value",
]);

function assertSupportedMutation(
  mutation: AuraCounterfactualInput["mutation"],
): void {
  const key = `${mutation.category}:${mutation.operation}`;
  if (!SUPPORTED_MUTATION_KEYS.has(key)) {
    throw new Error("AURA_CF_UNSUPPORTED_MUTATION");
  }
}

export function runCounterfactual(
  raw: AuraCounterfactualInput,
  userId: string,
): AuraCounterfactualResult {
  if (!auraFlags.counterfactuals && process.env.NODE_ENV !== "test") {
    throw new Error("MAPABLE_AURA_COUNTERFACTUALS_DISABLED");
  }

  const input = auraCounterfactualInputSchema.parse(raw);
  if (input.mutation.simulated !== true) {
    throw new Error("AURA_CF_MUST_BE_SIMULATED");
  }

  const mission = requireMission(input.missionId);
  if (mission.participantId !== userId) {
    throw new Error("AURA_MISSION_FORBIDDEN");
  }
  assertMissionNotStopped(mission);
  assertLease(input.missionId, "access.counterfactuals");

  if (!mission.plan || mission.plan.id !== input.basePlanId) {
    // allow if basePlanId matches current plan
    if (mission.plan?.id !== input.basePlanId) {
      throw new Error("AURA_CF_BASE_PLAN_MISMATCH");
    }
  }
  if (mission.plan && Date.parse(mission.plan.expiresAt) <= Date.now()) {
    throw new Error("AURA_PLAN_EXPIRED");
  }

  const existing = runs.get(input.missionId) ?? [];
  if (existing.length >= MAX_PER_MISSION) {
    throw new Error("AURA_CF_LIMIT");
  }

  const signal = getAbortSignal(input.missionId);
  if (signal?.aborted) {
    throw new Error("AURA_MISSION_STOPPED");
  }

  rejectsHardRequirementWeakening(input.mutation);
  assertSupportedMutation(input.mutation);

  appendWitness({
    missionId: input.missionId,
    type: "counterfactual.started",
    summary: `Counterfactual started: ${input.mutation.label}`,
    correlationId: mission.correlationId,
    payload: { mutationLabel: input.mutation.label, simulated: true },
  });

  const before = snapshotFromEngines({ incidents: baseIncidents() });
  const applied = applySimulatedMutation(input.mutation, baseIncidents());
  const after = snapshotFromEngines({
    incidents: applied.incidents,
    featuresOverride: applied.features,
    visitAt: applied.visitAt,
    operatingRules: applied.operatingRules,
  });

  if (signal?.aborted || requireMission(input.missionId).stopState) {
    appendWitness({
      missionId: input.missionId,
      type: "counterfactual.cancelled",
      summary: "Counterfactual cancelled due to Stop AURA",
      correlationId: mission.correlationId,
    });
    throw new Error("AURA_MISSION_STOPPED");
  }

  const newlyBlocked = after.blockers.filter(
    (b) => !before.blockers.includes(b),
  );
  const newlyUnknown = after.unknowns.filter(
    (u) => !before.unknowns.includes(u),
  );
  const resolvedUnknowns = before.unknowns.filter(
    (u) => !after.unknowns.some((a) => a.includes(u.slice(0, 12))),
  );

  const result: AuraCounterfactualResult = {
    id: randomUUID(),
    missionId: input.missionId,
    basePlanId: input.basePlanId,
    mutation: input.mutation,
    before,
    after,
    changeSummary: {
      statusChanged: before.status !== after.status,
      routeChanged: before.routeId !== after.routeId,
      newlyBlocked,
      newlyUnknown,
      resolvedUnknowns,
      newlyAvailableAlternatives: [],
      lostAlternatives:
        before.routeId && !after.routeId
          ? ["Preferred simulated route became ineligible"]
          : [],
      additionalDistanceMetres:
        after.additionalDistanceMetres != null &&
        before.additionalDistanceMetres != null
          ? after.additionalDistanceMetres - before.additionalDistanceMetres
          : undefined,
      additionalMinutes:
        after.additionalMinutes != null && before.additionalMinutes != null
          ? after.additionalMinutes - before.additionalMinutes
          : undefined,
    },
    evidenceReferences: mission.plan?.evidence.map((e) => e.evidenceId) ?? [],
    deterministicEngineVersions: [
      "access-intelligence.fit-engine@1",
      "access-intelligence.route-engine@1",
      "access-intelligence.temporal@1",
      "aura.counterfactual-adapter@1",
    ],
    simulated: true,
    generatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    disclaimer:
      "Simulated scenario. No real venue, transport, care or booking state was changed.",
  };

  runs.set(input.missionId, [...existing, result]);

  // Base mission plan must remain unchanged
  saveMission({ ...mission });

  appendWitness({
    missionId: input.missionId,
    type: "counterfactual.completed",
    summary: `Counterfactual completed: ${input.mutation.label} → ${after.status}`,
    correlationId: mission.correlationId,
    payload: {
      resultId: result.id,
      simulated: true,
      statusBefore: before.status,
      statusAfter: after.status,
      routeChanged: result.changeSummary.routeChanged,
    },
    evidenceReferences: result.evidenceReferences,
  });

  return result;
}

/** Ensure access.counterfactuals capability exists when access module leased. */
export function ensureCounterfactualCapability(
  _mission: AuraMissionRecord,
): void {
  // leased via MODULE_CAPABILITIES when access module selected — Wave 2 also maps plan.challenge
}
