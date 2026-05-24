import { NextResponse } from "next/server";

import {
  looksLikeNaturalLanguage,
  parseNaturalLanguageQuerySafe,
} from "@/lib/search/gemini-nl-parser";
import { isNlSearchConfigured } from "@/lib/search/nl-search-config";
import { nlSearchRequestSchema } from "@/lib/search/nl-search-validation";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;

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

export async function POST(request: Request) {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = nlSearchRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { query } = parsed.data;

  if (!isNlSearchConfigured()) {
    return NextResponse.json({
      filters: {
        q: query,
        location: "",
        access: "",
        service: "",
        provider: "",
      },
      sourceQuery: query,
      parsed: false,
      configured: false,
    });
  }

  if (!looksLikeNaturalLanguage(query)) {
    return NextResponse.json({
      filters: {
        q: query,
        location: "",
        access: "",
        service: "",
        provider: "",
      },
      sourceQuery: query,
      parsed: false,
      configured: true,
    });
  }

  const { filters, parsed: wasParsed } =
    await parseNaturalLanguageQuerySafe(query);

  return NextResponse.json(
    {
      filters,
      sourceQuery: query,
      parsed: wasParsed,
      configured: true,
    },
    {
      headers: {
        "Cache-Control": "private, max-age=60",
      },
    },
  );
}
