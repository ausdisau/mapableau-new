import { runCompatibilityCheck } from "@/lib/digital-twin/digital-twin-service";
import { compatibilityRequestSchema } from "@/lib/digital-twin/schema";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";

/**
 * POST /api/digital-twin/compatibility
 * Body: { placeId, profileId?, manualNeeds? }
 * Does not persist profile data.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = compatibilityRequestSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const result = runCompatibilityCheck(parsed.data);
  if (!result) return jsonError("Place or profile not found", 404);

  return jsonOk({ result });
}
