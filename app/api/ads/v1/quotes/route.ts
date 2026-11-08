import { z } from "zod";

import { requireAdvertiserAccess } from "@/lib/ads/auth/advertiser-access";
import { userHasAdsPermission } from "@/lib/ads/auth/ads-permissions";
import {
  findIdempotentResponse,
  hashRequestPayload,
  storeIdempotentResponse,
} from "@/lib/ads/manager/idempotency";
import {
  assertPlacementApiEnabled,
  placementApiDisabledResponse,
} from "@/lib/ads/manager/flag-gate";
import {
  createPlacementQuote,
  serializeQuote,
} from "@/lib/ads/placement/quotes";
import { OrganisationAccessError } from "@/lib/api/organisation-scope";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { apiForbidden, apiUnauthorized, getApiUser } from "@/lib/auth/guards";
import type { Prisma } from "@prisma/client";

const quoteSchema = z.object({
  advertiserId: z.string().min(1),
  campaignId: z.string().optional(),
  opportunityId: z.string().min(1),
  channel: z.enum(["mapable", "meta", "google", "tiktok", "linkedin", "dooh"]),
  providerId: z.string().min(1),
  mediaMinor: z.number().int().nonnegative(),
  partnerFeesMinor: z.number().int().nonnegative().optional(),
  platformFeesMinor: z.number().int().nonnegative().optional(),
  taxMinor: z.number().int().nonnegative().optional(),
  buyingMode: z.enum([
    "owned_reservation",
    "guaranteed",
    "preferred_deal",
    "private_auction",
    "open_auction",
    "social_platform",
  ]),
  quoteKind: z.enum(["indicative", "firm"]).optional(),
});

/** POST /api/ads/v1/quotes — indicative/firm quote; never spends. */
export async function POST(request: Request) {
  if (!assertPlacementApiEnabled()) return placementApiDisabledResponse();

  const user = await getApiUser();
  if (!user) return apiUnauthorized();
  if (!userHasAdsPermission(user, "ads:campaigns:write")) {
    return apiForbidden("Missing ads:campaigns:write");
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

  const parsed = quoteSchema.safeParse(json);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const requestHash = hashRequestPayload(parsed.data);
  const prior = await findIdempotentResponse({
    scope: "ads.v1.quotes",
    idempotencyKey,
    advertiserId: parsed.data.advertiserId,
    requestHash,
  });
  if (prior?.conflict) {
    return jsonError("Idempotency key conflict", 409);
  }
  if (prior && !prior.conflict) {
    return Response.json(prior.body, { status: prior.status });
  }

  try {
    const access = await requireAdvertiserAccess(
      user,
      parsed.data.advertiserId,
    );
    const quote = await createPlacementQuote({
      ...parsed.data,
      organisationId: access.organisationId,
    });
    const body = serializeQuote(quote);
    await storeIdempotentResponse(
      {
        scope: "ads.v1.quotes",
        idempotencyKey,
        advertiserId: parsed.data.advertiserId,
        requestHash,
      },
      201,
      body as unknown as Prisma.InputJsonValue,
    );
    return Response.json(body, { status: 201 });
  } catch (err) {
    if (err instanceof OrganisationAccessError) {
      return apiForbidden(err.message);
    }
    return jsonError(err instanceof Error ? err.message : "Quote failed", 400);
  }
}
