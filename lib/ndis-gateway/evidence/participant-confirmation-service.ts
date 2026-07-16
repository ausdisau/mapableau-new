import { createHash } from "node:crypto";

import type { NdisConfirmationMethod, Prisma } from "@prisma/client";

import {
  buildEvidenceHashMaterial,
  validateEvidencePackage,
} from "@/lib/ndis-gateway/evidence/evidence-validator";
import { projectEvidencePackageSafe } from "@/lib/ndis-gateway/evidence/evidence-projection";
import { createCorrelationId } from "@/lib/ndis-gateway/infrastructure/correlation";
import { sanitiseAuditJson } from "@/lib/ndis-gateway/security/log-sanitiser";
import { prisma } from "@/lib/prisma";

const PARTICIPANT_METHODS: readonly NdisConfirmationMethod[] = [
  "participant_portal",
  "participant_signature",
  "nominee_portal",
  "guardian_confirmation",
  "support_log_signature",
  "verbal_confirmation_documented",
  "aac_assisted",
  "switch_accessible",
];

export async function confirmEvidenceByParticipant(input: {
  evidencePackageId: string;
  organisationId: string;
  confirmedById: string;
  method: NdisConfirmationMethod;
}) {
  if (input.method === "provider_exception") {
    throw new Error("PROVIDER_EXCEPTION_NOT_PARTICIPANT_CONFIRMATION");
  }
  if (!PARTICIPANT_METHODS.includes(input.method) && input.method !== "not_required") {
    throw new Error("INVALID_CONFIRMATION_METHOD");
  }

  const existing = await prisma.ndisServiceEvidencePackage.findFirst({
    where: {
      id: input.evidencePackageId,
      organisationId: input.organisationId,
    },
    include: { references: true },
  });
  if (!existing) throw new Error("EVIDENCE_PACKAGE_NOT_FOUND");

  const confirmedAt = new Date();
  const validation = validateEvidencePackage({
    status: "participant_confirmed",
    participantConfirmationMethod: input.method,
    participantConfirmedAt: confirmedAt,
    exceptionCode: existing.exceptionCode,
    exceptionReason: existing.exceptionReason,
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
    confirmationMethod: input.method,
    exceptionCode: existing.exceptionCode,
  });
  const evidenceHash = createHash("sha256")
    .update(JSON.stringify(material), "utf8")
    .digest("hex");

  const updated = await prisma.ndisServiceEvidencePackage.update({
    where: { id: existing.id },
    data: {
      status:
        input.method === "nominee_portal" ||
        input.method === "guardian_confirmation"
          ? "delegate_confirmed"
          : "participant_confirmed",
      participantConfirmationMethod: input.method,
      participantConfirmedAt: confirmedAt,
      participantConfirmedById: input.confirmedById,
      evidenceHash,
    },
  });

  await prisma.ndisWorkflowTransition.create({
    data: {
      organisationId: input.organisationId,
      entityType: "ndis_service_evidence_package",
      entityId: existing.id,
      fromStatus: existing.status,
      toStatus: updated.status,
      actorUserId: input.confirmedById,
      correlationId: createCorrelationId(),
      metadataJson: sanitiseAuditJson({
        method: input.method,
      }) as Prisma.InputJsonValue,
    },
  });

  return projectEvidencePackageSafe(updated);
}
