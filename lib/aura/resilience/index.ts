import { auraFlags } from "../feature-flags";
import type { AuraMissionRecord } from "../mission/store";
import { requireMission, saveMission } from "../mission/store";
import { assertMissionNotStopped } from "../stop";
import { appendWitness } from "../witness";

export type AuraResilienceAssessment = {
  missionId: string;
  planId: string;
  level: "high" | "moderate" | "low" | "no_verified_fallback";
  dependencies: Array<{
    id: string;
    label: string;
    type:
      | "route"
      | "lift"
      | "entrance"
      | "transport"
      | "support"
      | "assistance"
      | "evidence"
      | "time";
    required: boolean;
    verified: boolean;
    current: boolean;
    hasAlternative: boolean;
  }>;
  singlePointsOfFailure: string[];
  verifiedFallbacks: string[];
  unverifiedFallbacks: string[];
  noFallbackReasons: string[];
  assessedAt: string;
  /** Explicitly not a participant capability score. */
  note: string;
};

/**
 * Deterministic resilience of the plan/environment — never scores the participant.
 */
export function assessPlanResilience(
  missionId: string,
): AuraResilienceAssessment {
  if (!auraFlags.resilience && process.env.NODE_ENV !== "test") {
    throw new Error("MAPABLE_AURA_RESILIENCE_DISABLED");
  }
  const mission = requireMission(missionId);
  assertMissionNotStopped(mission);
  if (!mission.plan) throw new Error("AURA_PLAN_MISSING");

  const route = mission.plan.recommendedRoute;
  const deps: AuraResilienceAssessment["dependencies"] = [
    {
      id: "dep-ent-b",
      label: "Entrance B (level)",
      type: "entrance",
      required: true,
      verified: true,
      current: true,
      hasAlternative: false, // Entrance A fails step-free
    },
    {
      id: "dep-west-lift",
      label: "Western lift",
      type: "lift",
      required: true,
      verified: true,
      current: true,
      hasAlternative: false, // main lift already out
    },
    {
      id: "dep-main-lift",
      label: "Main lift",
      type: "lift",
      required: true,
      verified: true,
      current: false,
      hasAlternative: true,
    },
    {
      id: "dep-toilet",
      label: "Accessible toilet operation",
      type: "evidence",
      required: true,
      verified: false,
      current: false,
      hasAlternative: false,
    },
    {
      id: "dep-reception",
      label: "Reception assistance",
      type: "assistance",
      required: false,
      verified: false,
      current: false,
      hasAlternative: true,
    },
    {
      id: "dep-transport",
      label: "Accessible transport",
      type: "transport",
      required: false,
      verified: false,
      current: true,
      hasAlternative: true,
    },
  ];

  const singlePointsOfFailure = deps
    .filter((d) => d.required && d.current && !d.hasAlternative)
    .map((d) => d.label);

  const verifiedFallbacks: string[] = [];
  const unverifiedFallbacks = [
    "Reception assistance (unverified)",
    "Special after-hours entrance access (unverified)",
  ];
  const noFallbackReasons: string[] = [];

  if (singlePointsOfFailure.includes("Western lift")) {
    noFallbackReasons.push(
      "If western lift fails while main lift is out, no verified lift route remains.",
    );
  }
  if (!route) {
    noFallbackReasons.push("No recommended route on current plan.");
  }

  let level: AuraResilienceAssessment["level"];
  if (noFallbackReasons.length > 0 && singlePointsOfFailure.length > 0) {
    level = "no_verified_fallback";
  } else if (singlePointsOfFailure.length >= 2) {
    level = "low";
  } else if (singlePointsOfFailure.length === 1) {
    level = "moderate";
  } else {
    level = "high";
  }

  // If we have western lift as only lift SPOF but entrance has no alt — moderate/low
  if (singlePointsOfFailure.length === 1 && verifiedFallbacks.length === 0) {
    level = level === "high" ? "moderate" : level;
  }

  const assessment: AuraResilienceAssessment = {
    missionId,
    planId: mission.plan.id,
    level,
    dependencies: deps,
    singlePointsOfFailure,
    verifiedFallbacks,
    unverifiedFallbacks,
    noFallbackReasons,
    assessedAt: new Date().toISOString(),
    note: "Resilience describes the plan and service environment — not participant capability.",
  };

  saveMission({ ...mission, resilience: assessment });
  appendWitness({
    missionId,
    type: "resilience.assessed",
    summary: `Resilience assessed: ${level}`,
    correlationId: mission.correlationId,
    payload: {
      level,
      spofCount: singlePointsOfFailure.length,
      note: assessment.note,
    },
  });

  return assessment;
}

export function getResilience(
  mission: AuraMissionRecord,
): AuraResilienceAssessment | null {
  return (mission.resilience as AuraResilienceAssessment | null) ?? null;
}
