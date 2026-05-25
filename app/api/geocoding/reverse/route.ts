import { NextResponse } from "next/server";

import { reverseGeocodeQuerySchema } from "@/lib/geocoding/geocoding-validation";
import { isMapboxGeocodingEnabled } from "@/lib/geocoding/mapbox-config";
import { mapboxReverseGeocode } from "@/lib/geocoding/mapbox-geocoding";
import {
  checkRequestRateLimit,
  getClientIp,
} from "@/lib/geocoding/request-rate-limit";
import { reverseGeocode as nominatimReverseGeocode } from "@/lib/geo";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;

export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (!checkRequestRateLimit(ip, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 },
    );
  }

  const { searchParams } = new URL(request.url);
  const parsed = reverseGeocodeQuerySchema.safeParse({
    lat: searchParams.get("lat") ?? "",
    lng: searchParams.get("lng") ?? "",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid coordinates", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { lat, lng } = parsed.data;

  try {
    if (isMapboxGeocodingEnabled()) {
      const result = await mapboxReverseGeocode(lat, lng);
      return NextResponse.json(
        { result, provider: "mapbox" },
        { headers: { "Cache-Control": "private, max-age=300" } },
      );
    }

    const result = await nominatimReverseGeocode(lat, lng);
    return NextResponse.json(
      { result, provider: "nominatim" },
      { headers: { "Cache-Control": "private, max-age=300" } },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Reverse geocoding failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
