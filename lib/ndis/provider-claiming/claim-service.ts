import type { FundingSourceType } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import type { CurrentUser } from "@/lib/auth/current-user";
import {
  assertConsentOrLawfulAuthority,
  assertNotCrossTenant,
  assertOrganisationAuthorised,
  NdiaClaimAuthorityError,
} from "@/lib/ndis/provider-claiming/authority";
import {
  buildClaimFromBillingInvoice,
  buildClaimFromLegacyInvoice,
} from "@/lib/ndis/provider-claiming/build-claim";
import {
  isNdiaProviderClaimingEnabled,
  isNdiaProviderLiveSubmitAllowed,
  ndiaProviderClaimingConfig,
} from "@/lib/ndis/provider-claiming/config";
import {
  buildClaimIdempotencyKey,
  isDuplicateIdempotencyKey,
} from "@/lib/ndis/provider-claiming/idempotency";
import {
  mapPrismaStatusToLifecycle,
  prismaStatusForSyntheticValidation,
} from "@/lib/ndis/provider-claiming/lifecycle";
import { submitProviderClaimToNdia } from "@/lib/ndis/provider-claiming/ndia-api-client";
import type { NdiaProviderClaimPayload } from "@/lib/ndis/provider-claiming/types";
import {
  hasBlockingFindings,
  mapBillingFundingType,
  validateClaimPayload,
  validateFundingForProviderClaim,
} from "@/lib/ndis/provider-claiming/validate";
import { prisma } from "@/lib/prisma";

async function writeClaimAudit(
  claimId: string,
  action: string,
  actorId: string,
  after?: unknown,
) {
  const safeAfter = after
    ? JSON.parse(
        JSON.stringify(after, (key, value) => {
          if (
            typeof key === "string" &&
            /secret|password|token|authorization/i.test(key)
          ) {
            return "[REDACTED]";
          }
          return value;
        }),
      )
    : undefined;

  await prisma.ndiaProviderClaimAudit.create({
    data: {
      claimId,
      action,
      actorId,
      after: safeAfter,
    },
  });
}

export async function createProviderClaimDraft(params: {
  user: CurrentUser;
  organisationId: string;
  legacyInvoiceId?: string;
  billingInvoiceId?: string;
  lawfulAuthorityAttested?: boolean;
}) {
  if (!isNdiaProviderClaimingEnabled()) {
    throw new Error("NDIA_PROVIDER_CLAIMING_DISABLED");
  }

  await assertOrganisationAuthorised(params.user, params.organisationId);

  const built = params.legacyInvoiceId
    ? await buildClaimFromLegacyInvoice(
        params.legacyInvoiceId,
        params.organisationId,
      )
    : params.billingInvoiceId
      ? await buildClaimFromBillingInvoice(
          params.billingInvoiceId,
          params.organisationId,
        )
      : null;

  if (!built?.ok) {
    return { ok: false as const, error: built?.error ?? "Invalid input" };
  }

  await assertConsentOrLawfulAuthority({
    participantUserId: built.participantId,
    actorUserId: params.user.id,
    organisationId: params.organisationId,
    lawfulAuthorityAttested: params.lawfulAuthorityAttested,
  });

  const fundingType =
    built.fundingType === "ndis_plan_managed" ||
    built.fundingType === "ndis_self_managed"
      ? (built.fundingType as FundingSourceType)
      : built.fundingType
        ? mapBillingFundingType(
            built.fundingType as import("@prisma/client").BillingFundingSourceType,
          )
        : undefined;

  const fundingFindings = validateFundingForProviderClaim(fundingType);
  const payloadFindings = await validateClaimPayload(
    built.payload,
    params.organisationId,
  );
  const findings = [...fundingFindings, ...payloadFindings];

  const claim = await prisma.ndiaProviderClaim.create({
    data: {
      organisationId: params.organisationId,
      legacyInvoiceId: params.legacyInvoiceId,
      billingInvoiceId: params.billingInvoiceId,
      participantId: built.participantId,
      createdById: params.user.id,
      ndisRegistrationNumber: built.payload.provider.ndisRegistrationNumber,
      status: hasBlockingFindings(findings) ? "draft" : "validated",
      claimPayloadJson: built.payload as object,
      validationFindingsJson: findings as object[],
    },
  });

  await writeClaimAudit(claim.id, "draft_created", params.user.id, {
    status: claim.status,
    lifecycle: mapPrismaStatusToLifecycle(claim.status),
    findingCount: findings.length,
  });

  await createAuditEvent({
    actorUserId: params.user.id,
    action: "ndia.provider_claim.draft",
    entityType: "NdiaProviderClaim",
    entityId: claim.id,
    participantId: built.participantId,
    metadata: {
      lifecycle: mapPrismaStatusToLifecycle(claim.status),
      liveSubmitAvailable: false,
    },
  });

  return {
    ok: true as const,
    claim,
    payload: built.payload,
    findings,
    lifecycle: mapPrismaStatusToLifecycle(claim.status),
    liveSubmitAvailable: false,
    adapterMode: ndiaProviderClaimingConfig.adapterMode,
  };
}

