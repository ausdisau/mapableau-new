import type { FundingSourceType } from "@prisma/client";

import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import {
  buildClaimFromBillingInvoice,
  buildClaimFromLegacyInvoice,
} from "@/lib/ndia-provider-claiming/build-claim";
import {
  isNdiaProviderClaimingEnabled,
  isNdiaProviderLiveSubmitAllowed,
  ndiaProviderClaimingConfig,
} from "@/lib/ndia-provider-claiming/config";
import { submitProviderClaimToNdia } from "@/lib/ndia-provider-claiming/ndia-api-client";
import type { NdiaProviderClaimPayload } from "@/lib/ndia-provider-claiming/types";
import {
  hasBlockingFindings,
  mapBillingFundingType,
  validateClaimPayload,
  validateFundingForProviderClaim,
} from "@/lib/ndia-provider-claiming/validate";
import { createCorrelationId } from "@/lib/ndis-gateway/infrastructure/correlation";
import { getSubmissionApproval } from "@/lib/ndis-gateway/security/claim-approval-service";
import {
  createClaimSnapshot,
  fundingRouteFromLegacyType,
  loadExternalPayloadForSubmission,
} from "@/lib/ndis-gateway/security/claim-snapshot-service";
import { sanitiseAuditJson } from "@/lib/ndis-gateway/security/log-sanitiser";
import {
  payloadContainsRawNdisNumber,
  toMaskedClaimPayload,
} from "@/lib/ndis-gateway/security/sensitive-payload";
import { prisma } from "@/lib/prisma";

async function assertOrgAccess(user: CurrentUser, organisationId: string) {
  if (isAdminRole(user.primaryRole)) return;
  const orgIds = await getUserOrganisationIds(user.id);
  if (!orgIds.includes(organisationId)) {
    throw new Error("FORBIDDEN");
  }
}

async function writeClaimAudit(
  claimId: string,
  action: string,
  actorId: string,
  after?: unknown
) {
  await prisma.ndiaProviderClaimAudit.create({
    data: {
      claimId,
      action,
      actorId,
      after: after
        ? (sanitiseAuditJson(after as Record<string, unknown>) as object)
        : undefined,
    },
  });
}

function resolveFundingType(
  builtFundingType: string | undefined
): FundingSourceType | undefined {
  if (
    builtFundingType === "ndis_plan_managed" ||
    builtFundingType === "ndis_self_managed" ||
    builtFundingType === "ndis_agency_managed" ||
    builtFundingType === "private_pay"
  ) {
    return builtFundingType;
  }
  if (builtFundingType) {
    return mapBillingFundingType(
      builtFundingType as import("@prisma/client").BillingFundingSourceType
    );
  }
  return undefined;
}

