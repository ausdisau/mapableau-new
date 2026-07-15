import { sanitiseUserContextForModel } from "@/lib/ai/privacy";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { accessibleTripFromSearchSchema } from "@/types/access-chat";

/**
 * Stub: plan accessible transport from an Access search result.
 * Returns a deep-link payload to the dashboard transport trip form.
 * Does not create a trip until the Transport flow is completed by the user.
 */
export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!checkIpRateLimit(ip, { windowMs: 60_000, max: 30 })) {
    return jsonError("Too many requests. Please wait a moment.", 429);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = accessibleTripFromSearchSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const data = parsed.data;

  const place = await prisma.accessPlace.findFirst({
    where: { id: data.placeId, status: "published" },
    include: { location: true },
  });

  if (!place) return jsonError("Place not found", 404);

  const destLat = data.destination.lat;
  const destLng = data.destination.lng;

  const profile = sanitiseUserContextForModel(
    data.userAccessProfile,
    Boolean(data.shareAccessProfile),
  );

  const params = new URLSearchParams({
    placeId: data.placeId,
    dropoffLat: String(destLat),
    dropoffLng: String(destLng),
    source: "access-chat",
  });
  if (place.addressText) params.set("dropoffAddress", place.addressText);
  if (place.suburb) params.set("dropoffSuburb", place.suburb);
  if (data.preferredEntrance) {
    params.set("preferredEntrance", data.preferredEntrance);
  }
  if (data.accessibleDropoff?.note) {
    params.set("dropoffNote", data.accessibleDropoff.note);
  }
  if (data.accessScore != null) {
    params.set("accessScore", String(data.accessScore));
  }
  if (data.confidenceScore != null) {
    params.set("confidenceScore", String(data.confidenceScore));
  }
  if (data.activeWarnings?.length) {
    params.set("warnings", data.activeWarnings.slice(0, 5).join("|"));
  }

  const planningUrl = `/dashboard/transport/new?${params.toString()}`;

  return jsonOk({
    ok: true,
    planningUrl,
    payload: {
      placeId: data.placeId,
      placeName: place.name,
      destination: { lat: destLat, lng: destLng },
      preferredEntrance: data.preferredEntrance ?? null,
      accessibleDropoff: data.accessibleDropoff ?? null,
      activeWarnings: data.activeWarnings ?? [],
      accessScore: data.accessScore ?? null,
      confidenceScore: data.confidenceScore ?? null,
      userAccessProfile: profile ?? null,
      stub: true,
      note: "Transport trip is not created yet — complete planning in the Transport form.",
    },
  });
}

/** GET helper: deep-link info for placeId query (chat card links). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const placeId = url.searchParams.get("placeId");
  if (!placeId) return jsonError("placeId is required", 400);

  const place = await prisma.accessPlace.findFirst({
    where: { id: placeId, status: "published" },
    include: { location: true },
  });
  if (!place?.location) {
    return jsonOk({
      ok: true,
      planningUrl: "#transport-coming-soon",
      payload: { placeId, stub: true },
    });
  }

  const params = new URLSearchParams({
    placeId,
    dropoffLat: String(place.location.latitude),
    dropoffLng: String(place.location.longitude),
    source: "access-chat",
  });
  if (place.suburb) params.set("dropoffSuburb", place.suburb);

  return jsonOk({
    ok: true,
    planningUrl: `/dashboard/transport/new?${params.toString()}`,
    payload: {
      placeId,
      placeName: place.name,
      destination: {
        lat: place.location.latitude,
        lng: place.location.longitude,
      },
      stub: true,
    },
  });
}
