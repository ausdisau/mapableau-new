import { NextResponse } from "next/server";

import { isAuspostPacConfigured } from "@/lib/config/auspost-pac";
import { handleAuspostPacRouteError } from "@/lib/auspost-pac/route-handler";
import { searchPostcodes } from "@/lib/auspost-pac/postcode-search-service";
import { postcodeSearchQuerySchema } from "@/lib/validation/auspost-pac-schemas";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

export async function GET(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "anonymous";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 },
    );
  }

  if (!isAuspostPacConfigured()) {
    return NextResponse.json(
      {
        error: "Australia Post lookup is not configured.",
        code: "AUSPOST_PAC_NOT_CONFIGURED",
        configured: false,
      },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const parsed = postcodeSearchQuerySchema.safeParse({
    q: searchParams.get("q") ?? "",
    state: searchParams.get("state") ?? undefined,
    excludePostBox: searchParams.get("excludePostBox") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await searchPostcodes({
      q: parsed.data.q,
      state: parsed.data.state,
      excludePostBox: parsed.data.excludePostBox ?? true,
    });
    return NextResponse.json(
      { ...result, configured: true },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (e) {
    return handleAuspostPacRouteError(e);
  }
}
