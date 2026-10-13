import { listPlaces, createPlace } from "@/lib/digital-twin/digital-twin-service";
import { createTwinPlaceSchema, twinPlaceFilterSchema } from "@/lib/digital-twin/schema";
import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";

/**
 * GET /api/digital-twin/places
 * Query: placeType, minTier, hasAccessibleToilet, stepFreeEntrance, quietSpace, transportConnection
 *
 * Response: { places: TwinPlaceBundle[] }
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const parsed = twinPlaceFilterSchema.safeParse(params);
  const filters = parsed.success ? parsed.data : undefined;

  const bundles = listPlaces(filters);
  return jsonOk({
    places: bundles.map((b) => ({
      ...b.place,
      tier: b.assessment.tier,
      topStrengths: b.features
        .filter((f) => f.accessibilityLevel === "gold" || f.accessibilityLevel === "silver")
        .slice(0, 3)
        .map((f) => f.name),
      topBarriers: b.issues.filter((i) => i.status === "open").slice(0, 3).map((i) => i.summary),
    })),
  });
}

/**
 * POST /api/digital-twin/places
 * Body: createTwinPlaceSchema
 * Requires session. Creates draft place in in-memory store.
 */
export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = createTwinPlaceSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const place = createPlace(parsed.data);
  return jsonOk({ place: { id: place.id, slug: place.slug, status: place.status } }, 201);
}
