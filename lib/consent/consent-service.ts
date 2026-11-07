import type { ConsentScope as PrismaConsentScope ,
  ConsentRecipientType,
  ConsentShareMode,
} from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { createConsentReceipt } from "@/lib/consent/consent-receipt-service";
import { consentScopeFromPrisma, consentScopeToPrisma } from "@/lib/consent/scope-map";
import {
  fieldCategoriesForConsentScope,
  filterFieldCategoriesForRecipient,
  invalidatePassportProjectionCache,
} from "@/lib/passport";
import { prisma } from "@/lib/prisma";
import {
  getProtectedReadInvalidationEpoch,
  invalidateProtectedReadsOnRevocation,
} from "@/lib/programmes/aura/durable-stop";
import { recordDisclosureReceipt } from "@/lib/trust/fabric/receipt-service";
import type { ConsentScope, ConsentStatus } from "@/types/mapable";

/** Re-exported so revoke paths can observe stop/consent invalidation epoch. */
export { getProtectedReadInvalidationEpoch };


export interface GrantConsentInput {
  subjectUserId: string;
  grantedToUserId?: string;
  grantedToOrganisationId?: string;
  scope: ConsentScope;
  purpose: string;
  expiryDate?: Date;
  createdById: string;
  shareMode?: ConsentShareMode;
  recipientType?: ConsentRecipientType;
  dataScope?: string[];
  sourceAction?: string;
  /**
   * Existing sharing flows default to recording a disclosure receipt when the
   * consent is granted. Set false only when consent is being created as
   * authority for a later, separately audited disclosure event.
   */
  recordDisclosureOnGrant?: boolean;
}

export async function grantConsent(input: GrantConsentInput) {
  const record = await prisma.consentRecord.create({
    data: {
      subjectUserId: input.subjectUserId,
      grantedToUserId: input.grantedToUserId,
      grantedToOrganisationId: input.grantedToOrganisationId,
      scope: consentScopeToPrisma(input.scope),
      purpose: input.purpose,
      status: "active",
      expiryDate: input.expiryDate,
      createdById: input.createdById,
      shareMode: input.shareMode,
      recipientType: input.recipientType,
      dataScope: input.dataScope ?? undefined,
      sourceAction: input.sourceAction,
    },
  });

  await createAuditEvent({
    actorUserId: input.createdById,
    action: "consent.granted",
    entityType: "ConsentRecord",
    entityId: record.id,
    participantId: input.subjectUserId,
    metadata: { scope: input.scope },
  });

  await createConsentReceipt({
    consentRecordId: record.id,
    participantId: input.subjectUserId,
    actorUserId: input.createdById,
    scope: input.scope,
    purpose: input.purpose,
    recipientType: input.recipientType,
    recipientId: input.grantedToUserId ?? input.grantedToOrganisationId,
    action: "granted",
  });

  if (input.recordDisclosureOnGrant !== false) {
    const fieldCategories = filterFieldCategoriesForRecipient(
      fieldCategoriesForConsentScope(input.scope),
      input.recipientType,
    );

    await recordDisclosureReceipt({
      actorUserId: input.createdById,
      participantId: input.subjectUserId,
      organisationId: input.grantedToOrganisationId,
      purpose: input.purpose,
      fieldCategories,
      consentRecordId: record.id,
      expiresAt: input.expiryDate ?? null,
    });
  }

  return record;
}

export async function revokeConsent(
  consentId: string,
  revokedById: string
) {
  const record = await prisma.consentRecord.update({
    where: { id: consentId },
    data: {
      status: "revoked",
      revokedById,
      revokedAt: new Date(),
    },
  });

  await createAuditEvent({
    actorUserId: revokedById,
    action: "consent.revoked",
    entityType: "ConsentRecord",
    entityId: record.id,
    participantId: record.subjectUserId,
  });

  const scope = consentScopeFromPrisma(record.scope);

  invalidatePassportProjectionCache(record.subjectUserId);
  invalidateProtectedReadsOnRevocation();

  await createConsentReceipt({
    consentRecordId: record.id,
    participantId: record.subjectUserId,
    actorUserId: revokedById,
    scope,
    purpose: record.purpose,
    recipientType: record.recipientType ?? undefined,
    recipientId: record.grantedToUserId ?? record.grantedToOrganisationId ?? undefined,
    action: "revoked",
  });

  await recordDisclosureReceipt({
    actorUserId: revokedById,
    participantId: record.subjectUserId,
    organisationId: record.grantedToOrganisationId ?? undefined,
    purpose: `revoked:${record.purpose}`,
    fieldCategories: fieldCategoriesForConsentScope(scope),
    consentRecordId: record.id,
  });

  return record;
}

