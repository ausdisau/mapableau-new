import { Prisma } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import {
  isVaultDeletionEnabled,
  isVaultExportEnabled,
  isVaultImportEnabled,
  VAULT_DELETION_DISCLAIMER,
  VAULT_NON_E2E_DISCLAIMER,
} from "@/lib/vault/config";
import {
  getOrCreatePersonalVault,
  listVaultItems,
  VaultDisabledError,
  VaultForbiddenError,
} from "@/lib/vault/registry";

export async function createVaultExport(params: {
  ownerUserId: string;
  itemIds?: string[];
  includeLedgerSummary?: boolean;
}) {
  if (!isVaultExportEnabled()) {
    throw new VaultDisabledError("VAULT_EXPORT_DISABLED");
  }

  const vault = await getOrCreatePersonalVault(params.ownerUserId);
  const items = await listVaultItems(params.ownerUserId);
  const selected = params.itemIds?.length
    ? items.filter((i) => params.itemIds!.includes(i.id))
    : items;

  const excluded = items
    .filter((i) => !selected.some((s) => s.id === i.id))
    .map((i) => i.displayName);

  const manifest = {
    format: "mapable_portable_vault_package",
    exportVersion: "1",
    exportedAt: new Date().toISOString(),
    ownerUserId: params.ownerUserId,
    items: selected.map((i) => ({
      id: i.id,
      itemType: i.itemType,
      category: i.category,
      canonicalDomain: i.canonicalDomain,
      canonicalRecordId: i.canonicalRecordId,
      classification: i.classification,
      fieldManifest: i.fieldManifestJson,
      treatment: i.vaultTreatment,
      version: i.version,
    })),
    excludedCategories: excluded,
    encryptionNote: VAULT_NON_E2E_DISCLAIMER,
    guidance: [
      "Protect the export with a password or key you control.",
      "Do not email an unencrypted complete Vault.",
      "Third-party information may be omitted.",
    ],
    includeLedgerSummary: params.includeLedgerSummary ?? false,
  };

  const record = await prisma.vaultExport.create({
    data: {
      vaultId: vault.id,
      format: "mapable_portable_vault_package",
      status: "created",
      manifestJson: manifest,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      items: {
        create: selected.map((i) => ({
          itemId: i.id,
          itemType: i.itemType,
          included: true,
        })),
      },
    },
    include: { items: true },
  });

  await createAuditEvent({
    actorUserId: params.ownerUserId,
    action: "vault.export_created",
    entityType: "VaultExport",
    entityId: record.id,
    participantId: params.ownerUserId,
    metadata: { itemCount: selected.length },
  });

  return { record, manifest };
}

export async function getVaultExport(exportId: string, ownerUserId: string) {
  if (!isVaultExportEnabled()) {
    throw new VaultDisabledError("VAULT_EXPORT_DISABLED");
  }
  const record = await prisma.vaultExport.findUnique({
    where: { id: exportId },
    include: { vault: true, items: true },
  });
  if (!record) return null;
  if (record.vault.ownerUserId !== ownerUserId) {
    throw new VaultForbiddenError("VAULT_EXPORT_CROSS_USER");
  }
  if (record.expiresAt && record.expiresAt < new Date()) {
    return { record, expired: true as const };
  }
  return { record, expired: false as const };
}

export async function receiveVaultImport(params: {
  ownerUserId: string;
  sourceLabel?: string;
  manifestJson?: Prisma.InputJsonValue;
}) {
  if (!isVaultImportEnabled()) {
    throw new VaultDisabledError("VAULT_IMPORT_DISABLED");
  }
  const vault = await getOrCreatePersonalVault(params.ownerUserId);
  const record = await prisma.vaultImport.create({
    data: {
      vaultId: vault.id,
      status: "received",
      sourceLabel: params.sourceLabel,
      manifestJson: params.manifestJson ?? {},
      findings: {
        create: [
          {
            severity: "info",
            code: "IMPORT_RECEIVED",
            message:
              "Import received. Signed packages are not trusted until provenance and routing review.",
          },
        ],
      },
    },
    include: { findings: true },
  });

  await createAuditEvent({
    actorUserId: params.ownerUserId,
    action: "vault.import_received",
    entityType: "VaultImport",
    entityId: record.id,
    participantId: params.ownerUserId,
  });

  return record;
}

