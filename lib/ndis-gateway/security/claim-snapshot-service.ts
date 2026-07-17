import type { NdisClaimSourceType } from "@prisma/client";

import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import {
  decryptNdisSensitiveJson,
  getActiveNdisEncryptionKeyVersion,
} from "@/lib/crypto/ndis";
import { fundingSourceTypeToFundingRoute } from "@/lib/ndis-gateway/compatibility/from-funding-source";
import { NdisGatewayError } from "@/lib/ndis-gateway/domain/errors";
import {
  allowsRegisteredProviderDirectClaim,
  resolveClaimPath,
  type FundingRoute,
} from "@/lib/ndis-gateway/domain/funding-route";
import {
  insertClaimSnapshot,
  findClaimSnapshotById,
  listClaimSnapshotsForSource,
  markSnapshotSuperseded,
  toSafeSnapshotDto,
} from "@/lib/ndis-gateway/infrastructure/claim-snapshot-repository";
import { createCorrelationId } from "@/lib/ndis-gateway/infrastructure/correlation";
import { sanitiseAuditJson } from "@/lib/ndis-gateway/security/log-sanitiser";
import {
  CLAIM_PAYLOAD_CANONICALISATION_VERSION,
  encryptExternalClaimPayload,
  hashCanonicalClaimIdentity,
  toMaskedClaimPayload,
  type ExternalClaimPayload,
  type MaskedClaimPayload,
} from "@/lib/ndis-gateway/security/sensitive-payload";
import { prisma } from "@/lib/prisma";

async function assertOrgAccess(user: CurrentUser, organisationId: string) {
  if (isAdminRole(user.primaryRole)) return;
  const orgIds = await getUserOrganisationIds(user.id);
  if (!orgIds.includes(organisationId)) {
    throw new NdisGatewayError({
      code: "FUNDING_ROUTE_BLOCKED",
      plainLanguageMessage: "You do not have access to this organisation.",
      technicalMessage: "FORBIDDEN organisation access for claim snapshot",
    });
  }
}

export type CreateClaimSnapshotInput = {
  user: CurrentUser;
  organisationId: string;
  participantId: string;
  sourceType: NdisClaimSourceType;
  sourceId: string;
  sourceVersion?: string | null;
  fundingRoute: FundingRoute;
  externalPayload: ExternalClaimPayload;
  pricingReleaseId?: string | null;
  privacyReviewRequired?: boolean;
  /** When true, block non-NDIA-managed routes from creating an externalizable snapshot. */
  forDirectSubmission?: boolean;
};

export async function createClaimSnapshot(input: CreateClaimSnapshotInput) {
  await assertOrgAccess(input.user, input.organisationId);

  const org = await prisma.organisation.findUnique({
    where: { id: input.organisationId },
  });
  if (!org) {
    throw new NdisGatewayError({
      code: "PROVIDER_NOT_REGISTERED",
      plainLanguageMessage: "Organisation not found.",
      technicalMessage: "Organisation missing for snapshot",
    });
  }

  const registration = {
    claimed: org.ndisRegistrationClaimed,
    registrationNumber: org.ndisRegistrationNumber,
    active: org.status === "active",
  };

  const path = resolveClaimPath(input.fundingRoute, registration, {
    hasNdisNumber: Boolean(input.externalPayload.participant.ndisNumber),
  });

  if (input.forDirectSubmission) {
    if (!allowsRegisteredProviderDirectClaim(input.fundingRoute)) {
      throw new NdisGatewayError({
        code: "FUNDING_ROUTE_BLOCKED",
        plainLanguageMessage:
          "This funding type cannot enter the registered-provider direct-submission pathway.",
        technicalMessage: `Direct submission blocked for fundingRoute=${input.fundingRoute}`,
      });
    }
    if (path.blocked || path.blockCode === "PROVIDER_NOT_REGISTERED") {
      throw new NdisGatewayError({
        code: "PROVIDER_NOT_REGISTERED",
        plainLanguageMessage:
          "Only active registered NDIS providers can prepare NDIA-managed direct submissions.",
        technicalMessage: path.blockMessage ?? "Provider not registered",
      });
    }
  }

  const supportItemCodes = input.externalPayload.lines.map((l) => l.supportItemCode);
  const payloadHash = hashCanonicalClaimIdentity({
    organisationId: input.organisationId,
    participantId: input.participantId,
    fundingRoute: input.fundingRoute,
    supportItemCodes,
    servicePeriod: input.externalPayload.servicePeriod,
    lines: input.externalPayload.lines.map((l) => ({
      supportItemCode: l.supportItemCode,
      serviceDate: l.serviceDate,
      quantity: l.quantity,
      unitPriceCents: l.unitPriceCents,
      totalCents: l.totalCents,
    })),
    totals: {
      totalCents: input.externalPayload.totals.totalCents,
      currency: input.externalPayload.totals.currency,
    },
  });

  const maskedPayload = toMaskedClaimPayload(input.externalPayload);
  const { ciphertext, encryptionKeyVersion } = encryptExternalClaimPayload(
    input.externalPayload,
    input.organisationId
  );

  const snapshot = await insertClaimSnapshot({
    organisationId: input.organisationId,
    participantId: input.participantId,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    sourceVersion: input.sourceVersion,
    schemaVersion: CLAIM_PAYLOAD_CANONICALISATION_VERSION,
    maskedPayloadJson: maskedPayload as object,
    encryptedPayloadCiphertext: ciphertext,
    payloadHash,
    encryptionKeyVersion,
    pricingReleaseId: input.pricingReleaseId,
    supportItemCodes,
    totalCents: input.externalPayload.totals.totalCents,
    currency: input.externalPayload.totals.currency,
    fundingRoute: input.fundingRoute,
    createdById: input.user.id,
    privacyReviewRequired: input.privacyReviewRequired ?? false,
  });

  const correlationId = createCorrelationId();
  await createAuditEvent({
    actorUserId: input.user.id,
    action: "ndis.claim_snapshot.created",
    entityType: "NdisClaimSnapshot",
    entityId: snapshot.id,
    participantId: input.participantId,
    organisationId: input.organisationId,
    metadata: sanitiseAuditJson({
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      payloadHash,
      fundingRoute: input.fundingRoute,
      correlationId,
    }),
  });

  return {
    snapshot: toSafeSnapshotDto(snapshot),
    maskedPayload,
    payloadHash,
    correlationId,
  };
}

