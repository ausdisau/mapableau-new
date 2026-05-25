import type { WwcVerificationStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { resolveWwcAdapter } from "@/lib/verification/wwc/wwc-adapter-registry";
import { recordWwcVerificationEvent } from "@/lib/verification/wwc/wwc-event-service";
import { syncWorkerWwccStatus } from "@/lib/verification/wwc/wwc-eligibility-service";
import type { WwcAdminDecision } from "@/types/wwc-verification";
import type { WwcVerificationInput } from "@/types/wwc-verification";
import { WWC_CHECK_TYPES_BY_JURISDICTION } from "@/types/wwc-verification";

const DECISION_STATUS_MAP: Record<WwcAdminDecision, WwcVerificationStatus> = {
  approve: "approved",
  reject: "rejected",
  needs_more_information: "needs_more_information",
  not_required: "not_required",
  expired: "expired",
  suspended: "suspended",
  barred: "barred",
};

const EVENT_TYPE_MAP: Record<WwcAdminDecision, "approved" | "rejected" | "needs_more_information" | "not_required" | "expired" | "suspended" | "barred"> = {
  approve: "approved",
  reject: "rejected",
  needs_more_information: "needs_more_information",
  not_required: "not_required",
  expired: "expired",
  suspended: "suspended",
  barred: "barred",
};

export async function getWorkerProfileForUser(userId: string) {
  return prisma.workerProfile.findFirst({
    where: { userId, active: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function submitWwcVerification(params: {
  workerProfileId: string;
  organisationId: string;
  actorUserId: string;
  input: WwcVerificationInput;
}) {
  const allowedTypes = WWC_CHECK_TYPES_BY_JURISDICTION[params.input.jurisdiction];
  if (!allowedTypes?.includes(params.input.checkType)) {
    throw new Error("INVALID_CHECK_TYPE_FOR_JURISDICTION");
  }
  if (!params.input.consentConfirmed) {
    throw new Error("CONSENT_REQUIRED");
  }

  if (params.input.evidenceDocumentId) {
    const doc = await prisma.document.findFirst({
      where: {
        id: params.input.evidenceDocumentId,
        uploadedById: params.actorUserId,
        category: "worker_screening",
        deletedAt: null,
      },
    });
    if (!doc) throw new Error("EVIDENCE_NOT_FOUND");
  }

  const adapter = resolveWwcAdapter(
    params.input.jurisdiction,
    params.input.checkType,
    true
  );

  const adapterResult = await adapter.check({
    ...params.input,
    workerProfileId: params.workerProfileId,
    organisationId: params.organisationId,
  });

  const verification = await prisma.wwcVerification.create({
    data: {
      workerProfileId: params.workerProfileId,
      organisationId: params.organisationId,
      jurisdiction: params.input.jurisdiction,
      checkType: params.input.checkType,
      checkNumber: params.input.checkNumber.trim(),
      legalFirstName: params.input.legalFirstName.trim(),
      legalLastName: params.input.legalLastName.trim(),
      dateOfBirth: params.input.dateOfBirth
        ? new Date(params.input.dateOfBirth)
        : null,
      status: "pending_review",
      verifiedName: adapterResult.verifiedName,
      verifiedResult: adapterResult.verifiedResult,
      verifiedPayloadJson: (adapterResult.payload ?? undefined) as object | undefined,
      evidenceDocumentId: params.input.evidenceDocumentId ?? null,
      checkedAt: new Date(adapterResult.checkedAt),
      expiresAt: params.input.expiresAt ? new Date(params.input.expiresAt) : null,
      consentConfirmed: true,
    },
  });

  await recordWwcVerificationEvent({
    verificationId: verification.id,
    eventType: "submitted",
    actorUserId: params.actorUserId,
    organisationId: params.organisationId,
    workerProfileId: params.workerProfileId,
    payload: {
      adapter: adapter.getSourceName(),
      jurisdiction: params.input.jurisdiction,
      checkType: params.input.checkType,
    },
  });

  if (params.input.evidenceDocumentId) {
    await recordWwcVerificationEvent({
      verificationId: verification.id,
      eventType: "evidence_attached",
      actorUserId: params.actorUserId,
      organisationId: params.organisationId,
      workerProfileId: params.workerProfileId,
      payload: { documentId: params.input.evidenceDocumentId },
    });
  }

  await syncWorkerWwccStatus(params.workerProfileId);

  return { verification, adapterResult };
}

export async function applyWwcAdminDecision(params: {
  verificationId: string;
  adminUserId: string;
  decision: WwcAdminDecision;
  reviewNotes?: string;
  expiresAt?: string | null;
  nextCheckAt?: string | null;
  verifiedName?: string;
}) {
  const status = DECISION_STATUS_MAP[params.decision];
  const existing = await prisma.wwcVerification.findUnique({
    where: { id: params.verificationId },
  });
  if (!existing) throw new Error("NOT_FOUND");

  const updated = await prisma.wwcVerification.update({
    where: { id: params.verificationId },
    data: {
      status,
      reviewedById: params.adminUserId,
      reviewNotes: params.reviewNotes ?? existing.reviewNotes,
      expiresAt:
        params.expiresAt !== undefined
          ? params.expiresAt
            ? new Date(params.expiresAt)
            : null
          : existing.expiresAt,
      nextCheckAt:
        params.nextCheckAt !== undefined
          ? params.nextCheckAt
            ? new Date(params.nextCheckAt)
            : null
          : existing.nextCheckAt,
      verifiedName: params.verifiedName ?? existing.verifiedName,
    },
  });

  await recordWwcVerificationEvent({
    verificationId: updated.id,
    eventType: EVENT_TYPE_MAP[params.decision],
    actorUserId: params.adminUserId,
    organisationId: updated.organisationId,
    workerProfileId: updated.workerProfileId,
    payload: {
      decision: params.decision,
      reviewNotes: params.reviewNotes,
    },
  });

  if (params.reviewNotes) {
    await recordWwcVerificationEvent({
      verificationId: updated.id,
      eventType: "note_added",
      actorUserId: params.adminUserId,
      organisationId: updated.organisationId,
      workerProfileId: updated.workerProfileId,
      payload: { note: params.reviewNotes },
    });
  }

  await recordWwcVerificationEvent({
    verificationId: updated.id,
    eventType: "eligibility_recalculated",
    actorUserId: params.adminUserId,
    organisationId: updated.organisationId,
    workerProfileId: updated.workerProfileId,
  });

  await syncWorkerWwccStatus(updated.workerProfileId);

  return updated;
}

export function sanitizeWwcForPublic() {
  return {
    badgeOnly: true,
  };
}
