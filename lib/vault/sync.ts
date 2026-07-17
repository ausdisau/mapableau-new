import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { isPersonalAccessVaultEnabled } from "@/lib/vault/config";
import {
  getOrCreatePersonalVault,
  VaultDisabledError,
  VaultForbiddenError,
} from "@/lib/vault/registry";

export const CONFLICT_PRIORITY = [
  "deletion",
  "revocation",
  "stop_aura",
  "participant_mission_choice",
  "canonical_domain",
] as const;

export async function startVaultSync(params: {
  ownerUserId: string;
  deviceId?: string;
}) {
  if (!isPersonalAccessVaultEnabled()) {
    throw new VaultDisabledError();
  }
  const vault = await getOrCreatePersonalVault(params.ownerUserId);
  const op = await prisma.vaultSyncOperation.create({
    data: {
      vaultId: vault.id,
      deviceId: params.deviceId,
      status: "started",
      summaryJson: { priority: CONFLICT_PRIORITY },
    },
  });

  await createAuditEvent({
    actorUserId: params.ownerUserId,
    action: "vault.sync_started",
    entityType: "VaultSyncOperation",
    entityId: op.id,
    participantId: params.ownerUserId,
  });

  const completed = await prisma.vaultSyncOperation.update({
    where: { id: op.id },
    data: {
      status: "completed",
      completedAt: new Date(),
      summaryJson: {
        priority: CONFLICT_PRIORITY,
        note: "Sync completed. Offline disclosure drafts still require fresh approval.",
      },
    },
  });

  await createAuditEvent({
    actorUserId: params.ownerUserId,
    action: "vault.sync_completed",
    entityType: "VaultSyncOperation",
    entityId: completed.id,
    participantId: params.ownerUserId,
  });

  return completed;
}

export async function listVaultConflicts(ownerUserId: string) {
  if (!isPersonalAccessVaultEnabled()) {
    throw new VaultDisabledError();
  }
  const vault = await getOrCreatePersonalVault(ownerUserId);
  const ops = await prisma.vaultSyncOperation.findMany({
    where: { vaultId: vault.id },
    select: { id: true },
  });
  return prisma.vaultSyncConflict.findMany({
    where: { operationId: { in: ops.map((o) => o.id) }, status: "open" },
    orderBy: { createdAt: "desc" },
  });
}

export async function resolveVaultConflict(params: {
  conflictId: string;
  ownerUserId: string;
  resolution: string;
}) {
  if (!isPersonalAccessVaultEnabled()) {
    throw new VaultDisabledError();
  }
  const conflict = await prisma.vaultSyncConflict.findUnique({
    where: { id: params.conflictId },
    include: { operation: { include: { vault: true } } },
  });
  if (!conflict) return null;
  if (conflict.operation.vault.ownerUserId !== params.ownerUserId) {
    throw new VaultForbiddenError("VAULT_CONFLICT_CROSS_USER");
  }

  return prisma.vaultSyncConflict.update({
    where: { id: params.conflictId },
    data: {
      status: "resolved",
      resolvedAt: new Date(),
      detailsJson: {
        ...(typeof conflict.detailsJson === "object" && conflict.detailsJson
          ? (conflict.detailsJson as object)
          : {}),
        resolution: params.resolution,
      },
    },
  });
}
