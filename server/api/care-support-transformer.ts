import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isAdminRole } from "@/lib/auth/roles";
import type { CurrentUser } from "@/lib/auth/current-user";
import { transformCareSupport } from "@/server/agents/careSupportTransformer";
import {
  careSupportTransformInputSchema,
  type CareSupportTransformInput,
  type CareSupportTransformOutput,
} from "@/server/agents/care/types";

export type TransformCareSupportContext = {
  actorUserId?: string;
  actorRole?: string;
};

export function parseCareSupportTransformBody(
  body: unknown
): CareSupportTransformInput {
  return careSupportTransformInputSchema.parse(body);
}

export function assertParticipantAccess(
  user: CurrentUser,
  participantId: string
): void {
  if (isAdminRole(user.primaryRole)) return;
  if (user.id !== participantId) {
    throw new Error("FORBIDDEN_PARTICIPANT");
  }
}

export async function transformCareSupportRequest(
  input: CareSupportTransformInput,
  context: TransformCareSupportContext = {}
): Promise<CareSupportTransformOutput> {
  const output = transformCareSupport(input);

  if (input.participantId && context.actorUserId) {
    await createAuditEvent({
      actorUserId: context.actorUserId,
      actorRole: context.actorRole as never,
      action: "care_support_transform.completed",
      entityType: "CareSupportTransform",
      entityId: output.audit.transformId,
      participantId: input.participantId,
      metadata: {
        sessionId: input.sessionId,
        pipelineVersion: output.audit.pipelineVersion,
        inputHash: output.audit.inputHash,
        guardrailTriggers: output.audit.guardrailTriggers,
        humanReviewRequired: output.guardrailDecision.humanReviewRequired,
      },
    });
  }

  return output;
}