function toPublicClaim(claim: {
  id: string;
  organisationId: string;
  legacyInvoiceId: string | null;
  billingInvoiceId: string | null;
  participantId: string;
  createdById: string;
  ndisRegistrationNumber: string;
  status: string;
  claimPayloadJson: unknown;
  validationFindingsJson: unknown;
  currentSnapshotId: string | null;
  payloadHash: string | null;
  externalClaimId: string | null;
  externalStatus: string | null;
  submittedAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  const payload = claim.claimPayloadJson as NdiaProviderClaimPayload;
  const masked = payloadContainsRawNdisNumber(payload)
    ? toMaskedClaimPayload({
        ...payload,
        participant: {
          ...payload.participant,
          ndisNumber: null,
        },
      })
    : toMaskedClaimPayload(payload);

  return {
    ...claim,
    claimPayloadJson: masked,
  };
}

/**
 * @deprecated Prefer snapshot-aware loaders. claimPayloadJson is masked-only (Wave 2).
 */
export async function createProviderClaimDraft(params: {
  user: CurrentUser;
  organisationId: string;
  legacyInvoiceId?: string;
  billingInvoiceId?: string;
}) {
  if (!isNdiaProviderClaimingEnabled()) {
    throw new Error("NDIA_PROVIDER_CLAIMING_DISABLED");
  }

  await assertOrgAccess(params.user, params.organisationId);

  const built = params.legacyInvoiceId
    ? await buildClaimFromLegacyInvoice(
        params.legacyInvoiceId,
        params.organisationId
      )
    : params.billingInvoiceId
      ? await buildClaimFromBillingInvoice(
          params.billingInvoiceId,
          params.organisationId
        )
      : null;

  if (!built?.ok) {
    return { ok: false as const, error: built?.error ?? "Invalid input" };
  }

  const fundingType = resolveFundingType(built.fundingType);
  const fundingRoute = fundingRouteFromLegacyType(fundingType);
  const fundingFindings = validateFundingForProviderClaim(fundingType);
  const payloadFindings = await validateClaimPayload(
    built.payload,
    params.organisationId
  );
  const findings = [...fundingFindings, ...payloadFindings];
  const maskedPayload = toMaskedClaimPayload(built.payload);

  const claim = await prisma.ndiaProviderClaim.create({
    data: {
      organisationId: params.organisationId,
      legacyInvoiceId: params.legacyInvoiceId,
      billingInvoiceId: params.billingInvoiceId,
      participantId: built.participantId,
      createdById: params.user.id,
      ndisRegistrationNumber: built.payload.provider.ndisRegistrationNumber,
      status: hasBlockingFindings(findings) ? "draft" : "validated",
      claimPayloadJson: maskedPayload as object,
      validationFindingsJson: findings as object[],
    },
  });

  let snapshotId: string | null = null;
  let payloadHash: string | null = null;
  try {
    const snap = await createClaimSnapshot({
      user: params.user,
      organisationId: params.organisationId,
      participantId: built.participantId,
      sourceType: "ndia_provider_claim",
      sourceId: claim.id,
      fundingRoute,
      externalPayload: built.payload,
      forDirectSubmission: fundingRoute === "ndia_managed",
    });
    snapshotId = snap.snapshot.id;
    payloadHash = snap.payloadHash;
    await prisma.ndiaProviderClaim.update({
      where: { id: claim.id },
      data: {
        currentSnapshotId: snap.snapshot.id,
        payloadHash: snap.payloadHash,
      },
    });
  } catch {
    // Snapshot creation may fail for blocked funding — claim remains draft with masked JSON.
    await writeClaimAudit(claim.id, "snapshot_skipped", params.user.id, {
      fundingRoute,
    });
  }

  const refreshed = await prisma.ndiaProviderClaim.findUniqueOrThrow({
    where: { id: claim.id },
  });

  await writeClaimAudit(claim.id, "draft_created", params.user.id, {
    status: refreshed.status,
    findingCount: findings.length,
    snapshotId,
    payloadHash,
  });

  await createAuditEvent({
    actorUserId: params.user.id,
    action: "ndia.provider_claim.draft",
    entityType: "NdiaProviderClaim",
    entityId: claim.id,
    participantId: built.participantId,
    organisationId: params.organisationId,
    metadata: sanitiseAuditJson({
      snapshotId,
      payloadHash,
      fundingRoute,
    }),
  });

  return {
    ok: true as const,
    claim: toPublicClaim(refreshed),
    payload: maskedPayload,
    findings,
    snapshotId,
    payloadHash,
    liveSubmitAvailable: isNdiaProviderLiveSubmitAllowed(),
    adapterMode: ndiaProviderClaimingConfig.adapterMode,
  };
}

async function loadMaskedPayloadForValidation(claim: {
  claimPayloadJson: unknown;
  currentSnapshotId: string | null;
  organisationId: string;
}): Promise<NdiaProviderClaimPayload> {
  const stored = claim.claimPayloadJson as NdiaProviderClaimPayload;
  if (claim.currentSnapshotId) {
    // Validation uses masked ordinary fields; NDIS presence checked via org rules + snapshot.
    return {
      ...stored,
      participant: {
        ...stored.participant,
        ndisNumber: stored.participant.ndisNumberMasked ? "MASKED_PRESENT" : null,
        ndisNumberMasked: stored.participant.ndisNumberMasked,
      },
    };
  }
  return toMaskedClaimPayload(stored);
}

export async function validateProviderClaim(claimId: string, user: CurrentUser) {
  const claim = await prisma.ndiaProviderClaim.findUnique({
    where: { id: claimId },
  });
  if (!claim) throw new Error("NOT_FOUND");
  await assertOrgAccess(user, claim.organisationId);

  const payload = await loadMaskedPayloadForValidation(claim);
  const findings = await validateClaimPayload(payload, claim.organisationId);
  if (!claim.currentSnapshotId) {
    findings.push({
      code: "snapshot_required",
      severity: "error",
      message:
        "This claim has not been migrated to a privacy-safe snapshot. Create or backfill a snapshot before submission.",
    });
  }
  const status = hasBlockingFindings(findings) ? "draft" : "validated";

  const updated = await prisma.ndiaProviderClaim.update({
    where: { id: claimId },
    data: { validationFindingsJson: findings, status },
  });

  await writeClaimAudit(claimId, "validated", user.id, {
    status,
    findings,
    snapshotId: claim.currentSnapshotId,
  });

  return {
    claim: toPublicClaim(updated),
    findings,
    canSubmit: !hasBlockingFindings(findings),
  };
}

export async function dryRunProviderClaim(claimId: string, user: CurrentUser) {
  const { claim, findings, canSubmit } = await validateProviderClaim(
    claimId,
    user
  );
  if (!canSubmit) {
    return {
      claim,
      dryRun: { passed: false, findings, mode: "unapproved_mock" as const },
      message: "Fix validation errors before dry run.",
    };
  }

  const updated = await prisma.ndiaProviderClaim.update({
    where: { id: claimId },
    data: { status: "dry_run_passed" },
  });

  const approval = claim.currentSnapshotId
    ? await getSubmissionApproval(claim.currentSnapshotId)
    : null;

  await writeClaimAudit(claimId, "dry_run_passed", user.id, {
    mode: approval ? "approved_dry_run" : "unapproved_mock",
    snapshotId: claim.currentSnapshotId,
  });

  return {
    claim: toPublicClaim(updated),
    dryRun: {
      passed: true,
      findings,
      mode: approval ? ("approved_dry_run" as const) : ("unapproved_mock" as const),
    },
    notSubmitted: true,
    message:
      "Dry run passed. This is not a real NDIA submission. Live submit requires claim-specific approval, NDIA_REAL_SUBMISSION_ENABLED, and partner API credentials.",
  };
}

export async function submitProviderClaim(claimId: string, user: CurrentUser) {
  if (!isNdiaProviderClaimingEnabled()) {
    throw new Error("NDIA_PROVIDER_CLAIMING_DISABLED");
  }

  const claim = await prisma.ndiaProviderClaim.findUnique({
    where: { id: claimId },
  });
  if (!claim) throw new Error("NOT_FOUND");
  await assertOrgAccess(user, claim.organisationId);

  if (!claim.currentSnapshotId || !claim.payloadHash) {
    throw new Error("SNAPSHOT_REQUIRED");
  }

  // Claim-specific approval — never NdiaPilotApprovalRecord.
  const submissionApproval = await getSubmissionApproval(claim.currentSnapshotId);
  const live = isNdiaProviderLiveSubmitAllowed();

  if (ndiaProviderClaimingConfig.requireHumanApproval) {
    if (!submissionApproval) {
      throw new Error("GOVERNANCE_APPROVAL_REQUIRED");
    }
  }

  if (live && !submissionApproval) {
    throw new Error("GOVERNANCE_APPROVAL_REQUIRED");
  }

  const { canSubmit } = await validateProviderClaim(claimId, user);
  if (!canSubmit) {
    throw new Error("CLAIM_VALIDATION_FAILED");
  }

  // Just-in-time decrypt at submission boundary only.
  const externalPayload = await loadExternalPayloadForSubmission({
    snapshotId: claim.currentSnapshotId,
    organisationId: claim.organisationId,
  });

  const correlationId = createCorrelationId();
  const result = await submitProviderClaimToNdia(externalPayload);

  const submissionMode = live
    ? "live_simulation_or_http"
    : submissionApproval
      ? "approved_mock_simulation"
      : "unapproved_mock";

  const updated = await prisma.ndiaProviderClaim.update({
    where: { id: claimId },
    data: {
      status: "submitted",
      externalClaimId: result.externalClaimId,
      externalStatus: result.externalStatus,
      submittedAt: new Date(),
    },
  });

  if (claim.legacyInvoiceId) {
    await prisma.invoice.update({
      where: { id: claim.legacyInvoiceId },
      data: { status: "xero_sync_pending" },
    });
  }
  if (claim.billingInvoiceId) {
    await prisma.billingInvoice.update({
      where: { id: claim.billingInvoiceId },
      data: {
        status: "pending_payment",
        planManagerExportStatus: "ndia_submitted",
      },
    });
  }

  await writeClaimAudit(claimId, "submitted", user.id, {
    mode: submissionMode,
    externalClaimId: result.externalClaimId,
    externalStatus: result.externalStatus,
    correlationId,
    snapshotId: claim.currentSnapshotId,
    approvalId: submissionApproval?.approval.id ?? null,
    notRealNdiaSubmission: !live,
  });

  await createAuditEvent({
    actorUserId: user.id,
    action: "ndia.provider_claim.submitted",
    entityType: "NdiaProviderClaim",
    entityId: claimId,
    participantId: claim.participantId,
    organisationId: claim.organisationId,
    metadata: sanitiseAuditJson({
      mode: submissionMode,
      snapshotId: claim.currentSnapshotId,
      payloadHash: claim.payloadHash,
      approvalId: submissionApproval?.approval.id ?? null,
      correlationId,
      notRealNdiaSubmission: !live,
    }),
  });

  return {
    claim: toPublicClaim(updated),
    submitResult: {
      mode: result.mode,
      externalClaimId: result.externalClaimId,
      externalStatus: result.externalStatus,
      submissionMode,
      correlationId,
      approvalId: submissionApproval?.approval.id ?? null,
      snapshotId: claim.currentSnapshotId,
    },
    disclaimer: live
      ? "Submitted via configured NDIA partner adapter."
      : "Recorded as mock / simulation — not a real NDIA submission.",
  };
}

export async function listProviderClaims(
  user: CurrentUser,
  organisationId: string
) {
  await assertOrgAccess(user, organisationId);
  const claims = await prisma.ndiaProviderClaim.findMany({
    where: { organisationId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return claims.map((claim) => toPublicClaim(claim));
}
