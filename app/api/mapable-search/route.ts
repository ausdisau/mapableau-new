import { z } from "zod";

import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { searchMapAble } from "@/lib/search/mapable-search-service";

export const runtime = "nodejs";

const schema = z.object({
  q: z.string().trim().max(180).default(""),
  vertical: z
    .enum(["all", "places", "providers", "care", "transport", "jobs"])
    .default("all"),
  state: z.enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"]).optional(),
  postcode: z.string().regex(/^\d{4}$/).optional(),
});

export async function GET(request: Request) {
  const ip = getClientIp(request);
  // Existing process-local limiter is a preview-only defence. Production
  // exposure requires distributed ingress limiting and monitoring.
  if (!checkIpRateLimit(`mapable-search:${ip}`, { windowMs: 60_000, max: 30 })) {
    return Response.json({ error: "Search rate limit reached." }, { status: 429 });
  }
  const params = new URL(request.url).searchParams;
  const parsed = schema.safeParse({
    q: params.get("q") ?? "",
    vertical: params.get("vertical") ?? "all",
    state: params.get("state") || undefined,
    postcode: params.get("postcode") || undefined,
  });
  if (!parsed.success) {
    return Response.json({ error: "Invalid search filters." }, { status: 400 });
  }

  const response = await searchMapAble(parsed.data);
  return Response.json(response, {
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
