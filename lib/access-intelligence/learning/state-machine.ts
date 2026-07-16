import { AccessIntelligenceError } from "../errors";

import type { LearningStage, PracticeSession } from "./schemas";

/** Ordered learning state machine. */
export const LEARNING_STAGE_ORDER: LearningStage[] = [
  "orientation",
  "prediction",
  "investigation",
  "decision",
  "consequence",
  "revision",
  "teach_back",
  "reflection",
  "transfer",
  "complete",
];

export function stageIndex(stage: LearningStage): number {
  return LEARNING_STAGE_ORDER.indexOf(stage);
}

export function assertValidTransition(
  from: LearningStage,
  to: LearningStage,
): void {
  const fromIdx = stageIndex(from);
  const toIdx = stageIndex(to);
  if (fromIdx < 0 || toIdx < 0) {
    throw new AccessIntelligenceError(
      "VALIDATION_ERROR",
      "Unknown learning stage.",
      "Reload the scenario and try again.",
    );
  }
  // Allow stay, advance by 1, or jump to complete from transfer only via advance helpers
  if (toIdx === fromIdx) return;
  if (toIdx === fromIdx + 1) return;
  throw new AccessIntelligenceError(
    "VALIDATION_ERROR",
    `Invalid learning transition from ${from} to ${to}.`,
    "Follow the scenario steps in order.",
    { from, to },
  );
}

export function nextStage(stage: LearningStage): LearningStage {
  const idx = stageIndex(stage);
  if (idx < 0 || idx >= LEARNING_STAGE_ORDER.length - 1) return "complete";
  return LEARNING_STAGE_ORDER[idx + 1]!;
}

export function canRevealEvidence(session: PracticeSession): boolean {
  if (!session.evidenceRevealed && session.stage === "prediction") {
    // Configurable gate checked by caller via preferences
    return Boolean(session.predictionOptionId);
  }
  return (
    stageIndex(session.stage) >= stageIndex("investigation") ||
    Boolean(session.predictionOptionId)
  );
}

export function progressPercent(stage: LearningStage): number {
  const idx = stageIndex(stage);
  if (idx < 0) return 0;
  return Math.round((idx / (LEARNING_STAGE_ORDER.length - 1)) * 100);
}
