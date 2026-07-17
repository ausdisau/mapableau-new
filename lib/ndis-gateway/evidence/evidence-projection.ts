import type {
  NdisConfirmationMethod,
  NdisEvidenceStatus,
  NdisServiceEvidencePackage,
} from "@prisma/client";

/** Safe public/API view — never includes PII beyond IDs and status. */
export type SafeEvidencePackageView = {
  id: string;
  organisationId: string;
  participantId: string;
  billableItemId: string;
  status: NdisEvidenceStatus;
  serviceStartAt: string;
  serviceEndAt: string;
  supportItemCode: string | null;
  quantity: string;
  confirmationMethod: NdisConfirmationMethod | null;
  participantConfirmedAt: string | null;
  hasException: boolean;
  exceptionCode: string | null;
  /** True when exception is provider-side; never treated as participant approval. */
  providerExceptionOnly: boolean;
  evidenceHash: string;
  lockedAt: string | null;
  createdAt: string;
};

export function projectEvidencePackageSafe(
  pkg: NdisServiceEvidencePackage
): SafeEvidencePackageView {
  const providerExceptionOnly =
    pkg.participantConfirmationMethod === "provider_exception" ||
    Boolean(pkg.exceptionCode);

  return {
    id: pkg.id,
    organisationId: pkg.organisationId,
    participantId: pkg.participantId,
    billableItemId: pkg.billableItemId,
    status: pkg.status,
    serviceStartAt: pkg.serviceStartAt.toISOString(),
    serviceEndAt: pkg.serviceEndAt.toISOString(),
    supportItemCode: pkg.supportItemCode,
    quantity: pkg.quantity.toString(),
    confirmationMethod: pkg.participantConfirmationMethod,
    participantConfirmedAt: pkg.participantConfirmedAt?.toISOString() ?? null,
    hasException: Boolean(pkg.exceptionCode || pkg.exceptionReason),
    exceptionCode: pkg.exceptionCode,
    providerExceptionOnly,
    evidenceHash: pkg.evidenceHash,
    lockedAt: pkg.lockedAt?.toISOString() ?? null,
    createdAt: pkg.createdAt.toISOString(),
  };
}
