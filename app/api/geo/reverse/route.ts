import { NextResponse } from "next/server";

import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { reverseGeocodeCoordinates } from "@/lib/map/nominatim-server";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;

function parseCoordinate(value: string | null, min: number, max: number): number | null {
  if (value == null || value.trim() === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return null;
  return parsed;
}

export async function GET(req: Request) {
  const ip = getClientIp(req);
  if (
    !checkIpRateLimit(`geo-reverse:${ip}`, {
      windowMs: RATE_LIMIT_WINDOW_MS,
      max: RATE_LIMIT_MAX,
    })
  ) {
    return NextResponse.json(
      { error: "Too many location lookups. Please wait a moment and try again." },
      { status: 429 },
    );
  }

  const { searchParams } = new URL(req.url);
  const lat = parseCoordinate(searchParams.get("lat"), -90, 90);
  const lng = parseCoordinate(searchParams.get("lng"), -180, 180);

  if (lat == null || lng == null) {
    return NextResponse.json(
      { error: "Valid lat and lng query parameters are required." },
      { status: 400 },
    );
  }

  try {
    const result = await reverseGeocodeCoordinates(lat, lng);
    if (!result) {
      return NextResponse.json(
        { error: "Could not look up a postcode for this location." },
        { status: 502 },
      );
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Location lookup failed. Please try again." },
      { status: 502 },
    );
  }
}
