import type {
  ConsentPurpose,
  ConsentRecipientCategory,
  DisclosureManifest,
} from "@prisma/client";

import { evaluateConsentDirective } from "@/lib/consent-v2/evaluation";
import { issueReceiptForDirective } from "@/lib/consent-v2/receipts";
import { recordConsentUse } from "@/lib/consent-v2/usage";
import { prisma } from "@/lib/prisma";

import { auditDisclosure } from "./audit";
import { isCrossTenantDisclosure } from "./cross-tenant";
import { applyRedaction } from "./redaction";
import { relabelKeys } from "./transform";

/**
 * `discloseParticipantData` is the MANDATORY gateway for any external-facing
 * participant-data egress path. Every code path that could return
 * participant data to another party (a verifier, a partner app, a
 * cross-tenant provider) MUST go through this function.
 *
 * The gateway:
 *   1. Refuses on missing purpose or recipient.
 *   2. Evaluates the directive layer via `evaluateConsentDirective`.
 *   3. Mints a `DisclosureManifest` recording the decision and minimised
 *      payload shape.
 *   4. Records a `ConsentUseEvent` referencing the directive.
 *   5. Optionally issues a fresh `ConsentReceipt`.
 *
 * Simulator flag defaults to `true` so external routes cannot accidentally
 * emit real data unless the caller has explicitly resolved `simulator=false`.
 */

export interface DiscloseParticipantDataInput {
  subjectId: string;
  actorId?: string | null;
  purpose: ConsentPurpose;
  recipientCategory: ConsentRecipientCategory;
  recipientOrganisationId?: string | null;
  recipientEntityKey?: string | null;
  purposeSummary: string;
  requestedFields: string[];
  candidatePayload: Record<string, unknown>;
  privacyMode?: "minimum_necessary" | "strict" | "open";
  simulator?: boolean;
  correlationId?: string;
}

export interface DiscloseParticipantDataResult {
  decision: "allowed" | "minimised" | "denied" | "requires_participant_review";
  manifest: DisclosureManifest | null;
  outbound: Record<string, unknown> | null;
  redactedFields: string[];
  directiveId: string | null;
  receiptId: string | null;
  reason: string;
  crossTenant: boolean;
}

export async function discloseParticipantData(
  input: DiscloseParticipantDataInput
): Promise<DiscloseParticipantDataResult> {
  if (!input.subjectId || !input.purpose || !input.recipientCategory) {
    await auditDisclosure({
      actorId: input.actorId ?? null,
      subjectId: input.subjectId ?? "unknown",
      action: "disclose_participant_data",
      metadata: { reason: "insufficient_input" },
      outcome: "denied",
    });
    return {
      decision: "denied",
      manifest: null,
      outbound: null,
      redactedFields: [],
      directiveId: null,
      receiptId: null,
      reason: "insufficient_input",
      crossTenant: false,
    };
  }

  const verdict = await evaluateConsentDirective({
    subjectId: input.subjectId,
    recipientCategory: input.recipientCategory,
    recipientOrganisationId: input.recipientOrganisationId ?? null,
    purpose: input.purpose,
    allowLegacyRecordFallback: false,
  });

  if (verdict.verdict !== "allowed") {
    await auditDisclosure({
      actorId: input.actorId ?? null,
      subjectId: input.subjectId,
      action: "disclose_participant_data",
      metadata: {
        verdict: verdict.verdict,
        reason: verdict.reason,
        purpose: input.purpose,
        recipientCategory: input.recipientCategory,
      },
      outcome: verdict.verdict === "denied" ? "denied" : "denied",
    });
    return {
      decision:
        verdict.verdict === "denied" || verdict.verdict === "withdrawn"
          ? "denied"
          : "denied",
      manifest: null,
      outbound: null,
      redactedFields: [],
      directiveId: verdict.directiveId,
      receiptId: null,
      reason: verdict.reason,
      crossTenant: false,
    };
  }

  const crossTenant = await isCrossTenantDisclosure({
    subjectId: input.subjectId,
    recipientOrganisationId: input.recipientOrganisationId ?? null,
  });

  const policy = input.privacyMode ?? "minimum_necessary";
  const redaction = applyRedaction(input.candidatePayload, policy);
  const outbound = relabelKeys(redaction.outbound);

  const receipt = verdict.directive
    ? await issueReceiptForDirective(verdict.directive, input.subjectId)
    : null;

  const manifest = await prisma.disclosureManifest.create({
    data: {
      subjectId: input.subjectId,
      recipientOrganisationId: input.recipientOrganisationId ?? null,
      recipientEntityKey: input.recipientEntityKey ?? null,
      purposeSummary: input.purposeSummary,
      decision: redaction.redactedKeys.length > 0 ? "minimised" : "allowed",
      requestedFields: input.requestedFields,
      minimisedFields: Object.keys(outbound),
      redactedFields: redaction.redactedKeys,
      directiveId: verdict.directiveId ?? null,
      receiptId: receipt?.id ?? null,
      simulator: input.simulator ?? true,
    },
  });

  if (verdict.directiveId) {
    await recordConsentUse({
      directiveId: verdict.directiveId,
      actorId: input.actorId ?? null,
      actorLabel:
        input.recipientEntityKey ??
        input.recipientOrganisationId ??
        input.recipientCategory,
      purpose: input.purpose,
      action: "external_disclosure",
      outcome:
        redaction.redactedKeys.length > 0 ? "minimised" : "allowed",
      minimisation: {
        requested: input.requestedFields,
        redacted: redaction.redactedKeys,
        crossTenant,
      },
      correlationId: input.correlationId ?? null,
    });
  }

  await auditDisclosure({
    actorId: input.actorId ?? null,
    subjectId: input.subjectId,
    action: "disclose_participant_data",
    metadata: {
      manifestId: manifest.id,
      directiveId: verdict.directiveId,
      redactedFields: redaction.redactedKeys,
      crossTenant,
    },
    outcome: manifest.decision === "minimised" ? "minimised" : "allowed",
  });

  return {
    decision: manifest.decision as "allowed" | "minimised",
    manifest,
    outbound,
    redactedFields: redaction.redactedKeys,
    directiveId: verdict.directiveId,
    receiptId: receipt?.id ?? null,
    reason: "directive_active",
    crossTenant,
  };
}
