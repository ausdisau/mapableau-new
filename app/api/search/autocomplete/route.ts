import { NextResponse } from "next/server";

import { searchAutocomplete } from "@/lib/search/autocomplete-service";
import { warmOutletAutocompleteIndex } from "@/lib/search/outlet-autocomplete-index";
import { autocompleteQuerySchema } from "@/lib/search/autocomplete-validation";

warmOutletAutocompleteIndex();

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

  const { searchParams } = new URL(request.url);
  const parsed = autocompleteQuerySchema.safeParse({
    q: searchParams.get("q") ?? "",
    context: searchParams.get("context") ?? "",
    field: searchParams.get("field") ?? "all",
    predictive: searchParams.get("predictive") ?? "false",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const groups = await searchAutocomplete({
    query: parsed.data.q,
    context: parsed.data.context,
    field: parsed.data.field,
    predictive: parsed.data.predictive,
  });

  return NextResponse.json(
    { groups },
    {
      headers: {
        "Cache-Control": "private, max-age=30",
      },
    },
  );
}
