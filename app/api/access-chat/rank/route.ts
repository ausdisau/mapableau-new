import { z } from "zod";

import {
  rankPlacesByAccessFit,
  type RankablePlace,
} from "@/lib/access-chat/access-fit-ranker";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isAccessChatEnabled } from "@/lib/config/access-chat";
import { prisma } from "@/lib/prisma";
import { accessSearchIntentSchema } from "@/types/access-chat";

const bodySchema = z.object({
  intent: accessSearchIntentSchema,
  placeIds: z.array(z.string()).min(1).max(50),
  limit: z.number().min(1).max(10).optional(),
});

export const maxDuration = 30;

/** Rank provided place IDs by access-fit. */
export async function POST(req: Request) {
  if (!isAccessChatEnabled()) {
    return jsonError("Access chat is disabled", 503);
  }

  const ip = getClientIp(req);
  if (!checkIpRateLimit(ip, { windowMs: 60_000, max: 30 })) {
    return jsonError("Too many requests. Please wait a moment.", 429);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const places = await prisma.accessPlace.findMany({
      where: {
        id: { in: parsed.data.placeIds },
        status: "published",
      },
      include: {
        location: true,
        features: true,
        ratingSummaries: true,
        accreditationAssessments: {
          where: { status: "published" },
          take: 1,
          orderBy: { publishedAt: "desc" },
        },
        reviews: {
          where: { status: "published" },
          orderBy: { createdAt: "desc" },
          take: 3,
          include: { photos: { take: 1, select: { id: true } } },
        },
        alerts: {
          where: {
            status: "active",
            OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
          },
          take: 5,
        },
        _count: {
          select: { reviews: { where: { status: "published" } } },
        },
      },
    });

    const results = rankPlacesByAccessFit(
      places as unknown as RankablePlace[],
      parsed.data.intent,
      { limit: parsed.data.limit ?? 5 },
    );

    return jsonOk({ results });
  } catch (err) {
    console.error("[access-chat/rank]", err);
    return jsonError("Ranking failed.", 502);
  }
}
