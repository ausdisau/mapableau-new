/**
 * Persist NdisWorkflowTransition rows for audited status changes.
 */

import type { Prisma } from "@prisma/client";

import { createCorrelationId } from "@/lib/ndis-gateway/infrastructure/correlation";
import { sanitiseAuditJson } from "@/lib/ndis-gateway/security/log-sanitiser";
import type { WorkflowEntityKind } from "@/lib/ndis-gateway/workflows/transition-policy";
import { assertWorkflowTransition } from "@/lib/ndis-gateway/workflows/transition-policy";
import { prisma } from "@/lib/prisma";

export type RecordWorkflowTransitionInput = {
  organisationId: string;
  entityKind: WorkflowEntityKind;
  entityId: string;
  fromStatus: string;
  toStatus: string;
  actorUserId: string;
  reason?: string | null;
  correlationId?: string | null;
  metadata?: Record<string, unknown> | null;
  /** When false, skip state-machine assertion (already asserted by caller). */
  assertTransition?: boolean;
  tx?: Prisma.TransactionClient;
};

export async function recordWorkflowTransition(
  input: RecordWorkflowTransitionInput
) {
  if (input.assertTransition !== false) {
    assertWorkflowTransition(
      input.entityKind,
      input.fromStatus,
      input.toStatus
    );
  }

  const client = input.tx ?? prisma;
  const correlationId = input.correlationId ?? createCorrelationId();

  return client.ndisWorkflowTransition.create({
    data: {
      organisationId: input.organisationId,
      entityType: input.entityKind,
      entityId: input.entityId,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      actorUserId: input.actorUserId,
      reason: input.reason ?? null,
      correlationId,
      metadataJson: input.metadata
        ? (sanitiseAuditJson(input.metadata) as Prisma.InputJsonValue)
        : undefined,
    },
  });
}
