import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  CARE_MAP_LIMIT,
  isValidCareMapBounds,
  toCareMapProvider,
  type CareMapBounds,
  type CareMapResponse,
} from "@/lib/provider/care-map-contract";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const OFFICIAL_FINDER =
  "https://www.ndis.gov.au/participants/working-providers/finding-providers/provider-finder";

const querySchema = z.object({
  south: z.coerce.number().finite().min(-90).max(90),
  west: z.coerce.number().finite().min(-180).max(180),
  north: z.coerce.number().finite().min(-90).max(90),
  east: z.coerce.number().finite().min(-180).max(180),
  state: z.enum(["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"]).optional(),
  group: z.string().trim().max(200).optional(),
  q: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(CARE_MAP_LIMIT).optional(),
});

function respond(payload: unknown, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function GET(request: Request) {
  if (
    !checkIpRateLimit("care-provider-map:" + getClientIp(request), {
      windowMs: 60_000,
      max: 60,
    })
  ) {
    return respond({ error: "Too many map requests. Try again shortly." }, 429);
  }

  const params = new URL(request.url).searchParams;
  const parsed = querySchema.safeParse({
    south: params.get("south") ?? undefined,
    west: params.get("west") ?? undefined,
    north: params.get("north") ?? undefined,
    east: params.get("east") ?? undefined,
    state: params.get("state") || undefined,
    group: params.get("group") || undefined,
    q: params.get("q") || undefined,
    limit: params.get("limit") || undefined,
  });
  if (!parsed.success) {
    return respond({ error: "Invalid map search parameters." }, 400);
  }

  const { state, group, q } = parsed.data;
  const bounds: CareMapBounds = {
    south: parsed.data.south,
    west: parsed.data.west,
    north: parsed.data.north,
    east: parsed.data.east,
  };
  if (!isValidCareMapBounds(bounds)) {
    return respond({ error: "Invalid map bounds." }, 400);
  }

  try {
    // A completed run proves which directory snapshot was imported. Requiring
    // an updatedAt >= run.startedAt excludes rows absent from the latest import;
    // the underlying ingest currently upserts but does not delete stale rows.
    const lastRun = await prisma.ndisProviderIngestionRun.findFirst({
      where: { status: "success", finishedAt: { not: null } },
      orderBy: { finishedAt: "desc" },
      select: { startedAt: true, finishedAt: true },
    });
    if (!lastRun?.finishedAt) {
      return respond(
        {
          error:
            "The imported NDIS provider directory is not available. Use the official NDIS Provider Finder.",
        },
        503,
      );
    }

    const where: Prisma.NdisProviderWhereInput = {
      updatedAt: { gte: lastRun.startedAt },
      latitude: {
        gte: Math.max(bounds.south, -56),
        lte: Math.min(bounds.north, -9),
      },
      longitude: {
        gte: Math.max(bounds.west, 95),
        lte: Math.min(bounds.east, 170),
      },
      ...(state ? { state } : {}),
      ...(group ? { registrationGroups: { has: group } } : {}),
      ...(q
        ? {
            OR: [
              { providerName: { contains: q, mode: "insensitive" } },
              { suburb: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const limit = parsed.data.limit ?? CARE_MAP_LIMIT;
    const rows = await prisma.ndisProvider.findMany({
      where,
      orderBy: [{ providerName: "asc" }, { sourceId: "asc" }],
      take: limit + 1,
      select: {
        sourceId: true,
        providerName: true,
        suburb: true,
        state: true,
        postcode: true,
        latitude: true,
        longitude: true,
        abn: true,
        phone: true,
        website: true,
        registrationGroups: true,
        sourceUpdatedAt: true,
        updatedAt: true,
      },
    });
    const providers = rows
      .map(toCareMapProvider)
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .slice(0, limit);
    const response: CareMapResponse = {
      providers,
      count: providers.length,
      moreAvailable: rows.length > limit,
      source: "ndis_provider_finder_import",
      sourceUrl: OFFICIAL_FINDER,
      importedAt: lastRun.finishedAt.toISOString(),
      staleImport:
        Date.now() - lastRun.finishedAt.getTime() > 45 * 24 * 60 * 60 * 1000,
    };
    return respond(response);
  } catch (error) {
    console.error("[care-provider-map] Directory search unavailable", error);
    return respond(
      {
        error:
          "The provider map is temporarily unavailable. Search the official NDIS Provider Finder instead.",
      },
      503,
    );
  }
}