export async function validateProviderClaim(claimId: string, user: CurrentUser) {
  const claim = await prisma.ndiaProviderClaim.findUnique({
    where: { id: claimId },
  });
  if (!claim) throw new Error("NOT_FOUND");
  await assertOrganisationAuthorised(user, claim.organisationId);

  const payload = claim.claimPayloadJson as NdiaProviderClaimPayload;
  const findings = await validateClaimPayload(payload, claim.organisationId);
  const status = hasBlockingFindings(findings) ? "draft" : "validated";

  const updated = await prisma.ndiaProviderClaim.update({
    where: { id: claimId },
    data: { validationFindingsJson: findings, status },
  });

  await writeClaimAudit(claimId, "validated", user.id, {
    status,
    lifecycle: mapPrismaStatusToLifecycle(status),
    findings,
  });

  return {
    claim: updated,
    findings,
    canSubmit: !hasBlockingFindings(findings),
    lifecycle: mapPrismaStatusToLifecycle(status),
  };
}

export async function dryRunProviderClaim(claimId: string, user: CurrentUser) {
  const { claim, findings, canSubmit } = await validateProviderClaim(
    claimId,
    user,
  );
  if (!canSubmit) {
    return {
      claim,
      dryRun: { passed: false, findings },
      message: "Fix validation errors before dry run.",
      notSubmitted: true as const,
    };
  }

  const updated = await prisma.ndiaProviderClaim.update({
    where: { id: claimId },
    data: {
      status: "dry_run_passed",
      externalStatus: "government_submission_blocked",
    },
  });

  await writeClaimAudit(claimId, "dry_run_passed", user.id, {
    lifecycle: "government_submission_blocked",
  });

  return {
    claim: updated,
    dryRun: { passed: true, findings },
    notSubmitted: true as const,
    lifecycle: mapPrismaStatusToLifecycle(
      updated.status,
      updated.externalStatus,
    ),
    message:
      "Dry run passed. Live NDIA submit remains blocked until Digital Partnership Office technical pack and organisational approvals.",
  };
}

/**
 * Attempt claim progression.
 * Synthetic path: local validation only (never Prisma `submitted`).
 * Live path: hard-blocked (no network).
 */
