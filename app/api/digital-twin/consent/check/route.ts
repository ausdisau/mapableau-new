import { checkDemoConsent } from "@/lib/digital-twin/access-pass";
import { consentCheckSchema } from "@/lib/digital-twin/schema";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";

/**
 * POST /api/digital-twin/consent/check
 * Evaluates demo consent grants only — no real profile data returned.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = consentCheckSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const result = checkDemoConsent(parsed.data);
  return jsonOk({
    allowed: result.allowed,
    sharedCategories: result.sharedCategories,
    message: result.message,
  });
}
