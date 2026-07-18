import { NextResponse } from "next/server";
import { z } from "zod";

import { isGeoscapePredictiveConfigured } from "@/lib/config/geoscape-predictive";
import { getAddress } from "@/lib/geoscape-predictive/address-search-service";
import { GeoscapePredictiveApiError } from "@/lib/geoscape-predictive/geoscape-predictive-api-error";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;

const resolveQuerySchema = z.object({
  id: z.string().trim().min(1).max(200),
});

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

  if (!isGeoscapePredictiveConfigured()) {
    return NextResponse.json(
      {
        error:
          "Geoscape street address lookup is not configured. Set GEOSCAPE_API_KEY on the server.",
        code: "GEOSCAPE_NOT_CONFIGURED",
      },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const parsed = resolveQuerySchema.safeParse({
    id: searchParams.get("id") ?? "",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid address id", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const address = await getAddress(parsed.data.id);
    return NextResponse.json(
      { address },
      {
        headers: {
          "Cache-Control": "private, max-age=60",
        },
      },
    );
  } catch (err) {
    if (err instanceof GeoscapePredictiveApiError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.httpStatus },
      );
    }
    console.error("[addresses/resolve] unexpected failure");
    return NextResponse.json(
      { error: "Could not resolve address.", code: "GEOSCAPE_UPSTREAM_ERROR" },
      { status: 502 },
    );
  }
}
