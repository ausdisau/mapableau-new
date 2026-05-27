import { NextResponse } from "next/server";
import { z } from "zod";

import { checkRateLimit, getClientIp } from "@/lib/api/rate-limit";
import { reverseGeocodeCoordinates } from "@/lib/geocoding/reverse-geocode-service";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;

const querySchema = z.object({
  lat: z.coerce.number().finite(),
  lng: z.coerce.number().finite(),
});

export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`geocode-reverse:${ip}`, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 },
    );
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    lat: searchParams.get("lat"),
    lng: searchParams.get("lng"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid coordinates", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await reverseGeocodeCoordinates(parsed.data.lat, parsed.data.lng);

  if (!result) {
    return NextResponse.json(
      { error: "Could not resolve location for these coordinates." },
      { status: 404 },
    );
  }

  return NextResponse.json(
    {
      postcode: result.postcode,
      suburb: result.suburb,
      state: result.state,
      displayName: result.displayName,
    },
    {
      headers: { "Cache-Control": "private, max-age=300" },
    },
  );
}
