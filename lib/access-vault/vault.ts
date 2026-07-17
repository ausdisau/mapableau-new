import type { ParticipantAccessVault } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

/**
 * A vault is a *pointer*: it does not itself hold data, it configures the
 * participant's data-sovereignty preferences (privacy defaults, external
 * issuance opt-in, recovery-policy version). Actual data lives in
 * ParticipantDataPackage, credentials, or upstream domain models.
 *
 * Vault activation is participant-driven. AI must not auto-activate a vault
 * and must not flip `externalIssuanceOptIn` without a fresh participant
 * action recorded in an audit event.
 */

export async function getOrDraftVault(
  participantId: string
): Promise<ParticipantAccessVault> {
  const existing = await prisma.participantAccessVault.findUnique({
    where: { participantId },
  });
  if (existing) return existing;

  return prisma.participantAccessVault.create({
    data: { participantId, status: "draft" },
  });
}

export async function activateVault(
  participantId: string,
  actorId: string
): Promise<ParticipantAccessVault> {
  if (actorId !== participantId) {
    throw new Error(
      "vault_activation_requires_participant: AI or admins cannot activate on behalf"
    );
  }
  const vault = await getOrDraftVault(participantId);
  const activated = await prisma.participantAccessVault.update({
    where: { id: vault.id },
    data: {
      status: "active",
      activatedAt: vault.activatedAt ?? new Date(),
    },
  });
  await createAuditEvent({
    actorUserId: actorId,
    action: "vault.activated",
    entityType: "ParticipantAccessVault",
    entityId: activated.id,
    participantId,
  }).catch(() => {});
  return activated;
}

export async function updatePrivacyDefaults(
  participantId: string,
  actorId: string,
  patch: {
    privacyModeDefault?: "minimum_necessary" | "strict" | "open";
    externalIssuanceOptIn?: boolean;
    notes?: string | null;
  }
): Promise<ParticipantAccessVault> {
  if (actorId !== participantId) {
    throw new Error("vault_updates_require_participant_actor");
  }
  const vault = await getOrDraftVault(participantId);
  const updated = await prisma.participantAccessVault.update({
    where: { id: vault.id },
    data: {
      privacyModeDefault:
        patch.privacyModeDefault ?? vault.privacyModeDefault,
      externalIssuanceOptIn:
        patch.externalIssuanceOptIn ?? vault.externalIssuanceOptIn,
      notes: patch.notes ?? vault.notes,
    },
  });
  await createAuditEvent({
    actorUserId: actorId,
    action: "vault.privacy_defaults_updated",
    entityType: "ParticipantAccessVault",
    entityId: updated.id,
    participantId,
    metadata: { patch },
  }).catch(() => {});
  return updated;
}
