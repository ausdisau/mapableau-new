import { z } from "zod";

import type {
  ConsentDirective,
  ConsentDirectiveDecision,
  ConsentDirectiveStatus,
  ConsentFrequency,
  ConsentPurpose,
  ConsentRecipientCategory,
} from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { asJson } from "@/lib/prisma-json";

import { issueReceiptForDirective } from "./receipts";

/**
 * Wave 9 consent directives are IMMUTABLE. `writeConsentDirective` never
 * updates an existing row. Revoke, withdraw or supersede all create a new
 * version whose `supersedesId` points at the previous one.
 *
 * AI cannot author a directive. `authorId` must be a real user. This is
 * enforced at the API layer by requiring a session; the schema does not
 * distinguish AI users, so we surface the invariant here in code and docs.
 */

export const consentDirectiveInputSchema = z.object({
  subjectId: z.string().min(1),
  authorId: z.string().min(1),
  recipientCategory: z.enum([
    "self",
    "family_or_informal_supporter",
    "emergency_contact",
    "support_coordinator",
    "plan_manager",
    "registered_provider",
    "unregistered_provider",
    "government_agency",
    "research_partner",
    "external_verifier",
    "external_app",
    "federation_partner",
    "mapable_internal_ops",
  ]),
  recipientOrganisationId: z.string().nullish(),
  recipientEntityId: z.string().nullish(),
  purpose: z.enum([
    "service_delivery",
    "billing",
    "safeguarding",
    "accessibility_share",
    "transport_coordination",
    "care_coordination",
    "emergency_response",
    "research_deidentified",
    "regulatory_reporting",
    "quality_improvement",
    "external_verification",
    "portability_export",
    "audit_and_compliance",
  ]),
  purposeDetail: z.string().min(3),
  scopeKeys: z.array(z.string().min(1)).default([]),
  frequency: z.enum([
    "one_time",
    "session_bound",
    "ongoing_until_revoked",
    "fixed_period",
    "event_bound",
  ]),
  decision: z
    .enum(["active", "denied", "withdrawn", "superseded", "expired"])
    .default("active"),
  effectiveFrom: z.date().optional(),
  effectiveUntil: z.date().nullish(),
  supersedesId: z.string().nullish(),
  proofBundle: z.record(z.string(), z.unknown()).nullish(),
});

export type ConsentDirectiveInput = z.infer<typeof consentDirectiveInputSchema>;

export interface WriteConsentDirectiveResult {
  directive: ConsentDirective;
  receiptId: string;
  supersededPreviousId: string | null;
}

/**
 * Persist a new immutable directive. If `supersedesId` is provided, the prior
 * directive is transitioned to `status = superseded` (an audit-friendly
 * marker; the row's own content is preserved).
 */
export async function writeConsentDirective(
  raw: ConsentDirectiveInput
): Promise<WriteConsentDirectiveResult> {
  const input = consentDirectiveInputSchema.parse(raw);

  const version = input.supersedesId
    ? await nextVersionFor(input.supersedesId)
    : 1;

  const directive = await prisma.$transaction(async (tx) => {
    const status: ConsentDirectiveStatus =
      input.decision === "active"
        ? "active"
        : input.decision === "withdrawn"
          ? "withdrawn"
          : input.decision === "expired"
            ? "expired"
            : input.decision === "superseded"
              ? "superseded"
              : "active";

    const created = await tx.consentDirective.create({
      data: {
        subjectId: input.subjectId,
        authorId: input.authorId,
        version,
        recipientCategory: input.recipientCategory as ConsentRecipientCategory,
        recipientOrganisationId: input.recipientOrganisationId ?? null,
        recipientEntityId: input.recipientEntityId ?? null,
        purpose: input.purpose as ConsentPurpose,
        purposeDetail: input.purposeDetail,
        scopeKeys: input.scopeKeys ?? [],
        frequency: input.frequency as ConsentFrequency,
        decision: input.decision as ConsentDirectiveDecision,
        status,
        effectiveFrom: input.effectiveFrom ?? new Date(),
        effectiveUntil: input.effectiveUntil ?? null,
        supersedesId: input.supersedesId ?? null,
        proofBundle: asJson(input.proofBundle ?? undefined),
      },
    });

    if (input.supersedesId) {
      await tx.consentDirective.update({
        where: { id: input.supersedesId },
        data: { status: "superseded" },
      });
    }

    return created;
  });

  const receipt = await issueReceiptForDirective(directive, input.authorId);

  await createAuditEvent({
    actorUserId: input.authorId,
    action: "consent.directive.written",
    entityType: "ConsentDirective",
    entityId: directive.id,
    participantId: input.subjectId,
    metadata: {
      purpose: directive.purpose,
      decision: directive.decision,
      recipientCategory: directive.recipientCategory,
      version: directive.version,
      supersededPreviousId: input.supersedesId ?? null,
    },
  }).catch(() => {});

  return {
    directive,
    receiptId: receipt.id,
    supersededPreviousId: input.supersedesId ?? null,
  };
}

async function nextVersionFor(directiveId: string): Promise<number> {
  const prev = await prisma.consentDirective.findUnique({
    where: { id: directiveId },
    select: { version: true },
  });
  return (prev?.version ?? 0) + 1;
}

export async function withdrawConsentDirective(
  directiveId: string,
  withdrawnById: string,
  reason?: string
): Promise<WriteConsentDirectiveResult> {
  const previous = await prisma.consentDirective.findUnique({
    where: { id: directiveId },
  });
  if (!previous) throw new Error("directive_not_found");
  if (previous.status === "withdrawn") {
    throw new Error("directive_already_withdrawn");
  }

  return writeConsentDirective({
    subjectId: previous.subjectId,
    authorId: withdrawnById,
    recipientCategory: previous.recipientCategory,
    recipientOrganisationId: previous.recipientOrganisationId,
    recipientEntityId: previous.recipientEntityId,
    purpose: previous.purpose,
    purposeDetail: previous.purposeDetail,
    scopeKeys: previous.scopeKeys ?? [],
    frequency: previous.frequency,
    decision: "withdrawn",
    supersedesId: directiveId,
    proofBundle: reason ? { withdrawalReason: reason } : undefined,
  });
}

export async function listActiveDirectivesForSubject(subjectId: string) {
  const now = new Date();
  return prisma.consentDirective.findMany({
    where: {
      subjectId,
      status: "active",
      decision: "active",
      OR: [{ effectiveUntil: null }, { effectiveUntil: { gt: now } }],
    },
    orderBy: { effectiveFrom: "desc" },
  });
}

export async function findLatestDirectiveVersion(
  subjectId: string,
  recipientCategory: ConsentRecipientCategory,
  purpose: ConsentPurpose,
  recipient?: { organisationId?: string | null; entityId?: string | null }
) {
  return prisma.consentDirective.findFirst({
    where: {
      subjectId,
      recipientCategory,
      purpose,
      recipientOrganisationId: recipient?.organisationId ?? undefined,
      recipientEntityId: recipient?.entityId ?? undefined,
    },
    orderBy: [{ createdAt: "desc" }, { version: "desc" }],
  });
}
