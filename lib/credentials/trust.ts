import type {
  CredentialTrustRegistryEntry,
  ExternalFederationEntityKind,
} from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

/**
 * Trust registry: which external entities MapAble treats as approved
 * issuers, verifiers, apps, peer platforms or government gateways.
 *
 * AI cannot mint or elevate a trust registry entry. `approvedBy` must be a
 * real human operator; the API layer enforces the role.
 */

export async function proposeTrustEntry(input: {
  entityKey: string;
  displayName: string;
  entityKind: ExternalFederationEntityKind;
  organisationId?: string | null;
  didOrPublicKey?: string | null;
  notes?: string | null;
  proposedById: string;
}): Promise<CredentialTrustRegistryEntry> {
  const created = await prisma.credentialTrustRegistryEntry.upsert({
    where: { entityKey: input.entityKey },
    create: {
      entityKey: input.entityKey,
      displayName: input.displayName,
      entityKind: input.entityKind,
      organisationId: input.organisationId ?? null,
      didOrPublicKey: input.didOrPublicKey ?? null,
      notes: input.notes ?? null,
      trustLevel: "observed",
      status: "proposed",
    },
    update: {
      displayName: input.displayName,
      organisationId: input.organisationId ?? null,
      didOrPublicKey: input.didOrPublicKey ?? null,
      notes: input.notes ?? null,
    },
  });
  await createAuditEvent({
    actorUserId: input.proposedById,
    action: "credential.trust.proposed",
    entityType: "CredentialTrustRegistryEntry",
    entityId: created.id,
    metadata: { entityKey: input.entityKey, entityKind: input.entityKind },
  }).catch(() => {});
  return created;
}

export async function approveTrustEntry(input: {
  id: string;
  trustLevel: "observed" | "allowed_verifier" | "allowed_issuer" | "fully_trusted";
  approvedById: string;
  notes?: string | null;
}): Promise<CredentialTrustRegistryEntry> {
  const updated = await prisma.credentialTrustRegistryEntry.update({
    where: { id: input.id },
    data: {
      trustLevel: input.trustLevel,
      status: "active",
      approvedById: input.approvedById,
      approvedAt: new Date(),
      notes: input.notes ?? undefined,
    },
  });
  await createAuditEvent({
    actorUserId: input.approvedById,
    action: "credential.trust.approved",
    entityType: "CredentialTrustRegistryEntry",
    entityId: input.id,
    metadata: { trustLevel: input.trustLevel },
  }).catch(() => {});
  return updated;
}

export async function suspendTrustEntry(
  id: string,
  actorId: string,
  reason?: string
): Promise<CredentialTrustRegistryEntry> {
  const updated = await prisma.credentialTrustRegistryEntry.update({
    where: { id },
    data: { status: "suspended" },
  });
  await createAuditEvent({
    actorUserId: actorId,
    action: "credential.trust.suspended",
    entityType: "CredentialTrustRegistryEntry",
    entityId: id,
    metadata: { reason: reason ?? null },
  }).catch(() => {});
  return updated;
}

export async function loadActiveTrustEntry(entityKey: string) {
  return prisma.credentialTrustRegistryEntry.findFirst({
    where: { entityKey, status: "active" },
  });
}
