import type {
  ConsentDirective,
  ConsentFrequency,
  ConsentPurpose,
  ConsentRecipientCategory,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * Rich consent evaluation. Never returns a bare boolean — callers get a
 * verdict + reason chain suitable for logging, audit and participant-visible
 * UI.
 *
 * Rules:
 *  - Purpose and recipient category MUST be supplied. If either is missing,
 *    the verdict is `insufficient_input`.
 *  - The latest directive for the (subject, purpose, recipient) tuple wins.
 *  - `deny` and `withdrawn` override any older `active` directive.
 *  - `one_time` directives are consumed atomically — evaluation records a
 *    `ConsentUseEvent` when a caller confirms the use. Bare evaluation does
 *    not consume.
 *  - Legacy `ConsentRecord`-only grants (no directive) are honoured only
 *    when the caller passes `allowLegacyRecordFallback = true` AND an
 *    explicit grantee.
 */

export type ConsentVerdict =
  | "allowed"
  | "denied"
  | "withdrawn"
  | "expired"
  | "not_configured"
  | "insufficient_input"
  | "requires_new_directive"
  | "one_time_already_used";

export interface EvaluateConsentDirectiveInput {
  subjectId: string;
  recipientCategory?: ConsentRecipientCategory | null;
  recipientOrganisationId?: string | null;
  recipientEntityId?: string | null;
  purpose?: ConsentPurpose | null;
  scopeKey?: string;
  allowLegacyRecordFallback?: boolean;
}

export interface EvaluateConsentDirectiveResult {
  verdict: ConsentVerdict;
  reason: string;
  directiveId: string | null;
  directive: ConsentDirective | null;
  frequency: ConsentFrequency | null;
  legacyRecordId: string | null;
  evaluatedAt: string;
}

export async function evaluateConsentDirective(
  input: EvaluateConsentDirectiveInput
): Promise<EvaluateConsentDirectiveResult> {
  const evaluatedAt = new Date().toISOString();

  if (!input.subjectId) {
    return baseResult(
      "insufficient_input",
      "subject_id_required",
      null,
      null,
      evaluatedAt
    );
  }
  if (!input.purpose) {
    return baseResult(
      "insufficient_input",
      "purpose_required",
      null,
      null,
      evaluatedAt
    );
  }
  if (!input.recipientCategory) {
    return baseResult(
      "insufficient_input",
      "recipient_category_required",
      null,
      null,
      evaluatedAt
    );
  }

  const now = new Date();

  const directive = await prisma.consentDirective.findFirst({
    where: {
      subjectId: input.subjectId,
      recipientCategory: input.recipientCategory,
      purpose: input.purpose,
      recipientOrganisationId: input.recipientOrganisationId ?? undefined,
      recipientEntityId: input.recipientEntityId ?? undefined,
    },
    orderBy: [{ effectiveFrom: "desc" }, { version: "desc" }],
  });

  if (directive) {
    if (
      directive.decision === "denied" ||
      directive.status === "withdrawn" ||
      directive.decision === "withdrawn"
    ) {
      return baseResult(
        directive.decision === "denied" ? "denied" : "withdrawn",
        directive.decision === "denied"
          ? "directive_denied"
          : "directive_withdrawn",
        directive.id,
        directive,
        evaluatedAt
      );
    }
    if (
      directive.effectiveUntil &&
      directive.effectiveUntil <= now
    ) {
      return baseResult(
        "expired",
        "directive_expired",
        directive.id,
        directive,
        evaluatedAt
      );
    }
    if (
      directive.decision !== "active" ||
      directive.status !== "active"
    ) {
      return baseResult(
        "requires_new_directive",
        "directive_inactive_or_superseded",
        directive.id,
        directive,
        evaluatedAt
      );
    }

    if (directive.frequency === "one_time") {
      const already = await prisma.consentUseEvent.findFirst({
        where: {
          directiveId: directive.id,
          outcome: "allowed",
        },
      });
      if (already) {
        return baseResult(
          "one_time_already_used",
          "one_time_directive_previously_consumed",
          directive.id,
          directive,
          evaluatedAt
        );
      }
    }

    if (
      input.scopeKey &&
      directive.scopeKeys?.length > 0 &&
      !directive.scopeKeys.includes(input.scopeKey)
    ) {
      return baseResult(
        "requires_new_directive",
        "scope_key_not_covered",
        directive.id,
        directive,
        evaluatedAt
      );
    }

    return {
      verdict: "allowed",
      reason: "directive_active",
      directiveId: directive.id,
      directive,
      frequency: directive.frequency,
      legacyRecordId: null,
      evaluatedAt,
    };
  }

  if (input.allowLegacyRecordFallback && input.recipientOrganisationId) {
    const record = await prisma.consentRecord.findFirst({
      where: {
        subjectUserId: input.subjectId,
        grantedToOrganisationId: input.recipientOrganisationId,
        status: "active",
        OR: [{ expiryDate: null }, { expiryDate: { gt: now } }],
      },
    });
    if (record) {
      return {
        verdict: "allowed",
        reason: "legacy_record_fallback",
        directiveId: null,
        directive: null,
        frequency: null,
        legacyRecordId: record.id,
        evaluatedAt,
      };
    }
  }

  return baseResult(
    "not_configured",
    "no_directive_present",
    null,
    null,
    evaluatedAt
  );
}

function baseResult(
  verdict: ConsentVerdict,
  reason: string,
  directiveId: string | null,
  directive: ConsentDirective | null,
  evaluatedAt: string
): EvaluateConsentDirectiveResult {
  return {
    verdict,
    reason,
    directiveId,
    directive,
    frequency: directive?.frequency ?? null,
    legacyRecordId: null,
    evaluatedAt,
  };
}
