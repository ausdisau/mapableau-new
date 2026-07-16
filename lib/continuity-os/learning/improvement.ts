import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

/**
 * Bounded systemic learning. Does not change ratings, weights, policy, or train models.
 */
export async function proposeImprovement(params: {
  actorUserId: string;
  missionId?: string;
  recoveryCaseId?: string;
  findingType: string;
  summary: string;
  accessibilityOpsLink?: string;
  proposal?: Record<string, unknown>;
}) {
  const review = await prisma.recoveryLearningReview.create({
    data: {
      missionId: params.missionId,
      recoveryCaseId: params.recoveryCaseId,
      findingType: params.findingType,
      summary: params.summary,
      proposalJson: {
        ...(params.proposal ?? {}),
        forbidden: [
          "auto_lower_provider_rating",
          "silent_weight_change",
          "silent_policy_change",
          "train_model_on_participant_data",
          "publish_individual_outcomes",
        ],
      },
      status: "proposed",
      accessibilityOpsLink: params.accessibilityOpsLink,
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "continuity.improvement.proposed",
    entityType: "RecoveryLearningReview",
    entityId: review.id,
    metadata: { findingType: params.findingType },
  });

  return review;
}
