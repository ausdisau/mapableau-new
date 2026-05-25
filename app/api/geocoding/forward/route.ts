import { NextResponse } from "next/server";

import { forwardGeocodeQuerySchema } from "@/lib/geocoding/geocoding-validation";
import { isMapboxGeocodingEnabled } from "@/lib/geocoding/mapbox-config";
import { mapboxForwardGeocode } from "@/lib/geocoding/mapbox-geocoding";
import {
  checkRequestRateLimit,
  getClientIp,
} from "@/lib/geocoding/request-rate-limit";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;

export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (!checkRequestRateLimit(ip, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 },
    );
  }

  if (!isMapboxGeocodingEnabled()) {
    return NextResponse.json(
      { error: "Mapbox geocoding is not configured" },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const parsed = forwardGeocodeQuerySchema.safeParse({
    q: searchParams.get("q") ?? "",
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const places = await mapboxForwardGeocode(parsed.data.q, parsed.data.limit);
    return NextResponse.json(
      { places },
      { headers: { "Cache-Control": "private, max-age=60" } },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Geocoding failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
