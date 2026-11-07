/**
 * Shared exact-purpose consent verification (ACS Stage 1 / C1).
 * Sole SoT remains ConsentRecord — no second consent ledger.
 */

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { hasParticipantAuthority } from "@/lib/authority/participant-authority-service";
import { createConsentReceipt } from "@/lib/consent/consent-receipt-service";
import { consentScopeToPrisma } from "@/lib/consent/scope-map";
import { prisma } from "@/lib/prisma";
import type { ConsentScope } from "@/types/mapable";

export type PurposeConsentVerificationInput = {
  tenantId: string;
  participantId: string;
  actorUserId: string;
  /** API dotted consent scope (e.g. profile.read). */
  scope: ConsentScope;
  purpose: string;
  /** Fields the caller intends to read/write. */
  permittedFields?: string[];
  /** Action the caller intends to perform. */
  action: string;
  /** When actor ≠ participant, require a scoped authority grant. */
  delegationDomain?: string;
  now?: Date;
  silent?: boolean;
  /** Audit action string when consent is used (default purpose_consent.used). */
  auditUsedAction?: string;
  /** Audit action string when consent is blocked (default purpose_consent.blocked). */
  auditBlockedAction?: string;
};

export type PurposeConsentVerificationResult =
  | {
      ok: true;
      consentRecordId: string;
      consentReceiptId: string | null;
      viaDelegation: boolean;
    }
  | {
      ok: false;
      reason:
        | "consent_missing"
        | "consent_expired"
        | "consent_withdrawn"
        | "consent_superseded"
        | "purpose_mismatch"
        | "fields_insufficient"
        | "action_not_permitted"
        | "tenant_mismatch"
        | "delegation_invalid";
    };

/**
 * Verify purpose-specific consent before a protected AI / programme tool call.
 */
export async function verifyPurposeConsent(
  input: PurposeConsentVerificationInput,
): Promise<PurposeConsentVerificationResult> {
  const now = input.now ?? new Date();
  const auditUsed = input.auditUsedAction ?? "purpose_consent.used";
  const auditBlocked = input.auditBlockedAction ?? "purpose_consent.blocked";

  if (input.tenantId.trim().length === 0) {
    return fail(input, "tenant_mismatch", auditBlocked);
  }

  const viaDelegation = input.actorUserId !== input.participantId;
  if (viaDelegation) {
    const authorised = await hasParticipantAuthority({
      participantId: input.participantId,
      actorUserId: input.actorUserId,
      tenantId: input.tenantId,
      domain: input.delegationDomain ?? "navigator",
      action: input.action,
      consentScopes: [input.scope],
      now,
    });
    if (!authorised) {
      return fail(input, "delegation_invalid", auditBlocked);
    }
  }

  const prismaScope = consentScopeToPrisma(input.scope);

  const candidates = await prisma.consentRecord.findMany({
    where: {
      subjectUserId: input.participantId,
      scope: prismaScope,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  if (candidates.length === 0) {
    return fail(input, "consent_missing", auditBlocked);
  }

  const matching = candidates.filter(
    (row) =>
      row.purpose === input.purpose ||
      row.purpose.startsWith(`${input.purpose}.`),
  );

  if (matching.length === 0) {
    return fail(input, "purpose_mismatch", auditBlocked);
  }

  const current = matching[0];

  if (current.status === "revoked") {
    return fail(input, "consent_withdrawn", auditBlocked);
  }
  if (current.status === "expired") {
    return fail(input, "consent_expired", auditBlocked);
  }
  if (current.status !== "active") {
    return fail(input, "consent_missing", auditBlocked);
  }
  if (current.expiryDate && current.expiryDate <= now) {
    return fail(input, "consent_expired", auditBlocked);
  }

  const newerActive = matching.find(
    (row) =>
      row.id !== current.id &&
      row.createdAt > current.createdAt &&
      row.status === "active" &&
      (!row.expiryDate || row.expiryDate > now),
  );
  if (newerActive) {
    return fail(input, "consent_superseded", auditBlocked);
  }

  const dataScope = normalizeDataScope(current.dataScope);
  if (input.permittedFields && input.permittedFields.length > 0) {
    if (dataScope.length > 0) {
      const missing = input.permittedFields.filter(
        (field) => !dataScope.includes(field) && !dataScope.includes("*"),
      );
      if (missing.length > 0) {
        return fail(input, "fields_insufficient", auditBlocked);
      }
    }
  }

  const sourceAction = current.sourceAction?.trim();
  if (sourceAction && sourceAction.length > 0) {
    const allowedActions = sourceAction.split(",").map((s) => s.trim());
    if (
      !allowedActions.includes(input.action) &&
      !allowedActions.includes("*")
    ) {
      return fail(input, "action_not_permitted", auditBlocked);
    }
  }

  let consentReceiptId: string | null = null;
  if (!input.silent) {
    const receipt = await createConsentReceipt({
      consentRecordId: current.id,
      participantId: input.participantId,
      actorUserId: input.actorUserId,
      scope: input.scope,
      purpose: input.purpose,
      action: "used",
    });
    consentReceiptId = receipt.id;
    await createAuditEvent({
      actorUserId: input.actorUserId,
      participantId: input.participantId,
      action: auditUsed,
      entityType: "ConsentRecord",
      entityId: current.id,
      metadata: {
        tenantId: input.tenantId,
        purpose: input.purpose,
        scope: input.scope,
        action: input.action,
        viaDelegation,
        consentReceiptId,
      },
    });
  }

  return {
    ok: true,
    consentRecordId: current.id,
    consentReceiptId,
    viaDelegation,
  };
}

function normalizeDataScope(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  return [];
}

type PurposeConsentFailureReason = Extract<
  PurposeConsentVerificationResult,
  { ok: false }
>["reason"];

async function fail(
  input: PurposeConsentVerificationInput,
  reason: PurposeConsentFailureReason,
  auditBlockedAction: string,
): Promise<Extract<PurposeConsentVerificationResult, { ok: false }>> {
  if (!input.silent) {
    try {
      await createConsentReceipt({
        participantId: input.participantId,
        actorUserId: input.actorUserId,
        scope: input.scope,
        purpose: input.purpose,
        action: "blocked",
      });
    } catch {
      // Receipt write must not mask the consent failure.
    }
    await createAuditEvent({
      actorUserId: input.actorUserId,
      participantId: input.participantId,
      action: auditBlockedAction,
      entityType: "ConsentRecord",
      entityId: "blocked",
      metadata: {
        tenantId: input.tenantId,
        purpose: input.purpose,
        scope: input.scope,
        action: input.action,
        reason,
      },
    });
  }
  return { ok: false, reason };
}
