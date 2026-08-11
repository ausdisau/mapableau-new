import { z } from "zod";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export const purposeConsentGrantSchema = z.object({
  participantId: z.string().min(1),
  tenantId: z.string().min(1).optional().nullable(),
  purpose: z.string().min(1),
  scope: z.string().min(1),
  permittedFields: z.array(z.string().min(1)).default([]),
  permittedActions: z.array(z.string().min(1)).default([]),
  issuingActorUserId: z.string().min(1),
  supporterInvolved: z.boolean().default(false),
  accessibleFormat: z.string().min(1).default("standard"),
  policyVersion: z.string().min(1),
  consentTextVersion: z.string().min(1),
  expiresAt: z.date(),
  consentRecordId: z.string().optional(),
});

export type PurposeConsentGrantInput = z.infer<typeof purposeConsentGrantSchema>;

export type PurposeConsentVerification = {
  ok: boolean;
  reason?:
    | "missing"
    | "wrong_participant"
    | "wrong_tenant"
    | "purpose_mismatch"
    | "field_not_permitted"
    | "action_not_permitted"
    | "expired"
    | "withdrawn"
    | "superseded";
  receiptId?: string;
};

/**
 * Issue a purpose-specific consent receipt. Additive fields are stored on ConsentReceipt.
 */
export async function issuePurposeConsentReceipt(
  raw: PurposeConsentGrantInput,
) {
  const input = purposeConsentGrantSchema.parse(raw);
  if (input.expiresAt <= new Date()) {
    throw new Error("CONSENT_EXPIRY_REQUIRED");
  }

  const receipt = await prisma.consentReceipt.create({
    data: {
      consentRecordId: input.consentRecordId,
      participantId: input.participantId,
      actorUserId: input.issuingActorUserId,
      scope: input.scope,
      purpose: input.purpose,
      action: "granted",
      tenantId: input.tenantId ?? null,
      permittedFields: input.permittedFields,
      permittedActions: input.permittedActions,
      supporterInvolved: input.supporterInvolved,
      accessibleFormat: input.accessibleFormat,
      policyVersion: input.policyVersion,
      consentTextVersion: input.consentTextVersion,
      issuedAt: new Date(),
      expiresAt: input.expiresAt,
    },
  });

  await createAuditEvent({
    actorUserId: input.issuingActorUserId,
    participantId: input.participantId,
    action: "consent.purpose.granted",
    entityType: "ConsentReceipt",
    entityId: receipt.id,
    metadata: {
      purpose: input.purpose,
      scope: input.scope,
      tenantId: input.tenantId,
      expiresAt: input.expiresAt.toISOString(),
    },
  });

  return receipt;
}

export async function withdrawPurposeConsentReceipt(input: {
  receiptId: string;
  participantId: string;
  actorUserId: string;
}) {
  if (input.participantId !== input.actorUserId) {
    throw new Error("PARTICIPANT_AUTHORITY_REQUIRED");
  }
  const existing = await prisma.consentReceipt.findFirst({
    where: { id: input.receiptId, participantId: input.participantId },
  });
  if (!existing) throw new Error("CONSENT_RECEIPT_NOT_FOUND");
  if (existing.withdrawnAt) return existing;

  const updated = await prisma.consentReceipt.update({
    where: { id: input.receiptId },
    data: { withdrawnAt: new Date(), action: "revoked" },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    participantId: input.participantId,
    action: "consent.purpose.withdrawn",
    entityType: "ConsentReceipt",
    entityId: updated.id,
  });
  return updated;
}

export async function verifyPurposeConsent(input: {
  participantId: string;
  tenantId?: string | null;
  purpose: string;
  fields?: string[];
  action: string;
  now?: Date;
}): Promise<PurposeConsentVerification> {
  const now = input.now ?? new Date();
  const receipt = await prisma.consentReceipt.findFirst({
    where: {
      participantId: input.participantId,
      purpose: input.purpose,
      action: "granted",
      withdrawnAt: null,
      supersededById: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!receipt) return { ok: false, reason: "missing" };
  if (receipt.participantId !== input.participantId) {
    return { ok: false, reason: "wrong_participant" };
  }
  if (
    input.tenantId &&
    receipt.tenantId &&
    receipt.tenantId !== input.tenantId
  ) {
    return { ok: false, reason: "wrong_tenant", receiptId: receipt.id };
  }
  if (receipt.purpose !== input.purpose) {
    return { ok: false, reason: "purpose_mismatch", receiptId: receipt.id };
  }
  if (receipt.withdrawnAt) {
    return { ok: false, reason: "withdrawn", receiptId: receipt.id };
  }
  if (receipt.supersededById) {
    return { ok: false, reason: "superseded", receiptId: receipt.id };
  }
  if (receipt.expiresAt && receipt.expiresAt <= now) {
    return { ok: false, reason: "expired", receiptId: receipt.id };
  }
  const permittedActions = receipt.permittedActions ?? [];
  if (
    permittedActions.length > 0 &&
    !permittedActions.includes(input.action)
  ) {
    return { ok: false, reason: "action_not_permitted", receiptId: receipt.id };
  }
  const permittedFields = receipt.permittedFields ?? [];
  if (permittedFields.length > 0 && input.fields?.length) {
    const allowed = new Set(permittedFields);
    if (input.fields.some((field) => !allowed.has(field))) {
      return { ok: false, reason: "field_not_permitted", receiptId: receipt.id };
    }
  }

  return { ok: true, receiptId: receipt.id };
}
