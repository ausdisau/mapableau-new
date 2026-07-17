import { Prisma } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { isVaultRecoveryEnabled } from "@/lib/vault/config";
import {
  getOrCreatePersonalVault,
  VaultDisabledError,
  VaultForbiddenError,
} from "@/lib/vault/registry";

function assertRecoveryEnabled() {
  if (!isVaultRecoveryEnabled()) {
    throw new VaultDisabledError("VAULT_RECOVERY_DISABLED");
  }
}

export async function getRecoveryConfiguration(ownerUserId: string) {
  assertRecoveryEnabled();
  const vault = await getOrCreatePersonalVault(ownerUserId);
  return prisma.vaultRecoveryConfiguration.findFirst({
    where: { vaultId: vault.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function configureRecovery(params: {
  ownerUserId: string;
  method: string;
  thresholdJson: Prisma.InputJsonValue;
  accessibleNotes?: string;
}) {
  assertRecoveryEnabled();
  const vault = await getOrCreatePersonalVault(params.ownerUserId);
  return prisma.vaultRecoveryConfiguration.create({
    data: {
      vaultId: vault.id,
      method: params.method,
      thresholdJson: params.thresholdJson,
      accessibleNotes: params.accessibleNotes,
    },
  });
}

/**
 * Threshold recovery: participant factor + trusted contact + rights officer.
 * No single supporter can satisfy the full threshold.
 */
export async function startRecovery(params: {
  ownerUserId: string;
  trustedContactUserId?: string;
  rightsOfficerUserId?: string;
}) {
  assertRecoveryEnabled();
  const vault = await getOrCreatePersonalVault(params.ownerUserId);

  const request = await prisma.vaultRecoveryRequest.create({
    data: {
      vaultId: vault.id,
      status: "pending",
      evidenceJson: { startedAt: new Date().toISOString() },
      participants: {
        create: [
          {
            role: "participant",
            userId: params.ownerUserId,
            status: "pending",
          },
          ...(params.trustedContactUserId
            ? [
                {
                  role: "trusted_contact",
                  userId: params.trustedContactUserId,
                  status: "pending",
                },
              ]
            : []),
          ...(params.rightsOfficerUserId
            ? [
                {
                  role: "rights_officer",
                  userId: params.rightsOfficerUserId,
                  status: "pending",
                },
              ]
            : []),
        ],
      },
      receipts: {
        create: {
          eventType: "recovery_started",
          note: "Threshold recovery started. No single participant can restore control alone.",
        },
      },
    },
    include: { participants: true },
  });

  await createAuditEvent({
    actorUserId: params.ownerUserId,
    action: "vault.recovery_started",
    entityType: "VaultRecoveryRequest",
    entityId: request.id,
    participantId: params.ownerUserId,
  });

  return request;
}

export async function participateInRecovery(params: {
  requestId: string;
  actorUserId: string;
  role: string;
}) {
  assertRecoveryEnabled();
  const request = await prisma.vaultRecoveryRequest.findUnique({
    where: { id: params.requestId },
    include: { participants: true, vault: true },
  });
  if (!request) return null;

  const participant = request.participants.find(
    (p) => p.userId === params.actorUserId && p.role === params.role
  );
  if (!participant) {
    throw new VaultForbiddenError("VAULT_RECOVERY_PARTICIPANT_MISMATCH");
  }

  await prisma.vaultRecoveryParticipant.update({
    where: { id: participant.id },
    data: { status: "completed", participatedAt: new Date() },
  });

  await prisma.vaultRecoveryReceipt.create({
    data: {
      requestId: params.requestId,
      eventType: "participation_recorded",
      note: `${params.role} participation recorded`,
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "vault.recovery_participation_recorded",
    entityType: "VaultRecoveryRequest",
    entityId: params.requestId,
    participantId: request.vault.ownerUserId,
    metadata: { role: params.role },
  });

  return prisma.vaultRecoveryRequest.findUnique({
    where: { id: params.requestId },
    include: { participants: true, receipts: true },
  });
}

export async function completeRecovery(params: {
  requestId: string;
  actorUserId: string;
}) {
  assertRecoveryEnabled();
  const request = await prisma.vaultRecoveryRequest.findUnique({
    where: { id: params.requestId },
    include: { participants: true, vault: true },
  });
  if (!request) return null;
  if (request.vault.ownerUserId !== params.actorUserId) {
    throw new VaultForbiddenError("VAULT_RECOVERY_OWNER_ONLY");
  }

  const completedRoles = new Set(
    request.participants
      .filter((p) => p.status === "completed")
      .map((p) => p.role)
  );
  const required = ["participant", "trusted_contact", "rights_officer"];
  const missing = required.filter((r) => !completedRoles.has(r));
  if (missing.length > 0) {
    await prisma.vaultRecoveryReceipt.create({
      data: {
        requestId: params.requestId,
        eventType: "recovery_blocked_incomplete_threshold",
        note: `Missing roles: ${missing.join(", ")}`,
      },
    });
    return {
      completed: false as const,
      missing,
      message:
        "Threshold incomplete. No single supporter may complete recovery alone.",
    };
  }

  await prisma.vaultDevice.updateMany({
    where: { vaultId: request.vaultId, status: "active" },
    data: {
      status: "revoked",
      revokedAt: new Date(),
      syncStatus: "revoked_after_recovery",
    },
  });

  const updated = await prisma.vaultRecoveryRequest.update({
    where: { id: params.requestId },
    data: {
      status: "completed",
      completedAt: new Date(),
      restoredScopeJson: {
        ownershipPreserved: true,
        devicesRevoked: true,
      },
    },
  });

  await prisma.vaultRecoveryReceipt.create({
    data: {
      requestId: params.requestId,
      eventType: "recovery_completed",
      note: "Ownership preserved; previous device capabilities revoked.",
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "vault.recovery_completed",
    entityType: "VaultRecoveryRequest",
    entityId: params.requestId,
    participantId: params.actorUserId,
  });

  return { completed: true as const, request: updated };
}
