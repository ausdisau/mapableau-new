import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { zodErrorResponse } from "@/lib/api/response";
import { createBillingBatch } from "@/lib/ndis-gateway/billing/batch-service";
import { NdisGatewayError } from "@/lib/ndis-gateway/domain/errors";
import { jsonNdisError, jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import {
  mapBillingServiceError,
  resolveProviderOrganisationId,
} from "@/lib/ndis-gateway/security/org-scope";
import { preparePaymentForBillableItems } from "@/lib/ndis-gateway/workflows/prepare-payment-workflow";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  organisationId: z.string().cuid().optional(),
  billableItemIds: z.array(z.string().cuid()).min(1).max(200),
  idempotencyKey: z.string().min(1).max(200).optional(),
});

/**
 * POST /api/provider/ndis/portal-exports
 * Prepare an NDIA portal package (batch + export). Does NOT submit to NDIA.
 */
export async function POST(req: Request) {
  const user = await requireApiPermission("provider:billing:approve");
  if (user instanceof Response) return user;

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const organisationId = await resolveProviderOrganisationId(
    user,
    parsed.data.organisationId
  );
  if (organisationId instanceof Response) return organisationId;

  try {
    const batchResult = await createBillingBatch({
      organisationId,
      billingRoute: "ndis_ndia_managed",
      billableItemIds: parsed.data.billableItemIds,
      createdById: user.id,
      idempotencyKey: parsed.data.idempotencyKey,
    });

    if (!batchResult.batch) {
      return jsonNdisError(
        batchResult.issues[0]?.message ??
          "Could not create portal export package",
        400
      );
    }

    const prepare = await preparePaymentForBillableItems({
      organisationId,
      actorUserId: user.id,
      user,
      billableItemIds: parsed.data.billableItemIds,
      billingRoute: "ndis_ndia_managed",
      dryRun: false,
      billingBatchId: batchResult.batch.id,
    });

    const refreshed = await prisma.ndisBillingBatch.findUnique({
      where: { id: batchResult.batch.id },
    });

    return jsonNdisOk(
      {
        portalExport: {
          id: batchResult.batch.id,
          batchReference: batchResult.batch.batchReference,
          status: refreshed?.status ?? batchResult.batch.status,
          exportFileName: refreshed?.exportFileName ?? null,
          exportChecksum: refreshed?.exportChecksum ?? null,
          exportedAt: refreshed?.exportedAt?.toISOString() ?? null,
          billingRoute: batchResult.batch.billingRoute,
        },
        prepare,
        message:
          "Portal package generated. Upload manually in the myplace provider portal. MapAble does not submit on your behalf.",
      },
      batchResult.idempotent ? 200 : 201
    );
  } catch (e) {
    if (e instanceof NdisGatewayError) {
      return jsonNdisError(e.plainLanguageMessage, 400);
    }
    const mapped = mapBillingServiceError(e);
    if (mapped) return mapped;
    throw e;
  }
}

/** GET /api/provider/ndis/portal-exports — list NDIA batches */
export async function GET(req: Request) {
  const user = await requireApiPermission("provider:billing:view");
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const organisationId = await resolveProviderOrganisationId(
    user,
    url.searchParams.get("organisationId")
  );
  if (organisationId instanceof Response) return organisationId;

  const batches = await prisma.ndisBillingBatch.findMany({
    where: {
      organisationId,
      billingRoute: "ndis_ndia_managed",
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return jsonNdisOk({
    portalExports: batches.map((b) => ({
      id: b.id,
      batchReference: b.batchReference,
      status: b.status,
      exportFileName: b.exportFileName,
      exportChecksum: b.exportChecksum,
      exportedAt: b.exportedAt?.toISOString() ?? null,
      createdAt: b.createdAt.toISOString(),
    })),
  });
}
