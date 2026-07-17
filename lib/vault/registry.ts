import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { isVaultItemRegistryEnabled } from "@/lib/vault/config";
import { decideCanonicalRoute } from "@/lib/vault/router";
import { getTaxonomyEntry } from "@/lib/vault/taxonomy";

export class VaultDisabledError extends Error {
  constructor(message = "PERSONAL_ACCESS_VAULT_DISABLED") {
    super(message);
    this.name = "VaultDisabledError";
  }
}

export class VaultForbiddenError extends Error {
  constructor(message = "VAULT_FORBIDDEN") {
    super(message);
    this.name = "VaultForbiddenError";
  }
}

function assertRegistryEnabled() {
  if (!isVaultItemRegistryEnabled()) {
    throw new VaultDisabledError();
  }
}

export async function getOrCreatePersonalVault(ownerUserId: string) {
  assertRegistryEnabled();
  const existing = await prisma.personalVault.findUnique({
    where: { ownerUserId },
  });
  if (existing) return existing;

  const vault = await prisma.personalVault.create({
    data: {
      ownerUserId,
      mode: process.env.MAPABLE_VAULT_MODE ?? "shadow",
    },
  });

  await createAuditEvent({
    actorUserId: ownerUserId,
    action: "vault.created",
    entityType: "PersonalVault",
    entityId: vault.id,
    participantId: ownerUserId,
  });

  return vault;
}

export async function listVaultItems(ownerUserId: string) {
  assertRegistryEnabled();
  const vault = await getOrCreatePersonalVault(ownerUserId);
  return prisma.vaultItem.findMany({
    where: { vaultId: vault.id, deletedAt: null },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getVaultItemForOwner(itemId: string, ownerUserId: string) {
  assertRegistryEnabled();
  const item = await prisma.vaultItem.findUnique({
    where: { id: itemId },
    include: { vault: true },
  });
  if (!item || item.deletedAt) return null;
  if (item.vault.ownerUserId !== ownerUserId) {
    throw new VaultForbiddenError("VAULT_ITEM_CROSS_USER");
  }
  return item;
}

export async function registerReferenceItem(params: {
  ownerUserId: string;
  itemType: string;
  canonicalRecordId?: string;
  displayName?: string;
  purpose?: string;
}) {
  assertRegistryEnabled();
  const decision = decideCanonicalRoute({
    itemType: params.itemType,
    canonicalRecordId: params.canonicalRecordId,
  });

  if (decision.vaultTreatment === "not_permitted") {
    return { decision, item: null as null };
  }

  const vault = await getOrCreatePersonalVault(params.ownerUserId);
  const taxonomy = getTaxonomyEntry(params.itemType);

  const existing = params.canonicalRecordId
    ? await prisma.vaultItem.findFirst({
        where: {
          vaultId: vault.id,
          itemType: params.itemType,
          canonicalRecordId: params.canonicalRecordId,
          deletedAt: null,
        },
      })
    : null;

  if (existing) {
    return { decision, item: existing };
  }

  const item = await prisma.vaultItem.create({
    data: {
      vaultId: vault.id,
      itemType: params.itemType,
      category: decision.category,
      displayName:
        params.displayName ??
        taxonomy?.canonicalOwnerLabel ??
        params.itemType,
      canonicalDomain: decision.canonicalDomain,
      canonicalRecordId: params.canonicalRecordId ?? null,
      canonicalVersion: "1",
      vaultTreatment: decision.vaultTreatment,
      classification: decision.classification,
      fieldManifestJson: decision.fieldManifest,
      purpose: params.purpose ?? "participant_visibility",
      provenanceJson: {
        source: "vault.registry",
        routedAt: new Date().toISOString(),
        reasons: decision.reasons,
      },
      retentionReason: "Participant-visible index of canonical record",
      encryptionState: "none_reference_only",
      exportState: taxonomy?.exportable ? "exportable" : "not_exportable",
      deletionState: "canonical_boundary",
    },
  });

  await createAuditEvent({
    actorUserId: params.ownerUserId,
    action: "vault.item_registered",
    entityType: "VaultItem",
    entityId: item.id,
    participantId: params.ownerUserId,
    metadata: {
      itemType: item.itemType,
      canonicalDomain: item.canonicalDomain,
      treatment: item.vaultTreatment,
    },
  });

  return { decision, item };
}

export async function rerouteVaultItem(itemId: string, ownerUserId: string) {
  assertRegistryEnabled();
  const item = await getVaultItemForOwner(itemId, ownerUserId);
  if (!item) return null;

  const decision = decideCanonicalRoute({
    itemType: item.itemType,
    canonicalRecordId: item.canonicalRecordId ?? undefined,
  });

  const updated = await prisma.vaultItem.update({
    where: { id: item.id },
    data: {
      canonicalDomain: decision.canonicalDomain,
      vaultTreatment: decision.vaultTreatment,
      classification: decision.classification,
      category: decision.category,
      fieldManifestJson: decision.fieldManifest,
      provenanceJson: {
        ...(typeof item.provenanceJson === "object" && item.provenanceJson
          ? (item.provenanceJson as object)
          : {}),
        lastRoutedAt: new Date().toISOString(),
        reasons: decision.reasons,
      },
      version: { increment: 1 },
    },
  });

  await createAuditEvent({
    actorUserId: ownerUserId,
    action: "vault.item_routed",
    entityType: "VaultItem",
    entityId: updated.id,
    participantId: ownerUserId,
    metadata: {
      canonicalDomain: updated.canonicalDomain,
      treatment: updated.vaultTreatment,
    },
  });

  return { decision, item: updated };
}

/**
 * Optional backfill: index existing AccessibilityProfile as reference_only.
 * Does not copy editable payload fields into the Vault.
 */
export async function backfillAccessibilityProfileReference(
  ownerUserId: string
) {
  assertRegistryEnabled();
  const profile = await prisma.accessibilityProfile.findUnique({
    where: { userId: ownerUserId },
  });
  if (!profile) {
    return { decision: null, item: null };
  }
  return registerReferenceItem({
    ownerUserId,
    itemType: "accessibility_profile",
    canonicalRecordId: profile.id,
    displayName: "Accessibility profile",
    purpose: "Stable presentation and communication preferences",
  });
}

export async function getVaultOverview(ownerUserId: string) {
  assertRegistryEnabled();
  const vault = await getOrCreatePersonalVault(ownerUserId);
  const items = await listVaultItems(ownerUserId);
  return {
    vault: {
      id: vault.id,
      ownerUserId: vault.ownerUserId,
      mode: vault.mode,
      createdAt: vault.createdAt.toISOString(),
    },
    itemCount: items.length,
    referenceOnlyCount: items.filter((i) => i.vaultTreatment === "reference_only")
      .length,
    items: items.map((i) => ({
      id: i.id,
      displayName: i.displayName,
      itemType: i.itemType,
      category: i.category,
      canonicalDomain: i.canonicalDomain,
      vaultTreatment: i.vaultTreatment,
      classification: i.classification,
      updatedAt: i.updatedAt.toISOString(),
    })),
    essentialServicesNote:
      "Essential MapAble services remain available without using the Personal Access Vault.",
  };
}
