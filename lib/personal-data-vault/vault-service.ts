import type { DataVaultRequestType } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { phase9Config } from "@/lib/config/phase9";
import { prisma } from "@/lib/prisma";

export async function requestDataVaultExport(
  userId: string,
  requestType: DataVaultRequestType
) {
  if (!phase9Config.personalDataVaultEnabled) {
    throw new Error("DATA_VAULT_DISABLED");
  }

  const request = await prisma.personalDataVaultRequest.create({
    data: { userId, requestType, status: "pending" },
  });

  await createAuditEvent({
    actorUserId: userId,
    action: "data_vault.requested",
    entityType: "PersonalDataVaultRequest",
    entityId: request.id,
  });

  return {
    request,
    message:
      "Request queued — human review required before any export or deletion.",
  };
}

export async function completeVaultRequest(requestId: string, actorUserId: string) {
  const request = await prisma.personalDataVaultRequest.update({
    where: { id: requestId },
    data: { status: "completed", completedAt: new Date() },
  });
  await createAuditEvent({
    actorUserId,
    action: "data_vault.completed",
    entityType: "PersonalDataVaultRequest",
    entityId: requestId,
  });
  return request;
}

export async function requestSubjectAccessExport(userId: string) {
  const request = await requestDataVaultExport(userId, "export");
  return {
    request,
    message:
      "Your data export request is queued. Identity verification and step-up may be required before download.",
  };
}

export async function listVaultRequestsForUser(userId: string) {
  return prisma.personalDataVaultRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}
