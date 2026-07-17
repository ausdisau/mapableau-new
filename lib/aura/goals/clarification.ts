/**
 * Goal clarification rules.
 *
 * AURA MUST NOT auto-create participant goals from chat, MUST NOT interpret
 * silence as confirmation, and MUST abandon goals that a participant leaves
 * open without any signal for a bounded window.
 */

export interface GoalDraft {
  id: string;
  participantId: string;
  title: string;
  summary: string;
  source: "participant" | "delegate" | "provider_referral" | "system_suggested";
  status:
    | "draft"
    | "clarifying"
    | "ready"
    | "executing"
    | "paused"
    | "completed"
    | "abandoned"
    | "declined";
  clarifications: Array<{
    prompt: string;
    answeredAt: Date | null;
    answer: string | null;
  }>;
  lastParticipantSignalAt: Date | null;
  createdAt: Date;
}

export const AUTO_ABANDON_INACTIVITY_HOURS = 72;
export const CLARIFICATION_MINIMUM_ANSWERED = 1;

export interface GoalTransitionInput {
  goal: GoalDraft;
  now: Date;
  participantConfirmed?: boolean;
  participantDeclined?: boolean;
}

export type GoalTransitionResult =
  | { next: GoalDraft["status"]; reason?: string }
  | { next: null; reason: string };

export function evaluateGoalTransition(
  input: GoalTransitionInput
): GoalTransitionResult {
  const { goal, now } = input;
  if (input.participantDeclined) {
    return { next: "declined", reason: "participant_declined" };
  }
  if (goal.status === "completed" || goal.status === "abandoned") {
    return { next: null, reason: "terminal_state" };
  }

  const answered = goal.clarifications.filter((c) => c.answeredAt !== null).length;
  const unanswered = goal.clarifications.length - answered;

  if (goal.source === "system_suggested") {
    // AURA suggestions cannot become executing without explicit participant
    // confirmation. Silence NEVER counts as confirmation.
    if (!input.participantConfirmed) {
      return {
        next: null,
        reason: "system_suggested_needs_explicit_confirmation",
      };
    }
  }

  const lastSignal = goal.lastParticipantSignalAt ?? goal.createdAt;
  const hoursSinceSignal =
    (now.getTime() - lastSignal.getTime()) / (1000 * 60 * 60);
  if (hoursSinceSignal > AUTO_ABANDON_INACTIVITY_HOURS) {
    return { next: "abandoned", reason: "auto_abandon_inactivity" };
  }

  if (unanswered > 0) {
    return { next: "clarifying", reason: "clarifications_pending" };
  }
  if (answered < CLARIFICATION_MINIMUM_ANSWERED && goal.clarifications.length > 0) {
    return { next: "clarifying", reason: "minimum_answers_not_met" };
  }
  if (input.participantConfirmed) {
    return { next: "ready", reason: "participant_confirmed" };
  }
  return { next: null, reason: "awaiting_participant" };
}

export const PROHIBITED_AUTO_GOAL_CLASSES = [
  "consent_change",
  "delegate_appointment",
  "legal_representation",
  "incident_reportability_decision",
  "safeguarding_closure",
  "medical_recommendation",
  "financial_investment",
  "kill_switch_release",
] as const;

export function isProhibitedAutoGoal(topic: string): boolean {
  return PROHIBITED_AUTO_GOAL_CLASSES.some((p) => topic.toLowerCase().includes(p));
}
