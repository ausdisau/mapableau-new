import { createHash } from "node:crypto";

import type {
  NdisConfirmationMethod,
  NdisEvidenceStatus,
  Prisma,
} from "@prisma/client";

import {
  buildEvidenceHashMaterial,
  validateEvidencePackage,
} from "@/lib/ndis-gateway/evidence/evidence-validator";
import { projectEvidencePackageSafe } from "@/lib/ndis-gateway/evidence/evidence-projection";
import { createCorrelationId } from "@/lib/ndis-gateway/infrastructure/correlation";
import { sanitiseAuditJson } from "@/lib/ndis-gateway/security/log-sanitiser";
import { prisma } from "@/lib/prisma";

function hashEvidence(material: Record<string, unknown>): string {
  const canonical = JSON.stringify(material);
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

export type CreateDraftEvidencePackageInput = {
  organisationId: string;
  participantId: string;
  billableItemId: string;
  serviceStartAt: Date;
  serviceEndAt: Date;
  supportItemCode?: string | null;
  quantity: string | number;
  bookingId?: string | null;
  shiftId?: string | null;
  timesheetId?: string | null;
  deliveryEventId?: string | null;
  workerIds?: string[];
  references?: Array<{
    referenceType: string;
    referenceId: string;
    safeLabel: string;
  }>;
};

export async function createDraftEvidencePackage(
  input: CreateDraftEvidencePackageInput
) {
  const refs = input.references ?? [];
  const material = buildEvidenceHashMaterial({
    organisationId: input.organisationId,
    participantId: input.participantId,
    billableItemId: input.billableItemId,
    serviceStartAtIso: input.serviceStartAt.toISOString(),
    serviceEndAtIso: input.serviceEndAt.toISOString(),
    supportItemCode: input.supportItemCode ?? null,
    quantity: String(input.quantity),
    referenceIds: refs.map((r) => r.referenceId),
    confirmationMethod: null,
    exceptionCode: null,
  });

  const pkg = await prisma.ndisServiceEvidencePackage.create({
    data: {
      organisationId: input.organisationId,
      participantId: input.participantId,
      billableItemId: input.billableItemId,
      bookingId: input.bookingId ?? null,
      shiftId: input.shiftId ?? null,
      timesheetId: input.timesheetId ?? null,
      deliveryEventId: input.deliveryEventId ?? null,
      status: "incomplete",
      serviceStartAt: input.serviceStartAt,
      serviceEndAt: input.serviceEndAt,
      supportItemCode: input.supportItemCode ?? null,
      quantity: input.quantity,
      workerIds: input.workerIds ?? [],
      evidenceHash: hashEvidence(material),
      schemaVersion: "1",
      references: {
        create: refs.map((r) => ({
          referenceType: r.referenceType,
          referenceId: r.referenceId,
          safeLabel: r.safeLabel,
        })),
      },
    },
    include: { references: true },
  });

  return projectEvidencePackageSafe(pkg);
}

export async function recordProviderException(input: {
  evidencePackageId: string;
  organisationId: string;
  actorUserId: string;
  exceptionCode: string;
  exceptionReason: string;
}) {
  if (!input.exceptionReason.trim()) {
    throw new Error("PROVIDER_EXCEPTION_REASON_REQUIRED");
  }

  const existing = await prisma.ndisServiceEvidencePackage.findFirst({
    where: {
      id: input.evidencePackageId,
      organisationId: input.organisationId,
    },
    include: { references: true },
  });
  if (!existing) throw new Error("EVIDENCE_PACKAGE_NOT_FOUND");

  const method: NdisConfirmationMethod = "provider_exception";
  const validation = validateEvidencePackage({
    status: "exception_recorded",
    participantConfirmationMethod: method,
    participantConfirmedAt: null,
    exceptionCode: input.exceptionCode,
    exceptionReason: input.exceptionReason,
    referenceCount: existing.references.length,
  });
  if (!validation.valid) {
    throw new Error(validation.issues[0]?.code ?? "EVIDENCE_INVALID");
  }

  const material = buildEvidenceHashMaterial({
    organisationId: existing.organisationId,
    participantId: existing.participantId,
    billableItemId: existing.billableItemId,
    serviceStartAtIso: existing.serviceStartAt.toISOString(),
    serviceEndAtIso: existing.serviceEndAt.toISOString(),
    supportItemCode: existing.supportItemCode,
    quantity: existing.quantity.toString(),
    referenceIds: existing.references.map((r) => r.referenceId),
    confirmationMethod: method,
    exceptionCode: input.exceptionCode,
  });

  const updated = await prisma.ndisServiceEvidencePackage.update({
    where: { id: existing.id },
    data: {
      status: "exception_recorded" satisfies NdisEvidenceStatus,
      participantConfirmationMethod: method,
      // Never impersonate participant approval
      participantConfirmedAt: null,
      participantConfirmedById: null,
      exceptionCode: input.exceptionCode,
      exceptionReason: input.exceptionReason,
      exceptionRecordedById: input.actorUserId,
      evidenceHash: hashEvidence(material),
    },
  });

  await prisma.ndisWorkflowTransition.create({
    data: {
      organisationId: input.organisationId,
      entityType: "ndis_service_evidence_package",
      entityId: existing.id,
      fromStatus: existing.status,
      toStatus: "exception_recorded",
      actorUserId: input.actorUserId,
      reason: input.exceptionReason,
      correlationId: createCorrelationId(),
      metadataJson: sanitiseAuditJson({
        exceptionCode: input.exceptionCode,
        providerExceptionOnly: true,
      }) as Prisma.InputJsonValue,
    },
  });

  return projectEvidencePackageSafe(updated);
}
