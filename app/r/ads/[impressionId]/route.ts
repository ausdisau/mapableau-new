import { NextResponse } from "next/server";

import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { resolveClickRedirect } from "@/lib/ads/services/measurement";

type RouteContext = {
  params: Promise<{ impressionId: string }>;
};

/**
 * Controlled advertising click redirect.
 * Validates destination server-side; never trust client-supplied URLs.
 */
export async function GET(request: Request, context: RouteContext) {
  const ip = getClientIp(request);
  if (!checkIpRateLimit(`ads:redirect:${ip}`, { windowMs: 60_000, max: 60 })) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { impressionId } = await context.params;
  if (!impressionId || impressionId.length > 128) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const result = await resolveClickRedirect(impressionId);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 404 });
  }

  return NextResponse.redirect(result.redirectUrl, {
    status: 302,
    headers: {
      "Referrer-Policy": "no-referrer",
    },
  });
}
