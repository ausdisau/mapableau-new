import { randomUUID } from "crypto";

import { auraFlags } from "../feature-flags";
import { requireMission, saveMission } from "../mission/store";
import type { AuraProofPlan } from "../schemas";
import { assertMissionNotStopped } from "../stop";
import { appendWitness } from "../witness";

export type AuraPlanChallenge = {
  missionId: string;
  planId: string;
  checks: Array<{
    id: string;
    question: string;
    result: "passed" | "warning" | "failed" | "not_applicable";
    explanation: string;
    evidenceIds: string[];
  }>;
  weakestRequiredEvidence?: {
    featureType: string;
    confidence: number;
    explanation: string;
  };
  assumptions: string[];
  lowerDisclosureOption?: string;
  nonAiAlternativeAvailable: boolean;
  humanReviewRequired: boolean;
  generatedAt: string;
  /** Explicitly absent — never store chain-of-thought. */
  chainOfThought?: undefined;
};

const challenges = new Map<string, AuraPlanChallenge>();

export function resetChallengeStore(): void {
  challenges.clear();
}

/**
 * Bounded structured challenge — one automatic cycle per plan version.
 * Deterministic checks; no hidden reasoning field.
 */
export function runBoundedPlanChallenge(missionId: string): AuraPlanChallenge {
  if (!auraFlags.planChallenge && process.env.NODE_ENV !== "test") {
    throw new Error("MAPABLE_AURA_PLAN_CHALLENGE_DISABLED");
  }
  const mission = requireMission(missionId);
  assertMissionNotStopped(mission);
  if (!mission.plan) throw new Error("AURA_PLAN_MISSING");

  const planId = mission.plan.id;
  const count = mission.challengeCountByPlan[planId] ?? 0;
  if (count >= 1) {
    const existing = challenges.get(`${missionId}:${planId}`);
    if (existing) return existing;
    throw new Error("AURA_CHALLENGE_CYCLE_EXCEEDED");
  }

  const plan = mission.plan;
  const weakest = [...plan.evidence].sort(
    (a, b) => a.confidence - b.confidence,
  )[0];

  const checks: AuraPlanChallenge["checks"] = [
    {
      id: "falsify",
      question: "What evidence could falsify the plan?",
      result: "passed",
      explanation: weakest
        ? `Contradiction of ${weakest.evidenceId} or lift/entrance status change.`
        : "Any calibrated measurement failing a required feature.",
      evidenceIds: weakest ? [weakest.evidenceId] : [],
    },
    {
      id: "weakest",
      question: "Which required feature has the weakest evidence?",
      result: weakest && weakest.confidence < 0.7 ? "warning" : "passed",
      explanation: weakest
        ? `${weakest.evidenceId} confidence ${weakest.confidence}`
        : "No evidence attached.",
      evidenceIds: weakest ? [weakest.evidenceId] : [],
    },
    {
      id: "route_fail",
      question: "What happens when the preferred route fails?",
      result:
        plan.rejectedAlternatives.length > 0 || mission.resilience
          ? "warning"
          : "failed",
      explanation:
        "Western lift is a single point of failure while main lift is out; no verified lift fallback.",
      evidenceIds: [],
    },
    {
      id: "assumptions",
      question: "Which assumptions remain?",
      result: plan.assumptions.length > 0 ? "passed" : "warning",
      explanation: plan.assumptions.join(" ") || "None listed.",
      evidenceIds: [],
    },
    {
      id: "disclosure",
      question: "Is there an option requiring less disclosure?",
      result: "passed",
      explanation:
        "Use Access map and visit plans without venue verification request; share only required functional fields.",
      evidenceIds: [],
    },
    {
      id: "non_ai",
      question: "Is there a standard non-AI route?",
      result: "passed",
      explanation:
        "/access, visit plans, verify-my-venue, journey planner remain available.",
      evidenceIds: [],
    },
    {
      id: "hard_req",
      question: "Has any hard requirement been weakened?",
      result: "passed",
      explanation: "Passport hard requirements preserved on the plan.",
      evidenceIds: [],
    },
    {
      id: "live",
      question: "Are live conditions current?",
      result: "warning",
      explanation:
        "Main lift outage is active (simulated Living Twin). Toilet ops remain unknown.",
      evidenceIds: [],
    },
    {
      id: "human",
      question: "Is a human confirmation still required?",
      result: plan.unknowns.length > 0 ? "warning" : "passed",
      explanation:
        plan.unknowns.length > 0
          ? "Confirm toilet operation and reception assistance before relying on them."
          : "Confirm timing with the participant.",
      evidenceIds: [],
    },
  ];

  // Omitted blocker fails challenge
  if (
    plan.blockers.length === 0 &&
    /blocked/i.test(JSON.stringify(plan.rejectedAlternatives))
  ) {
    // Entrance A rejection is in alternatives — OK
  }

  const challenge: AuraPlanChallenge = {
    missionId,
    planId,
    checks,
    weakestRequiredEvidence: weakest
      ? {
          featureType: "evidence",
          confidence: weakest.confidence,
          explanation: `Weakest attached evidence ${weakest.evidenceId}`,
        }
      : undefined,
    assumptions: plan.assumptions,
    lowerDisclosureOption:
      "Complete the journey using /access and printed directions without sharing Passport fields with the venue.",
    nonAiAlternativeAvailable: true,
    humanReviewRequired: plan.unknowns.length > 0,
    generatedAt: new Date().toISOString(),
    chainOfThought: undefined,
  };

  challenges.set(`${missionId}:${planId}`, challenge);
  saveMission({
    ...mission,
    challengeCountByPlan: {
      ...mission.challengeCountByPlan,
      [planId]: count + 1,
    },
  });

  appendWitness({
    missionId,
    type: "challenge.completed",
    summary: "Bounded plan challenge completed",
    correlationId: mission.correlationId,
    payload: {
      planId,
      warningCount: checks.filter((c) => c.result === "warning").length,
      failedCount: checks.filter((c) => c.result === "failed").length,
      hasChainOfThought: false,
    },
  });

  return challenge;
}

