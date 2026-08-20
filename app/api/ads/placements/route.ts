import { z } from "zod";

import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isPlacementCode } from "@/lib/ads/placement-registry";
import { resolveAdPlacement } from "@/lib/ads/services/resolve-placement";

const querySchema = z.object({
  surface: z.enum(["access", "provider_finder"]),
  placement: z.string().min(1),
  bbox: z.string().optional(),
  zoom: z.coerce.number().min(0).max(22).optional(),
  category: z.string().max(64).optional(),
  region: z.string().max(64).optional(),
  consent: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});

function parseBbox(
  raw: string | undefined,
): [number, number, number, number] | undefined {
  if (!raw) return undefined;
  const parts = raw.split(",").map((p) => Number.parseFloat(p.trim()));
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) {
    return undefined;
  }
  return parts as [number, number, number, number];
}

export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (!checkIpRateLimit(`ads:placements:${ip}`, { windowMs: 60_000, max: 60 })) {
    return jsonError("Rate limit exceeded", 429);
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    surface: url.searchParams.get("surface"),
    placement: url.searchParams.get("placement"),
    bbox: url.searchParams.get("bbox") ?? undefined,
    zoom: url.searchParams.get("zoom") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
    region: url.searchParams.get("region") ?? undefined,
    consent: url.searchParams.get("consent") ?? undefined,
  });

  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  if (!isPlacementCode(parsed.data.placement)) {
    return jsonError("Unknown placement", 400);
  }

  const bbox = parseBbox(parsed.data.bbox);
  if (parsed.data.bbox && !bbox) {
    return jsonError("Invalid bbox", 400);
  }

  const fill = await resolveAdPlacement({
    placement: parsed.data.placement,
    surface: parsed.data.surface,
    bbox,
    zoom: parsed.data.zoom,
    category: parsed.data.category,
    regionCode: parsed.data.region,
    consentForPersonalisedAds: parsed.data.consent ?? false,
  });

  return jsonOk({ fill });
}