export async function advanceImportQuarantine(
  importId: string,
  ownerUserId: string
) {
  if (!isVaultImportEnabled()) {
    throw new VaultDisabledError("VAULT_IMPORT_DISABLED");
  }
  const record = await prisma.vaultImport.findUnique({
    where: { id: importId },
    include: { vault: true },
  });
  if (!record) return null;
  if (record.vault.ownerUserId !== ownerUserId) {
    throw new VaultForbiddenError("VAULT_IMPORT_CROSS_USER");
  }

  const updated = await prisma.vaultImport.update({
    where: { id: importId },
    data: { status: "quarantined" },
  });

  await prisma.vaultImportFinding.create({
    data: {
      importId,
      severity: "warning",
      code: "QUARANTINED_PENDING_REVIEW",
      message:
        "Import quarantined pending malware, integrity, schema, provenance and participant review.",
    },
  });

  await createAuditEvent({
    actorUserId: ownerUserId,
    action: "vault.import_quarantined",
    entityType: "VaultImport",
    entityId: importId,
    participantId: ownerUserId,
  });

  return updated;
}

export async function requestVaultDeletion(params: {
  ownerUserId: string;
  itemId?: string;
  scopes: string[];
  note?: string;
}) {
  if (!isVaultDeletionEnabled()) {
    throw new VaultDisabledError("VAULT_DELETION_DISABLED");
  }
  const vault = await getOrCreatePersonalVault(params.ownerUserId);

  const receipts = params.scopes.map((scope) => {
    if (scope === "local_device_copy") {
      return {
        kind: "local_confirmed" as const,
        message: "Local device copy can be deleted from registered devices.",
      };
    }
    if (scope === "vault_index") {
      return {
        kind: "system_confirmed" as const,
        message: "Vault index entry can be removed.",
      };
    }
    if (scope === "canonical_record") {
      return {
        kind: "limited_by_retention" as const,
        message:
          "Canonical record deletion must be requested in the owning domain and is not performed silently by the Vault.",
      };
    }
    if (scope === "external_recipient_copy") {
      return {
        kind: "external_requested" as const,
        message:
          "External recipient deletion can be requested; attestation is not independent proof of erasure.",
      };
    }
    if (scope === "backup_data") {
      return {
        kind: "backup_pending" as const,
        message: "Backup deletion may remain pending after primary delete.",
      };
    }
    return {
      kind: "denied" as const,
      message: `Scope "${scope}" is not deletable through this request.`,
    };
  });

  const request = await prisma.vaultDeletionRequest.create({
    data: {
      vaultId: vault.id,
      itemId: params.itemId,
      scopeJson: params.scopes,
      status: "requested",
      note: params.note,
      receipts: {
        create: receipts.map((r) => ({
          kind: r.kind,
          message: r.message,
        })),
      },
    },
    include: { receipts: true },
  });

  if (params.itemId && params.scopes.includes("vault_index")) {
    await prisma.vaultItem.updateMany({
      where: { id: params.itemId, vaultId: vault.id },
      data: { deletedAt: new Date(), deletionState: "index_removed" },
    });
  }

  await createAuditEvent({
    actorUserId: params.ownerUserId,
    action: "vault.deletion_requested",
    entityType: "VaultDeletionRequest",
    entityId: request.id,
    participantId: params.ownerUserId,
    metadata: { scopes: params.scopes },
  });

  return {
    request,
    disclaimer: VAULT_DELETION_DISCLAIMER,
  };
}