export async function checkConsent(params: {
  subjectUserId: string;
  scope: ConsentScope;
  grantedToUserId?: string;
  grantedToOrganisationId?: string;
  /**
   * When set, require an exact purpose match (or purpose.* prefix) on the
   * active ConsentRecord. ACS Stage 1 / C1 — optional for legacy callers.
   */
  purpose?: string;
  /** When set with purpose, require these fields ⊆ consent dataScope (unless *). */
  permittedFields?: string[];
  /** When set, require action ∈ sourceAction CSV (unless *). */
  sourceAction?: string;
}): Promise<boolean> {
  const prismaScope = consentScopeToPrisma(params.scope);
  const now = new Date();

  const records = await prisma.consentRecord.findMany({
    where: {
      subjectUserId: params.subjectUserId,
      scope: prismaScope,
      status: "active",
      ...(params.grantedToUserId
        ? { grantedToUserId: params.grantedToUserId }
        : {}),
      ...(params.grantedToOrganisationId
        ? { grantedToOrganisationId: params.grantedToOrganisationId }
        : {}),
      OR: [{ expiryDate: null }, { expiryDate: { gt: now } }],
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  if (records.length === 0) return false;

  if (!params.purpose) {
    return true;
  }

  const matching = records.filter(
    (row) =>
      row.purpose === params.purpose ||
      row.purpose.startsWith(`${params.purpose}.`),
  );
  if (matching.length === 0) return false;

  const current = matching[0];

  if (params.permittedFields && params.permittedFields.length > 0) {
    const dataScope = Array.isArray(current.dataScope)
      ? current.dataScope.filter((item): item is string => typeof item === "string")
      : [];
    if (dataScope.length > 0) {
      const missing = params.permittedFields.filter(
        (field) => !dataScope.includes(field) && !dataScope.includes("*"),
      );
      if (missing.length > 0) return false;
    }
  }

  if (params.sourceAction) {
    const sourceAction = current.sourceAction?.trim();
    if (sourceAction && sourceAction.length > 0) {
      const allowed = sourceAction.split(",").map((s) => s.trim());
      if (!allowed.includes(params.sourceAction) && !allowed.includes("*")) {
        return false;
      }
    }
  }

  return true;
}

export async function listConsentsForParticipant(subjectUserId: string) {
  const records = await prisma.consentRecord.findMany({
    where: { subjectUserId },
    orderBy: { createdAt: "desc" },
    include: {
      grantedToOrganisation: { select: { id: true, name: true } },
      grantedToUser: { select: { id: true, name: true, email: true } },
    },
  });

  return records.map((r) => ({
    ...r,
    scope: consentScopeFromPrisma(r.scope),
    scopeLabel: r.scope.replace(/_/g, "."),
  }));
}

export function isConsentActive(
  status: string,
  expiryDate: Date | null
): ConsentStatus {
  if (status === "revoked") return "revoked";
  if (status === "pending") return "pending";
  if (expiryDate && expiryDate < new Date()) return "expired";
  if (status === "active") return "active";
  return status as ConsentStatus;
}

export async function canShareAccessibilityWithOrganisation(
  participantId: string,
  organisationId: string,
  bookingType: "care" | "transport" | "care_transport"
): Promise<boolean> {
  const scope: ConsentScope =
    bookingType === "transport"
      ? "transport.accessibility_share"
      : bookingType === "care"
        ? "care.accessibility_share"
        : "accessibility.read";

  return checkConsent({
    subjectUserId: participantId,
    scope,
    grantedToOrganisationId: organisationId,
  });
}

export type { PrismaConsentScope };

/**
 * Service-lane consent (ConsentRecord) is orthogonal to research-lane consent
 * (ResearchConsentRecord). Granting one never implies the other.
 */
export function isServiceLaneConsentScope(_scope: ConsentScope): true {
  return true;
}