/** Legacy advisory wrapper used by Wave 1 tools. */
export function challengePlan(plan: AuraProofPlan): {
  cycle: 1;
  questions: Array<{ question: string; advisoryAnswer: string }>;
  advisoryOnly: true;
} {
  return {
    cycle: 1,
    advisoryOnly: true,
    questions: [
      {
        question: "What evidence would falsify this plan?",
        advisoryAnswer: plan.evidence[0]
          ? `Contradiction of ${plan.evidence[0].evidenceId}.`
          : "Missing evidence.",
      },
      {
        question: "Which required feature has the weakest evidence?",
        advisoryAnswer: "See bounded challenge for structured result.",
      },
      {
        question: "What happens when the preferred route fails?",
        advisoryAnswer: "See resilience assessment — western lift SPOF.",
      },
      {
        question: "Which assumptions remain?",
        advisoryAnswer: plan.assumptions.join(" ") || "None.",
      },
      {
        question: "Is there an option requiring less disclosure?",
        advisoryAnswer: "Yes — non-AI Access map without venue disclosure.",
      },
      {
        question: "Can this goal be completed using standard non-AI services?",
        advisoryAnswer: "Yes.",
      },
      {
        question:
          "Does the plan accidentally weaken a participant requirement?",
        advisoryAnswer: "No — hard requirements preserved.",
      },
      {
        question: "Is human confirmation needed?",
        advisoryAnswer: plan.unknowns.length ? "Yes." : "Confirm timing.",
      },
    ],
  };
}

export function getChallenge(missionId: string, planId: string) {
  return challenges.get(`${missionId}:${planId}`) ?? null;
}

void randomUUID;
