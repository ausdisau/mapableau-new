import type { Prisma } from "@prisma/client";

import { createCorrelationId } from "@/lib/ndis-gateway/infrastructure/correlation";
import { sanitiseAuditJson } from "@/lib/ndis-gateway/security/log-sanitiser";
import { prisma } from "@/lib/prisma";

export async function writePilotAuditEvent(input: {
  organisationId: string;
  pilotId: string;
  actorUserId: string;
  action: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  correlationId?: string;
}) {
  const correlationId = input.correlationId ?? createCorrelationId();
  return prisma.ndisWorkflowTransition.create({
    data: {
      organisationId: input.organisationId,
      entityType: "controlled_pilot",
      entityId: input.entityId ?? input.pilotId,
      fromStatus: "n/a",
      toStatus: input.action,
      actorUserId: input.actorUserId,
      correlationId,
      metadataJson: sanitiseAuditJson({
        pilotId: input.pilotId,
        action: input.action,
        ...(input.metadata ?? {}),
      }) as Prisma.InputJsonValue,
    },
  });
}
