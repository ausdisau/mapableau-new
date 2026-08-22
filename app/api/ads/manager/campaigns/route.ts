import { z } from "zod";

import { requireAdvertiserAccess } from "@/lib/ads/auth/advertiser-access";
import { centsToMicros, MICROS_PER_AUD } from "@/lib/ads/money/micros";
import { OrganisationAccessError } from "@/lib/api/organisation-scope";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { apiForbidden, apiUnauthorized, getApiUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

const campaignSchema = z.object({
  advertiserId: z.string().min(1),
  name: z.string().min(1).max(200),
  bidModel: z.enum(["CPM", "CPC"]),
  /** Dollars as decimal string e.g. "22.00" — converted server-side to micros. */
  maxBidAud: z.string().regex(/^\d+(\.\d{1,2})?$/),
  dailyBudgetAud: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  lifetimeBudgetAud: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  placementCodes: z.array(z.string()).min(1),
  region: z.string().optional(),
  category: z.string().optional(),
  creative: z.object({
    format: z.string().min(1),
    headline: z.string().min(1).max(120),
    body: z.string().min(1).max(500),
    destinationUrl: z.string().url(),
    imageUrl: z.string().url().optional(),
    altText: z.string().max(200).optional(),
    businessName: z.string().max(120).optional(),
  }),
});

function audStringToMicros(aud: string): bigint {
  const [whole, frac = ""] = aud.split(".");
  const cents =
    Number.parseInt(whole!, 10) * 100 +
    Number.parseInt((frac + "00").slice(0, 2), 10);
  return centsToMicros(cents);
}

/**
 * POST /api/ads/manager/campaigns — create draft campaign (advertiser cannot self-approve).
 */
export async function POST(request: Request) {
  const user = await getApiUser();
  if (!user) return apiUnauthorized();

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = campaignSchema.safeParse(json);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    await requireAdvertiserAccess(user, parsed.data.advertiserId);
  } catch (err) {
    if (err instanceof OrganisationAccessError) {
      return apiForbidden(err.message);
    }
    throw err;
  }

  const maxBidMicros = audStringToMicros(parsed.data.maxBidAud);
  if (maxBidMicros < MICROS_PER_AUD) {
    return jsonError("Maximum bid must be at least A$1", 400);
  }

  const campaign = await prisma.adCampaign.create({
    data: {
      advertiserId: parsed.data.advertiserId,
      name: parsed.data.name,
      status: "DRAFT",
      bidModel: parsed.data.bidModel,
      maxBidMicros,
      dailyBudgetMicros: parsed.data.dailyBudgetAud
        ? audStringToMicros(parsed.data.dailyBudgetAud)
        : null,
      lifetimeBudgetMicros: parsed.data.lifetimeBudgetAud
        ? audStringToMicros(parsed.data.lifetimeBudgetAud)
        : null,
      startAt: parsed.data.startAt ? new Date(parsed.data.startAt) : null,
      endAt: parsed.data.endAt ? new Date(parsed.data.endAt) : null,
      placementCodes: parsed.data.placementCodes,
      isHouse: false,
      creatives: {
        create: {
          format: parsed.data.creative.format,
          headline: parsed.data.creative.headline,
          body: parsed.data.creative.body,
          destinationUrl: parsed.data.creative.destinationUrl,
          imageUrl: parsed.data.creative.imageUrl,
          altText: parsed.data.creative.altText,
          businessName: parsed.data.creative.businessName,
          status: "DRAFT",
        },
      },
      targets: {
        create: {
          region: parsed.data.region ?? "national",
          category: parsed.data.category,
          geometry: { type: "NATIONAL" },
        },
      },
    },
    include: { creatives: true },
  });

  await createAuditEvent({
    actorUserId: user.id,
    actorRole: user.primaryRole as never,
    action: "ads.campaign.created",
    entityType: "AdCampaign",
    entityId: campaign.id,
    metadata: {
      bidModel: campaign.bidModel,
      maxBidMicros: maxBidMicros.toString(),
    },
  });

  return jsonOk(
    {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        bidModel: campaign.bidModel,
        maxBidMicros: campaign.maxBidMicros?.toString(),
      },
      notice:
        "You will never be charged more than your maximum bid. Actual price may be lower depending on competing eligible ads and MapAble placement reserve prices.",
    },
    201,
  );
}
