import { z } from "zod";

import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import {
  aggregateSupportDemand,
  SYNTHETIC_DEMAND_ROWS,
} from "@/lib/support-intelligence/demand/aggregates";

export const runtime = "nodejs";

const schema = z.object({
  useSynthetic: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  k: z.coerce.number().int().min(2).max(50).optional(),
});

/** GET /api/support-intelligence/demand — aggregate unmet-need cells only. */
export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (!checkIpRateLimit(`si-demand:${ip}`, { windowMs: 60_000, max: 20 })) {
    return Response.json({ error: "Rate limit reached." }, { status: 429 });
  }

  const params = new URL(request.url).searchParams;
  const parsed = schema.safeParse({
    useSynthetic: params.get("useSynthetic") || undefined,
    k: params.get("k") || undefined,
  });
  if (!parsed.success) {
    return Response.json({ error: "Invalid demand query." }, { status: 400 });
  }

  const rows =
    parsed.data.useSynthetic === true ? SYNTHETIC_DEMAND_ROWS : [];

  const result = aggregateSupportDemand({
    rows,
    kAnonymityThreshold: parsed.data.k,
  });

  return Response.json(result, {
    status: result.ok ? 200 : 403,
    headers: { "Cache-Control": "no-store" },
  });
}
