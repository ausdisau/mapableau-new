import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export const DUTY_RECEIPT_DISCLAIMER =
  "A recipient attestation records what the recipient stated. It is not independent proof of compliance.";

export async function createRecipientObligation(params: {
  capsuleId?: string;
  organisationId?: string;
  purposeCode: string;
  duties: Array<{ code: string; description: string }>;
  prohibitions?: Array<{ code: string; description: string }>;
  dueAt?: Date;
}) {
  return prisma.recipientObligation.create({
    data: {
      capsuleId: params.capsuleId,
      organisationId: params.organisationId,
      purposeCode: params.purposeCode,
      dutiesJson: params.duties,
      prohibitionsJson: params.prohibitions ?? [],
      dueAt: params.dueAt,
      status: "pending",
    },
  });
}

export async function recordDutyReceipt(params: {
  obligationId: string;
  dutyCode: string;
  receiptType:
    | "system_verified"
    | "recipient_attestation"
    | "participant_report"
    | "external_verification"
    | "unverifiable";
  attestationNote?: string;
  actorUserId?: string;
}) {
  const receipt = await prisma.recipientDutyReceipt.create({
    data: {
      obligationId: params.obligationId,
      dutyCode: params.dutyCode,
      receiptType: params.receiptType,
      attestationNote: params.attestationNote,
      actorUserId: params.actorUserId,
    },
  });

  const obligation = await prisma.recipientObligation.findUnique({
    where: { id: params.obligationId },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "rights.duty_recorded",
    entityType: "RecipientDutyReceipt",
    entityId: receipt.id,
    organisationId: obligation?.organisationId ?? undefined,
    metadata: {
      dutyCode: params.dutyCode,
      receiptType: params.receiptType,
      disclaimer: DUTY_RECEIPT_DISCLAIMER,
    },
  });

  return { receipt, disclaimer: DUTY_RECEIPT_DISCLAIMER };
}

export async function listOverdueObligations(organisationId?: string) {
  return prisma.recipientObligation.findMany({
    where: {
      status: "pending",
      dueAt: { lt: new Date() },
      ...(organisationId ? { organisationId } : {}),
    },
    include: { receipts: true },
  });
}
