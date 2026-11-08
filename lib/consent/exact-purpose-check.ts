/**
 * Proposed Stage 1 exact-purpose consent gate.
 *
 * Current production `checkConsent()` matches subject, scope, recipient, active
 * status and expiry only. This helper is the reviewable contract for purpose,
 * recipient and data-field checks. It is not wired into `requireConsent` or
 * any live agent/tool path in Stage 0.
 */
import { consentScopeToPrisma } from "@/lib/consent/scope-map";
import { prisma } from "@/lib/prisma";
import type { ConsentScope } from "@/types/mapable";

export type ExactPurposeConsentQuery = {
  subjectUserId: string;
  scope: ConsentScope;
  purpose: string;
  grantedToUserId?: string;
  grantedToOrganisationId?: string;
  requestedFields?: string[];
};

export type ExactPurposeConsentResult = {
  allowed: boolean;
  reason: string;
  consentRecordId?: string;
};

function fieldList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export async function checkExactPurposeConsent(
  query: ExactPurposeConsentQuery,
): Promise<ExactPurposeConsentResult> {
  if (!query.purpose.trim()) {
    return { allowed: false, reason: "Exact purpose is required" };
  }

  const now = new Date();
  const record = await prisma.consentRecord.findFirst({
    where: {
      subjectUserId: query.subjectUserId,
      scope: consentScopeToPrisma(query.scope),
      status: "active",
      purpose: query.purpose,
      ...(query.grantedToUserId ? { grantedToUserId: query.grantedToUserId } : {}),
      ...(query.grantedToOrganisationId
        ? { grantedToOrganisationId: query.grantedToOrganisationId }
        : {}),
      OR: [{ expiryDate: null }, { expiryDate: { gt: now } }],
    },
  });

  if (!record) {
    return {
      allowed: false,
      reason: "No active consent for this exact purpose, scope and recipient",
    };
  }

  const requested = query.requestedFields ?? [];
  if (requested.length > 0) {
    const permitted = fieldList(record.dataScope);
    const extra = requested.filter((field) => !permitted.includes(field));
    if (extra.length > 0) {
      return {
        allowed: false,
        reason: `Requested fields not in dataScope: ${extra.join(", ")}`,
        consentRecordId: record.id,
      };
    }
  }

  return {
    allowed: true,
    reason: "Exact-purpose consent matched",
    consentRecordId: record.id,
  };
}
