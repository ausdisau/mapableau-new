import { z } from "zod";

import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import {
  isCapabilityEnabled,
  supportIntelligenceFlags,
} from "@/lib/support-intelligence/config/feature-flags";
import { checkDistributedRateLimit } from "@/lib/support-intelligence/rate-limit";
import { runSpiderDiscovery } from "@/lib/support-intelligence/spider/orchestrator";

export const runtime = "nodejs";

const schema = z.object({
  cursor: z.string().max(64).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  includeFixtures: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});

/**
 * GET /api/support-intelligence/discover
 * API-first provider discovery page (flag-gated, fail-closed).
 */
export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (!checkIpRateLimit(`si-discover:${ip}`, { windowMs: 60_000, max: 20 })) {
    return Response.json({ error: "Rate limit reached." }, { status: 429 });
  }

  if (!isCapabilityEnabled("spider")) {
    return Response.json(
      {
        ok: false,
        reasonCode: supportIntelligenceFlags.killSwitch
          ? "kill_switch"
          : "feature_flag_disabled",
        message: "MapAble Spider is disabled (fail-closed).",
      },
      { status: 403 },
    );
  }

  const distributed = await checkDistributedRateLimit(`si-discover:${ip}`, {
    windowMs: 60_000,
    max: 20,
  });
  if (!distributed.allowed) {
    return Response.json({ error: "Rate limit reached." }, { status: 429 });
  }

  const params = new URL(request.url).searchParams;
  const parsed = schema.safeParse({
    cursor: params.get("cursor") || undefined,
    limit: params.get("limit") || undefined,
    includeFixtures: params.get("includeFixtures") || undefined,
  });
  if (!parsed.success) {
    return Response.json({ error: "Invalid discover filters." }, { status: 400 });
  }

  const result = await runSpiderDiscovery({
    cursor: parsed.data.cursor,
    limit: parsed.data.limit,
    includeFixtures: parsed.data.includeFixtures === true,
  });

  return Response.json(result, {
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-SI-RateLimit-Backend": distributed.backend,
    },
  });
}
