import { z } from "zod";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export const navigatorEscalationReasonSchema = z.enum([
  "identity_authority_or_consent_unclear",
  "immediate_danger",
  "safeguarding_clinical_restrictive_eligibility_or_funding_judgment",
  "sources_conflict",
  "hard_constraints_no_safe_match",
  "participant_requested_person",
  "model_or_tool_confidence_below_threshold",
  "unsupported_or_uncertain_request",
]);

export const createNavigatorEscalationSchema = z.object({
  tenantId: z.string().min(1),
  participantId: z.string().min(1),
  actorUserId: z.string().min(1),
  reason: navigatorEscalationReasonSchema,
  urgency: z.enum(["low", "medium", "high", "immediate"]),
  preferredContactMethod: z.string().min(1),
  confidentialityRestrictions: z.array(z.string()).default([]),
  requiredReviewerRole: z.string().min(1).default("coordinator"),
  summary: z.string().min(1).max(4000),
  conflictOfInterestCheckPassed: z.boolean(),
  responseDeadlineAt: z.string().datetime(),
  /** Never include allegation subject identifiers for safeguarding cases. */
  evidenceRefs: z.array(z.string()).default([]),
  passportId: z.string().optional(),
  envelopeId: z.string().optional(),
});

export type CreateNavigatorEscalationInput = z.infer<
  typeof createNavigatorEscalationSchema
>;

function assertTenantParticipantScope(input: {
  tenantId: string;
  participantId: string;
  actorTenantId?: string | null;
  actorParticipantId?: string | null;
  isReviewer?: boolean;
}) {
  if (input.actorTenantId && input.actorTenantId !== input.tenantId) {
    throw new Error("CROSS_TENANT_DENIED");
  }
  if (
    !input.isReviewer &&
    input.actorParticipantId &&
    input.actorParticipantId !== input.participantId
  ) {
    throw new Error("CROSS_PARTICIPANT_DENIED");
  }
}

export async function createNavigatorEscalation(
  raw: CreateNavigatorEscalationInput,
) {
  const input = createNavigatorEscalationSchema.parse(raw);
  if (!input.conflictOfInterestCheckPassed) {
    throw new Error("CONFLICT_OF_INTEREST_BLOCKED");
  }
  if (input.reason === "immediate_danger") {
    // Do not auto-contact emergency services; surface participant guidance only.
  }

  const row = await prisma.navigatorEscalationCase.create({
    data: {
      tenantId: input.tenantId,
      participantId: input.participantId,
      reason: input.reason,
      urgency: input.urgency,
      preferredContactMethod: input.preferredContactMethod,
      confidentialityRestrictions: input.confidentialityRestrictions,
      requiredReviewerRole: input.requiredReviewerRole,
      summary: input.summary,
      conflictCheckJson: { passed: true, at: new Date().toISOString() },
      assignmentHistoryJson: [
        {
          at: new Date().toISOString(),
          action: "created",
          byUserId: input.actorUserId,
          role: input.requiredReviewerRole,
        },
      ],
      responseDeadlineAt: new Date(input.responseDeadlineAt),
      participantVisibleStatus: "awaiting_human_review",
      status: "open",
      evidenceRefs: input.evidenceRefs,
      passportId: input.passportId,
      envelopeId: input.envelopeId,
      createdByUserId: input.actorUserId,
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    participantId: input.participantId,
    action: "navigator.escalation.created",
    entityType: "NavigatorEscalationCase",
    entityId: row.id,
    metadata: {
      tenantId: input.tenantId,
      reason: input.reason,
      urgency: input.urgency,
    },
  });

  return row;
}

export async function listNavigatorEscalationsForTenant(input: {
  tenantId: string;
  actorUserId: string;
  actorTenantId: string;
  take?: number;
}) {
  if (input.actorTenantId !== input.tenantId) {
    throw new Error("CROSS_TENANT_DENIED");
  }

  return prisma.navigatorEscalationCase.findMany({
    where: { tenantId: input.tenantId },
    orderBy: { createdAt: "desc" },
    take: Math.min(input.take ?? 50, 100),
  });
}

export async function getNavigatorEscalation(input: {
  id: string;
  tenantId: string;
  actorUserId: string;
  actorTenantId: string;
  actorParticipantId?: string | null;
  isReviewer?: boolean;
}) {
  const row = await prisma.navigatorEscalationCase.findFirst({
    where: { id: input.id, tenantId: input.tenantId },
  });
  if (!row) throw new Error("ESCALATION_NOT_FOUND");

  if (input.isReviewer) {
    if (input.actorTenantId !== row.tenantId) {
      throw new Error("CROSS_TENANT_DENIED");
    }
  } else {
    if (
      !input.actorParticipantId ||
      input.actorParticipantId !== row.participantId
    ) {
      throw new Error("CROSS_PARTICIPANT_DENIED");
    }
  }

  // Safeguarding: never expose allegation packages to alleged perpetrators.
  // This list API returns participant-visible summary only for non-reviewers.
  if (!input.isReviewer) {
    return {
      id: row.id,
      tenantId: row.tenantId,
      participantId: row.participantId,
      reason: row.reason,
      urgency: row.urgency,
      participantVisibleStatus: row.participantVisibleStatus,
      preferredContactMethod: row.preferredContactMethod,
      responseDeadlineAt: row.responseDeadlineAt,
      status: row.status,
      summary: row.summary,
      createdAt: row.createdAt,
    };
  }

  return row;
}
