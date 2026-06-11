import { coordinateConfig } from "@/lib/config/coordinate";
import {
  ESCALATION_TASK_TYPES,
  HUMAN_REVIEW_CONFIDENCE_THRESHOLD,
  type AiResultMeta,
} from "@/lib/coordinate/types";

export type CoordinateReviewTaskType =
  | "safeguarding"
  | "privacy"
  | "pricing"
  | "conflict"
  | "low_confidence"
  | "general";

export function buildAiMeta(params: {
  confidence: number;
  reason: string;
}): AiResultMeta {
  return {
    confidence: Math.min(params.confidence, 0.7),
    reason: params.reason,
    engineId: coordinateConfig.aiEngineId,
  };
}

export function shouldEscalateToHumanReview(params: {
  confidence: number;
  taskType?: CoordinateReviewTaskType;
  conflictDetected?: boolean;
}): { escalate: boolean; taskType: CoordinateReviewTaskType; reason: string } {
  if (params.conflictDetected) {
    return {
      escalate: true,
      taskType: "conflict",
      reason: "Potential conflict of interest detected in provider matching.",
    };
  }

  if (params.taskType && ESCALATION_TASK_TYPES.includes(params.taskType)) {
    return {
      escalate: true,
      taskType: params.taskType,
      reason: `Escalated due to ${params.taskType.replace("_", " ")} sensitivity.`,
    };
  }

  if (params.confidence < HUMAN_REVIEW_CONFIDENCE_THRESHOLD) {
    return {
      escalate: true,
      taskType: "low_confidence",
      reason: `Confidence ${params.confidence.toFixed(2)} is below the ${HUMAN_REVIEW_CONFIDENCE_THRESHOLD} review threshold.`,
    };
  }

  return {
    escalate: false,
    taskType: "general",
    reason: "No escalation required.",
  };
}

export function assertNoAutoSensitiveAction(action: string): void {
  const blocked = /^(send|book|share|approve_funding|submit_claim)/i;
  if (blocked.test(action)) {
    throw new Error(
      `Automatic sensitive action blocked: ${action}. Human approval required.`,
    );
  }
}
