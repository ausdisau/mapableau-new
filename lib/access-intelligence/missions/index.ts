/**
 * System 8 — Support Coordinator Mission Console foundations.
 * Extends existing case/SC systems — does not replace case management.
 */

import { createHash } from "crypto";

import { accessIntelligenceFlags } from "@/lib/access-intelligence/feature-flags";

export const MISSION_STATES = [
  "draft",
  "awaiting_participant_input",
  "awaiting_evidence",
  "ready_for_review",
  "awaiting_confirmation",
  "confirmed",
  "in_progress",
  "disrupted",
  "completed",
  "cancelled",
] as const;

export type MissionState = (typeof MISSION_STATES)[number];

export type MissionDraft = {
  participantId: string;
  coordinatorId?: string;
  caseId?: string;
  title: string;
  goal: string;
  visitPlanId?: string;
  consentRecordId?: string;
  fieldVisibility?: Record<string, string[]>;
};

export function createMissionStateMachine(current: MissionState) {
  const transitions: Record<MissionState, MissionState[]> = {
    draft: ["awaiting_participant_input", "awaiting_evidence", "cancelled"],
    awaiting_participant_input: ["awaiting_evidence", "ready_for_review", "cancelled"],
    awaiting_evidence: ["ready_for_review", "awaiting_participant_input", "cancelled"],
    ready_for_review: ["awaiting_confirmation", "awaiting_evidence", "cancelled"],
    awaiting_confirmation: ["confirmed", "ready_for_review", "cancelled"],
    confirmed: ["in_progress", "cancelled"],
    in_progress: ["disrupted", "completed", "cancelled"],
    disrupted: ["in_progress", "completed", "cancelled"],
    completed: [],
    cancelled: [],
  };

  return {
    current,
    canTransitionTo(next: MissionState): boolean {
      return transitions[current].includes(next);
    },
    transition(next: MissionState): MissionState {
      if (!transitions[current].includes(next)) {
        throw new Error(`Invalid mission transition ${current} → ${next}`);
      }
      return next;
    },
  };
}

export function hashMissionWriteProposal(payload: Record<string, unknown>): string {
  return createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex")
    .slice(0, 32);
}

export function evaluateMissionBlockers(input: {
  dependencies: Array<{ status: string; summary: string }>;
  unknowns: string[];
  timingConflicts: string[];
}): {
  unresolvedBlockers: string[];
  unknowns: string[];
  timingConflicts: string[];
  readyForReview: boolean;
} {
  const unresolvedBlockers = input.dependencies
    .filter((d) => d.status !== "resolved")
    .map((d) => d.summary);
  return {
    unresolvedBlockers,
    unknowns: input.unknowns,
    timingConflicts: input.timingConflicts,
    readyForReview:
      unresolvedBlockers.length === 0 &&
      input.timingConflicts.length === 0,
  };
}

export function assertMissionConsoleEnabled(): void {
  if (!accessIntelligenceFlags.missionConsole) {
    throw new Error("Mission console disabled.");
  }
}
