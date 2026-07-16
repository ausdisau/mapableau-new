import purposesRegistry from "@/data/vault/purposes.v1.json";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import {
  isVaultSelectiveDisclosureEnabled,
  vaultConfig,
} from "@/lib/vault/config";
import {
  getOrCreatePersonalVault,
  VaultDisabledError,
} from "@/lib/vault/registry";
import type { VaultDisclosureCompileResult } from "@/lib/vault/types";

type PurposeDef = {
  code: string;
  description: string;
  allowedFields: string[];
  prohibitedFields: string[];
  participantReviewRequired: boolean;
  humanReviewRequired: boolean;
  defaultDurationHours: number;
};

const purposes = purposesRegistry.purposes as PurposeDef[];

function getPurpose(code: string): PurposeDef | undefined {
  return purposes.find((p) => p.code === code);
}

/**
 * Deterministic purpose-aware query compiler.
 * The model cannot expand the permitted field set.
 */
export function compileDisclosureRequest(params: {
  purposeCode: string;
  requestedFields: string[];
}): VaultDisclosureCompileResult {
  const purpose = getPurpose(params.purposeCode);
  if (!purpose) {
    return {
      purposeCode: params.purposeCode,
      permittedFields: [],
      deniedFields: params.requestedFields,
      reasons: [
        {
          code: "PURPOSE_UNREGISTERED",
          message: "Purpose not found in Vault purpose registry",
        },
      ],
      participantReviewRequired: true,
      humanReviewRequired: true,
      mode: vaultConfig.mode === "shadow" ? "shadow" : "live",
    };
  }

  const permitted: string[] = [];
  const denied: string[] = [];
  const reasons: VaultDisclosureCompileResult["reasons"] = [];
  const allowed = new Set(purpose.allowedFields);
  const prohibited = new Set(purpose.prohibitedFields);

  for (const field of params.requestedFields) {
    if (prohibited.has(field) || !allowed.has(field)) {
      denied.push(field);
      reasons.push({
        code: prohibited.has(field) ? "FIELD_PROHIBITED" : "FIELD_NOT_IN_PURPOSE",
        message: `${field} is not permitted for ${purpose.description}`,
        field,
      });
      continue;
    }
    permitted.push(field);
    reasons.push({
      code: "FIELD_PERMITTED",
      message: `${field} is permitted for this purpose`,
      field,
    });
  }

  const alternative = purpose.allowedFields.filter(
    (f) => !params.requestedFields.includes(f)
  );

  return {
    purposeCode: params.purposeCode,
    permittedFields: permitted,
    deniedFields: denied,
    reasons,
    alternativePredicate:
      alternative.length > 0
        ? `Lower-disclosure alternative fields: ${alternative.join(", ")}`
        : undefined,
    derivedClaimOption:
      denied.includes("diagnosis") || denied.includes("access_passport.full")
        ? "Offer functional predicates instead of raw clinical or full-passport fields"
        : undefined,
    participantReviewRequired: purpose.participantReviewRequired,
    humanReviewRequired: purpose.humanReviewRequired,
    mode:
      vaultConfig.mode === "demo" || vaultConfig.mode === "shadow"
        ? "shadow"
        : "live",
  };
}

export function buildDisclosureDiff(params: {
  previousFields: string[];
  nextPermitted: string[];
  nextDenied: string[];
}) {
  const prev = new Set(params.previousFields);
  const next = new Set(params.nextPermitted);
  const added = params.nextPermitted.filter((f) => !prev.has(f));
  const removed = params.previousFields.filter((f) => !next.has(f));
  const unchanged = params.nextPermitted.filter((f) => prev.has(f));
  return {
    added,
    removed,
    unchanged,
    denied: params.nextDenied,
    accessibilityNote:
      "Added, removed and denied fields are labelled in text — do not rely on colour alone.",
  };
}

export async function persistCompiledDisclosure(params: {
  ownerUserId: string;
  purposeCode: string;
  requestedFields: string[];
  itemId?: string;
  recipientLabel?: string;
  previousFields?: string[];
}) {
  if (!isVaultSelectiveDisclosureEnabled()) {
    throw new VaultDisabledError("VAULT_SELECTIVE_DISCLOSURE_DISABLED");
  }

  const compiled = compileDisclosureRequest({
    purposeCode: params.purposeCode,
    requestedFields: params.requestedFields,
  });
  const vault = await getOrCreatePersonalVault(params.ownerUserId);
  const purpose = getPurpose(params.purposeCode);
  const expiresAt = purpose
    ? new Date(Date.now() + purpose.defaultDurationHours * 60 * 60 * 1000)
    : null;

  const view = await prisma.vaultDisclosureView.create({
    data: {
      vaultId: vault.id,
      itemId: params.itemId,
      purposeCode: params.purposeCode,
      recipientLabel: params.recipientLabel,
      permittedFields: compiled.permittedFields,
      deniedFields: compiled.deniedFields,
      reasonsJson: compiled.reasons,
      status: "compiled",
      mode: compiled.mode,
      expiresAt,
    },
  });

  await createAuditEvent({
    actorUserId: params.ownerUserId,
    action: "vault.disclosure_compiled",
    entityType: "VaultDisclosureView",
    entityId: view.id,
    participantId: params.ownerUserId,
    metadata: {
      purposeCode: params.purposeCode,
      permittedCount: compiled.permittedFields.length,
      deniedCount: compiled.deniedFields.length,
      mode: compiled.mode,
    },
  });

  return {
    compiled,
    view,
    diff: buildDisclosureDiff({
      previousFields: params.previousFields ?? [],
      nextPermitted: compiled.permittedFields,
      nextDenied: compiled.deniedFields,
    }),
  };
}

export async function approveDisclosure(
  disclosureId: string,
  ownerUserId: string
) {
  if (!isVaultSelectiveDisclosureEnabled()) {
    throw new VaultDisabledError("VAULT_SELECTIVE_DISCLOSURE_DISABLED");
  }

  const view = await prisma.vaultDisclosureView.findUnique({
    where: { id: disclosureId },
    include: { vault: true },
  });
  if (!view || view.vault.ownerUserId !== ownerUserId) {
    return null;
  }

  if (view.mode === "shadow") {
    await prisma.vaultDisclosureReceipt.create({
      data: {
        disclosureId,
        eventType: "shadow_approval_recorded",
        actorUserId: ownerUserId,
        metadataJson: {
          note: "Shadow mode — no live recipient access granted",
        },
      },
    });
  }

  const updated = await prisma.vaultDisclosureView.update({
    where: { id: disclosureId },
    data: {
      status: view.mode === "shadow" ? "shadow_approved" : "approved",
      approvedAt: new Date(),
    },
  });

  await createAuditEvent({
    actorUserId: ownerUserId,
    action: "vault.disclosure_approved",
    entityType: "VaultDisclosureView",
    entityId: disclosureId,
    participantId: ownerUserId,
    metadata: { mode: view.mode },
  });

  return updated;
}
