import {
  getPlaceById,
  patchPlace,
} from "@/lib/digital-twin/digital-twin-service";
import { patchTwinPlaceSchema } from "@/lib/digital-twin/schema";
import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/digital-twin/places/[id]
 * Returns full place bundle (public demo data).
 */
export async function GET(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const bundle = getPlaceById(id);
  if (!bundle) return jsonError("Place not found", 404);
  return jsonOk({ bundle });
}

/**
 * PATCH /api/digital-twin/places/[id]
 * Requires session. Updates place metadata.
 */
export async function PATCH(req: Request, { params }: RouteParams) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await params;
  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = patchTwinPlaceSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const place = patchPlace(id, parsed.data);
  if (!place) return jsonError("Place not found", 404);
  return jsonOk({ place });
}
