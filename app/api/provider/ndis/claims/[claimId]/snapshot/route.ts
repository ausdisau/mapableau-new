import { z } from "zod";

import { requireApiPermission, requireApiSession } from "@/lib/api/auth-handler";
import { zodErrorResponse } from "@/lib/api/response";
import type { CurrentUser } from "@/lib/auth/current-user";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import { decryptNdisNumber } from "@/lib/crypto/ndis";
import { NdisGatewayError } from "@/lib/ndis-gateway/domain/errors";
import type { FundingRoute } from "@/lib/ndis-gateway/domain/funding-route";
import {
  createClaimSnapshot,
  fundingRouteFromLegacyType,
  loadExternalPayloadForSubmission,
} from "@/lib/ndis-gateway/security/claim-snapshot-service";
import { jsonNdisError, jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import {
  toMaskedClaimPayload,
  type ExternalClaimPayload,
} from "@/lib/ndis-gateway/security/sensitive-payload";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  organisationId: z.string().cuid().optional(),
});

type Params = { params: Promise<{ claimId: string }> };

async function requireAnyPermission(
  permissions: Permission[]
): Promise<CurrentUser | Response> {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (permissions.some((p) => hasPermission(user.primaryRole, p))) return user;
  return requireApiPermission(permissions[0]!);
}

async function resolveClaimFundingRoute(claim: {
  legacyInvoiceId: string | null;
  billingInvoiceId: string | null;
}): Promise<FundingRoute> {
  if (claim.legacyInvoiceId) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: claim.legacyInvoiceId },
      include: { fundingSource: true },
    });
    return fundingRouteFromLegacyType(invoice?.fundingSource?.type);
  }
  if (claim.billingInvoiceId) {
    const invoice = await prisma.billingInvoice.findUnique({
      where: { id: claim.billingInvoiceId },
      include: { fundingSource: true },
    });
    return fundingRouteFromLegacyType(invoice?.fundingSource?.type);
  }
  return "unknown";
}

/**
 * Create an append-only privacy-safe snapshot for an existing provider claim.
 * POST /api/provider/ndis/claims/[claimId]/snapshot
 */
export async function POST(req: Request, { params }: Params) {
  const user = await requireAnyPermission([
    "provider:ndis:claim:create",
    "provider:ndia:claim",
    "provider:ndis:claim",
  ]);
  if (user instanceof Response) return user;

  const { claimId } = await params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const claim = await prisma.ndiaProviderClaim.findUnique({
    where: { id: claimId },
  });
  if (!claim) return jsonNdisError("Claim not found", 404);

  const organisationId = parsed.data.organisationId ?? claim.organisationId;
  if (organisationId !== claim.organisationId) {
    return jsonNdisError("organisationId mismatch", 400);
  }

  try {
    let externalPayload: ExternalClaimPayload;
    if (claim.currentSnapshotId) {
      externalPayload = await loadExternalPayloadForSubmission({
        snapshotId: claim.currentSnapshotId,
        organisationId,
      });
    } else {
      const masked = toMaskedClaimPayload(
        claim.claimPayloadJson as ExternalClaimPayload
      );
      const profile = await prisma.participantProfile.findUnique({
        where: { userId: claim.participantId },
      });
      const ndisNumber = profile?.ndisParticipantNumberEnc
        ? decryptNdisNumber(profile.ndisParticipantNumberEnc)
        : null;
      externalPayload = {
        ...masked,
        participant: {
          ...masked.participant,
          ndisNumber,
        },
      };
    }

    const fundingRoute = await resolveClaimFundingRoute(claim);

    const result = await createClaimSnapshot({
      user,
      organisationId,
      participantId: claim.participantId,
      sourceType: "ndia_provider_claim",
      sourceId: claim.id,
      fundingRoute,
      externalPayload,
      forDirectSubmission: true,
    });

    if (claim.currentSnapshotId && claim.currentSnapshotId !== result.snapshot.id) {
      await prisma.ndisClaimSnapshot.update({
        where: { id: claim.currentSnapshotId },
        data: {
          supersededAt: new Date(),
          supersededById: result.snapshot.id,
        },
      });
    }

    await prisma.ndiaProviderClaim.update({
      where: { id: claim.id },
      data: {
        currentSnapshotId: result.snapshot.id,
        payloadHash: result.payloadHash,
        claimPayloadJson: result.maskedPayload as object,
      },
    });

    return jsonNdisOk(
      {
        snapshot: result.snapshot,
        payloadHash: result.payloadHash,
        correlationId: result.correlationId,
      },
      201
    );
  } catch (e) {
    if (e instanceof NdisGatewayError) {
      return jsonNdisError(e.plainLanguageMessage, 400);
    }
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "FORBIDDEN") return jsonNdisError("Forbidden", 403);
    throw e;
  }
}
