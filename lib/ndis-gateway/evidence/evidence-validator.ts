import type { NdisConfirmationMethod, NdisEvidenceStatus } from "@prisma/client";

export type EvidenceValidationIssue = {
  code: string;
  message: string;
  severity: "error" | "warning";
};

export type EvidenceDraftInput = {
  status?: NdisEvidenceStatus;
  participantConfirmationMethod?: NdisConfirmationMethod | null;
  participantConfirmedAt?: Date | string | null;
  exceptionCode?: string | null;
  exceptionReason?: string | null;
  referenceCount?: number;
};

/**
 * Validate evidence package state.
 * Provider exception requires reason and NEVER counts as participant approval.
 */
export function validateEvidencePackage(
  input: EvidenceDraftInput
): { valid: boolean; issues: EvidenceValidationIssue[] } {
  const issues: EvidenceValidationIssue[] = [];
  const method = input.participantConfirmationMethod;

  if (method === "provider_exception") {
    if (!input.exceptionReason?.trim()) {
      issues.push({
        code: "provider_exception_reason_required",
        message: "Provider exception requires a documented reason.",
        severity: "error",
      });
    }
    if (input.participantConfirmedAt) {
      issues.push({
        code: "provider_exception_cannot_impersonate_approval",
        message:
          "Provider exception must not set participantConfirmedAt (does not impersonate participant approval).",
        severity: "error",
      });
    }
  }

  if (
    method === "inaccessible_confirmation_exception" &&
    !input.exceptionReason?.trim()
  ) {
    issues.push({
      code: "exception_reason_required",
      message: "Inaccessible confirmation exception requires a reason.",
      severity: "error",
    });
  }

  if (
    input.status === "participant_confirmed" &&
    method === "provider_exception"
  ) {
    issues.push({
      code: "provider_exception_not_participant_confirmed",
      message:
        "Status participant_confirmed cannot be used with provider_exception.",
      severity: "error",
    });
  }

  if (
    input.status === "ready_for_confirmation" &&
    (input.referenceCount ?? 0) < 1
  ) {
    issues.push({
      code: "evidence_references_missing",
      message: "At least one evidence reference is required.",
      severity: "warning",
    });
  }

  return { valid: issues.every((i) => i.severity !== "error"), issues };
}

/** Hash material must exclude PII (names, NDIS numbers, addresses). */
export function buildEvidenceHashMaterial(input: {
  organisationId: string;
  participantId: string;
  billableItemId: string;
  serviceStartAtIso: string;
  serviceEndAtIso: string;
  supportItemCode: string | null;
  quantity: string;
  referenceIds: string[];
  confirmationMethod: NdisConfirmationMethod | null;
  exceptionCode: string | null;
}): Record<string, unknown> {
  return {
    organisationId: input.organisationId,
    participantId: input.participantId,
    billableItemId: input.billableItemId,
    serviceStartAt: input.serviceStartAtIso,
    serviceEndAt: input.serviceEndAtIso,
    supportItemCode: input.supportItemCode,
    quantity: input.quantity,
    referenceIds: [...input.referenceIds].sort(),
    confirmationMethod: input.confirmationMethod,
    exceptionCode: input.exceptionCode,
  };
}
