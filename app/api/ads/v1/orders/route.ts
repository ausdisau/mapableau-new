import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { userHasAdsPermission } from "@/lib/ads/auth/ads-permissions";
import { requireAdvertiserAccess } from "@/lib/ads/auth/advertiser-access";
import {
  assertPlacementApiEnabled,
  placementApiDisabledResponse,
} from "@/lib/ads/manager/flag-gate";
import {
  findIdempotentResponse,
  hashRequestPayload,
  storeIdempotentResponse,
} from "@/lib/ads/manager/idempotency";
import {
  authoriseSpend,
  createPlacementOrder,
  PlacementOrderError,
  serializeOrder,
} from "@/lib/ads/placement/orders";
import { OrganisationAccessError } from "@/lib/api/organisation-scope";
import { jsonError, zodErrorResponse } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { apiForbidden, apiUnauthorized, getApiUser } from "@/lib/auth/guards";

const orderSchema = z
  .object({
    advertiserId: z.string().min(1),
    quoteId: z.string().min(1),
    campaignId: z.string().optional(),
    spendAuthorisationId: z.string().optional(),
    approvedAmountMinor: z.number().int().positive().optional(),
    creativeReviewApproved: z.boolean(),
  })
  .refine(
    (v) => Boolean(v.spendAuthorisationId) || Boolean(v.approvedAmountMinor),
    {
      message:
        "Provide spendAuthorisationId or approvedAmountMinor for sandbox authorisation",
    },
  );

/** POST /api/ads/v1/orders — async mock dispatch; 202. */
export async function POST(request: Request) {
  if (!assertPlacementApiEnabled()) return placementApiDisabledResponse();

  const user = await getApiUser();
  if (!user) return apiUnauthorized();
  if (!userHasAdsPermission(user, "ads:spend:approve")) {
    return apiForbidden("Missing ads:spend:approve");
  }

  const idempotencyKey = request.headers.get("Idempotency-Key");
  if (!idempotencyKey || idempotencyKey.length < 12) {
    return jsonError("Idempotency-Key header required", 400);
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = orderSchema.safeParse(json);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const requestHash = hashRequestPayload(parsed.data);
  const prior = await findIdempotentResponse({
    scope: "ads.v1.orders",
    idempotencyKey,
    advertiserId: parsed.data.advertiserId,
    requestHash,
  });
  if (prior?.conflict) return jsonError("Idempotency key conflict", 409);
  if (prior && !prior.conflict) {
    return Response.json(prior.body, { status: prior.status });
  }

  try {
    const access = await requireAdvertiserAccess(
      user,
      parsed.data.advertiserId,
    );

    let spendAuthorisationId = parsed.data.spendAuthorisationId;
    if (!spendAuthorisationId) {
      const auth = await authoriseSpend({
        quoteId: parsed.data.quoteId,
        advertiserId: parsed.data.advertiserId,
        actorUserId: user.id,
        campaignId: parsed.data.campaignId,
        approvedAmountMinor: parsed.data.approvedAmountMinor!,
      });
      spendAuthorisationId = auth.id;
    }

    const order = await createPlacementOrder({
      advertiserId: parsed.data.advertiserId,
      organisationId: access.organisationId,
      quoteId: parsed.data.quoteId,
      spendAuthorisationId,
      campaignId: parsed.data.campaignId,
      idempotencyKey,
      creativeReviewApproved: parsed.data.creativeReviewApproved,
    });

    const body = {
      ...serializeOrder(order),
      operationId: order.requestId,
      notice: "Accepted for dispatch — not proof of delivery or live purchase",
    };

    await createAuditEvent({
      action: "ads.placement_order.submitted",
      actorUserId: user.id,
      entityType: "AdPlacementOrder",
      entityId: order.id,
      metadata: {
        channel: order.channel,
        status: order.status,
        freezeRetry: order.freezeRetry,
      },
    });

    await storeIdempotentResponse(
      {
        scope: "ads.v1.orders",
        idempotencyKey,
        advertiserId: parsed.data.advertiserId,
        requestHash,
      },
      202,
      body as unknown as Prisma.InputJsonValue,
    );

    return Response.json(body, { status: 202 });
  } catch (err) {
    if (err instanceof OrganisationAccessError) {
      return apiForbidden(err.message);
    }
    if (err instanceof PlacementOrderError) {
      return jsonError(err.message, err.status);
    }
    return jsonError(err instanceof Error ? err.message : "Order failed", 400);
  }
}