export async function submitProviderClaim(
  claimId: string,
  user: CurrentUser,
  options?: { lawfulAuthorityAttested?: boolean },
) {
  if (!isNdiaProviderClaimingEnabled()) {
    throw new Error("NDIA_PROVIDER_CLAIMING_DISABLED");
  }

  const claim = await prisma.ndiaProviderClaim.findUnique({
    where: { id: claimId },
  });
  if (!claim) throw new Error("NOT_FOUND");
  await assertOrganisationAuthorised(user, claim.organisationId);

  await assertConsentOrLawfulAuthority({
    participantUserId: claim.participantId,
    actorUserId: user.id,
    organisationId: claim.organisationId,
    lawfulAuthorityAttested: options?.lawfulAuthorityAttested,
  });

  if (ndiaProviderClaimingConfig.requireHumanApproval) {
    const approval = await prisma.ndiaPilotApprovalRecord.findFirst({
      where: { approved: true },
      orderBy: { approvedAt: "desc" },
    });
    if (!approval) {
      throw new Error("GOVERNANCE_APPROVAL_REQUIRED");
    }
  }

  const { canSubmit } = await validateProviderClaim(claimId, user);
  if (!canSubmit) {
    throw new Error("CLAIM_VALIDATION_FAILED");
  }

  const payload = claim.claimPayloadJson as NdiaProviderClaimPayload;
  const idempotencyKey = buildClaimIdempotencyKey(claim.organisationId, payload);

  if (
    isDuplicateIdempotencyKey(claim.externalClaimId, idempotencyKey) ||
    (claim.externalStatus === "synthetic_validation_only" &&
      claim.status === "dry_run_passed")
  ) {
    // Soft duplicate: prior synthetic validation already recorded.
    if (claim.externalClaimId) {
      await writeClaimAudit(claimId, "duplicate_synthetic_blocked", user.id, {
        idempotencyKey,
      });
      return {
        claim,
        submitResult: {
          mode: "synthetic" as const,
          externalClaimId: claim.externalClaimId,
          externalStatus: claim.externalStatus ?? "synthetic_validation_only",
          lifecyclePhase: "synthetic_validated" as const,
          notSubmitted: true as const,
          governmentReference: null,
          response: { duplicate: true, idempotencyKey },
        },
        lifecycle: mapPrismaStatusToLifecycle(claim.status, claim.externalStatus),
        disclaimer:
          "Duplicate synthetic validation blocked — claim was not re-sent and was never sent to NDIA.",
      };
    }
  }

  // Live flag hazard: still no network; surface explicit block.
  if (isNdiaProviderLiveSubmitAllowed()) {
    await writeClaimAudit(claimId, "live_transport_blocked", user.id, {
      reason: "NDIA_AUTHORISED_TRANSPORT_NOT_IMPLEMENTED",
    });
    await createAuditEvent({
      actorUserId: user.id,
      action: "ndia.provider_claim.live_blocked",
      entityType: "NdiaProviderClaim",
      entityId: claimId,
      participantId: claim.participantId,
      metadata: { idempotencyKey },
    });
    throw new Error("NDIA_AUTHORISED_TRANSPORT_NOT_IMPLEMENTED");
  }

  const result = await submitProviderClaimToNdia(payload);

  const updated = await prisma.ndiaProviderClaim.update({
    where: { id: claimId },
    data: {
      status: prismaStatusForSyntheticValidation(),
      externalClaimId: result.externalClaimId,
      externalStatus: result.externalStatus,
      // Do not set submittedAt — that implies government transmission.
      submittedAt: null,
    },
  });

  // Do NOT flip invoice / billing to ndia_submitted on synthetic outcomes.

  await writeClaimAudit(claimId, "synthetic_validated", user.id, {
    ...result,
    idempotencyKey,
  });
  await createAuditEvent({
    actorUserId: user.id,
    action: "ndia.provider_claim.synthetic_validated",
    entityType: "NdiaProviderClaim",
    entityId: claimId,
    participantId: claim.participantId,
    metadata: {
      notSubmitted: true,
      lifecycle: result.lifecyclePhase,
    },
  });

  return {
    claim: updated,
    submitResult: result,
    lifecycle: mapPrismaStatusToLifecycle(
      updated.status,
      updated.externalStatus,
    ),
    disclaimer:
      "Synthetic validation only — not sent to NDIA. Not an NDIA digital-partner claim.",
  };
}

export async function listProviderClaims(
  user: CurrentUser,
  organisationId: string,
) {
  await assertOrganisationAuthorised(user, organisationId);
  return prisma.ndiaProviderClaim.findMany({
    where: { organisationId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getProviderClaimForOrg(
  user: CurrentUser,
  claimId: string,
  organisationId: string,
) {
  const claim = await prisma.ndiaProviderClaim.findUnique({
    where: { id: claimId },
  });
  if (!claim) throw new Error("NOT_FOUND");
  await assertOrganisationAuthorised(user, organisationId);
  await assertNotCrossTenant(claim.organisationId, organisationId);
  return claim;
}

export { NdiaClaimAuthorityError };
