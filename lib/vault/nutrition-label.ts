import { getTaxonomyEntry } from "@/lib/vault/taxonomy";
import type { VaultClassification, VaultNutritionLabel } from "@/lib/vault/types";
import { VAULT_DELETION_DISCLAIMER } from "@/lib/vault/config";

type VaultItemLike = {
  id: string;
  displayName: string;
  itemType: string;
  canonicalDomain: string;
  canonicalRecordId: string | null;
  vaultTreatment: string;
  classification: string;
  fieldManifestJson: unknown;
  purpose: string;
  encryptionState: string;
  exportState: string | null;
  deletionState: string | null;
  retentionReason: string | null;
  expiresAt: Date | null;
  updatedAt: Date;
  vault: { ownerUserId: string };
};

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string");
  }
  return [];
}

function storageLocation(treatment: string): string {
  switch (treatment) {
    case "reference_only":
      return "Reference only — canonical MapAble system owns the record";
    case "metadata_only":
      return "Vault metadata index only";
    case "local_only":
      return "Selected trusted devices (local Vault)";
    case "encrypted_copy":
    case "encrypted_original":
      return "Encrypted in MapAble Vault (custodial — not end-to-end)";
    case "not_permitted":
      return "Not stored in Vault";
    default:
      return treatment;
  }
}

export function buildNutritionLabel(item: VaultItemLike): VaultNutritionLabel {
  const taxonomy = getTaxonomyEntry(item.itemType);
  const fields = asStringArray(item.fieldManifestJson);
  const deletionOptions = [
    "Remove Vault index entry (does not delete canonical record unless separately requested)",
    ...(taxonomy?.deletionLimitations ?? []),
  ];

  return {
    itemId: item.id,
    itemName: item.displayName,
    canonicalSource: taxonomy?.canonicalOwnerLabel ?? item.canonicalDomain,
    ownerUserId: item.vault.ownerUserId,
    purpose: item.purpose,
    fields,
    sensitivity: item.classification as VaultClassification,
    storageLocation: storageLocation(item.vaultTreatment),
    encryptionState: item.encryptionState,
    devicesWithCopy: [],
    organisationsWithAccess: [],
    expiresAt: item.expiresAt?.toISOString() ?? null,
    retentionReason:
      item.retentionReason ?? "Participant-visible index of canonical information",
    lastUseAt: item.updatedAt.toISOString(),
    lastDisclosureAt: null,
    exportStatus: item.exportState ?? "unknown",
    deletionOptions,
    limitations: [
      VAULT_DELETION_DISCLAIMER,
      item.vaultTreatment === "reference_only"
        ? "This Vault item is a reference. Editing happens in the canonical system."
        : "See deletion options for boundaries.",
      ...(item.canonicalRecordId
        ? [`Canonical record id: ${item.canonicalRecordId}`]
        : []),
    ],
    auditLink: `/vault/history?itemId=${item.id}`,
  };
}
