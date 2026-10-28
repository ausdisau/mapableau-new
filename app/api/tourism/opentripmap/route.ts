import { NextRequest, NextResponse } from "next/server";

import { searchSydneyOpenTripMapPlaces, OpenTripMapUnavailable } from "@/lib/tourism/open-trip-map-server";
import type { OpenTripMapKind, OpenTripMapSearchResponse } from "@/lib/tourism/open-trip-map";

export const runtime = "nodejs";
const KINDS = new Set<OpenTripMapKind>(["interesting_places", "museums", "historic", "natural"]);

function reply(body: OpenTripMapSearchResponse, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest) {
  // External access is explicitly OFF until the organisation reviews the
  // supplier's non-commercial/free tier, ODbL duties and paid-plan costs.
  if (process.env.OPENTRIPMAP_ENABLED !== "true" || !process.env.OPENTRIPMAP_API_KEY) {
    return reply({
      status: "disabled",
      places: [],
      message: "Live OpenTripMap discovery is not configured. The six curated Sydney venues and saved demo trip remain available.",
    });
  }
  const query = (request.nextUrl.searchParams.get("q") ?? "").trim();
  const kindParam = request.nextUrl.searchParams.get("kind") ?? "interesting_places";
  if ((query.length > 0 && query.length < 3) || query.length > 80 ||
      !KINDS.has(kindParam as OpenTripMapKind)) {
    return reply({ status: "error", places: [], message: "Enter at least three characters (maximum 80) and choose a supported category." }, 400);
  }
  try {
    const places = await searchSydneyOpenTripMapPlaces({ query, kind: kindParam as OpenTripMapKind });
    return reply({ status: "live", places, retrievedAt: new Date().toISOString(),
      message: places.length
        ? "OpenTripMap tourism listings are not independently assessed for step-free access or accessible toilets."
        : "OpenTripMap returned no matching Sydney attractions. Try another search or category." });
  } catch (error) {
    const limited = error instanceof OpenTripMapUnavailable && error.kind === "rate_limit";
    return reply({
      status: "error", places: [],
      message: limited
        ? "OpenTripMap's request limit was reached. Please use the curated places while the service is unavailable."
        : "OpenTripMap could not be reached. The curated Sydney itinerary remains available.",
    }, limited ? 429 : 502);
  }
}