export async function getClaimSnapshotSafe(
  snapshotId: string,
  user: CurrentUser
) {
  const snapshot = await findClaimSnapshotById(snapshotId);
  if (!snapshot) {
    throw new NdisGatewayError({
      code: "UNSUPPORTED_OPERATION",
      plainLanguageMessage: "Claim snapshot not found.",
      technicalMessage: "NOT_FOUND snapshot",
    });
  }
  await assertOrgAccess(user, snapshot.organisationId);
  return toSafeSnapshotDto(snapshot);
}

export async function listSnapshotsForClaim(params: {
  user: CurrentUser;
  organisationId: string;
  sourceType: NdisClaimSourceType;
  sourceId: string;
}) {
  await assertOrgAccess(params.user, params.organisationId);
  const rows = await listClaimSnapshotsForSource({
    sourceType: params.sourceType,
    sourceId: params.sourceId,
    organisationId: params.organisationId,
  });
  return rows.map((row) => toSafeSnapshotDto(row));
}

/**
 * Server-only: decrypt external payload for submission boundary.
 * Never return this from list/detail APIs.
 */
export async function loadExternalPayloadForSubmission(params: {
  snapshotId: string;
  organisationId: string;
}): Promise<ExternalClaimPayload> {
  const snapshot = await findClaimSnapshotById(params.snapshotId);
  if (!snapshot) {
    throw new NdisGatewayError({
      code: "UNSUPPORTED_OPERATION",
      plainLanguageMessage: "Claim snapshot not found.",
      technicalMessage: "NOT_FOUND snapshot for decrypt",
    });
  }
  if (snapshot.organisationId !== params.organisationId) {
    throw new NdisGatewayError({
      code: "FUNDING_ROUTE_BLOCKED",
      plainLanguageMessage: "Snapshot does not belong to this organisation.",
      technicalMessage: "ORG_MISMATCH snapshot decrypt",
    });
  }
  if (snapshot.supersededAt) {
    throw new NdisGatewayError({
      code: "UNSUPPORTED_OPERATION",
      plainLanguageMessage: "This claim snapshot has been superseded.",
      technicalMessage: "SUPERSEDED snapshot",
    });
  }
  return decryptNdisSensitiveJson<ExternalClaimPayload>(
    snapshot.encryptedPayloadCiphertext,
    `ndis-claim:${params.organisationId}`
  );
}

export async function supersedeClaimSnapshot(params: {
  user: CurrentUser;
  previousSnapshotId: string;
  nextExternalPayload: ExternalClaimPayload;
  fundingRoute: FundingRoute;
  sourceType: NdisClaimSourceType;
  sourceId: string;
  participantId: string;
  forDirectSubmission?: boolean;
}) {
  const previous = await findClaimSnapshotById(params.previousSnapshotId);
  if (!previous) {
    throw new NdisGatewayError({
      code: "UNSUPPORTED_OPERATION",
      plainLanguageMessage: "Previous claim snapshot not found.",
      technicalMessage: "NOT_FOUND previous snapshot",
    });
  }
  await assertOrgAccess(params.user, previous.organisationId);

  const created = await createClaimSnapshot({
    user: params.user,
    organisationId: previous.organisationId,
    participantId: params.participantId,
    sourceType: params.sourceType,
    sourceId: params.sourceId,
    fundingRoute: params.fundingRoute,
    externalPayload: params.nextExternalPayload,
    forDirectSubmission: params.forDirectSubmission,
  });

  await markSnapshotSuperseded({
    snapshotId: previous.id,
    supersededById: created.snapshot.id,
  });

  await createAuditEvent({
    actorUserId: params.user.id,
    action: "ndis.claim_snapshot.superseded",
    entityType: "NdisClaimSnapshot",
    entityId: previous.id,
    organisationId: previous.organisationId,
    participantId: params.participantId,
    metadata: sanitiseAuditJson({
      previousSnapshotId: previous.id,
      nextSnapshotId: created.snapshot.id,
      previousPayloadHash: previous.payloadHash,
      nextPayloadHash: created.payloadHash,
    }),
  });

  return created;
}

export function fundingRouteFromLegacyType(
  type: string | null | undefined
): FundingRoute {
  return fundingSourceTypeToFundingRoute(
    type as Parameters<typeof fundingSourceTypeToFundingRoute>[0]
  );
}

export function getSnapshotEncryptionKeyVersion(): string {
  return getActiveNdisEncryptionKeyVersion();
}

export type { MaskedClaimPayload, ExternalClaimPayload };
