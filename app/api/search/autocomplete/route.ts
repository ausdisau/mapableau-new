import { NextRequest, NextResponse } from "next/server";

import { applyWixCorsToResponse } from "@/lib/integrations/wix/cors";
import { searchAutocomplete } from "@/lib/search/autocomplete-service";
import { autocompleteQuerySchema } from "@/lib/search/autocomplete-validation";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 120;

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

function withWixCors(request: NextRequest, response: NextResponse) {
  return applyWixCorsToResponse(request, response);
}

export async function GET(request: NextRequest | Request) {
  const req =
    request instanceof NextRequest ? request : new NextRequest(request);
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous";

  if (!checkRateLimit(ip)) {
    return withWixCors(
      req,
      NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 },
      ),
    );
  }

  const { searchParams } = new URL(req.url);
  const parsed = autocompleteQuerySchema.safeParse({
    q: searchParams.get("q") ?? "",
    context: searchParams.get("context") ?? "",
    field: searchParams.get("field") ?? "all",
  });

  if (!parsed.success) {
    return withWixCors(
      req,
      NextResponse.json(
        { error: "Invalid query", details: parsed.error.flatten() },
        { status: 400 },
      ),
    );
  }

  const groups = await searchAutocomplete({
    query: parsed.data.q,
    context: parsed.data.context,
    field: parsed.data.field,
  });

  return withWixCors(
    req,
    NextResponse.json(
      { groups },
      {
        headers: {
          "Cache-Control": "private, max-age=30",
        },
      },
    ),
  );
}

export async function OPTIONS(request: NextRequest | Request) {
  const req =
    request instanceof NextRequest ? request : new NextRequest(request);
  return withWixCors(req, new NextResponse(null, { status: 204 }));
}
