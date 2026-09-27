import { submitEvidence } from "@/lib/digital-twin/digital-twin-service";
import { submitEvidenceSchema } from "@/lib/digital-twin/schema";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";

/**
 * POST /api/digital-twin/evidence
 * Body: placeId, featureId?, evidenceType, title, summary, confidence?, consentToPublish
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = submitEvidenceSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const evidence = submitEvidence({
    placeId: parsed.data.placeId,
    featureId: parsed.data.featureId,
    evidenceType: parsed.data.evidenceType,
    title: parsed.data.title,
    summary: parsed.data.summary,
    confidence: parsed.data.confidence,
  });

  return jsonOk(
    {
      evidence: { id: evidence.id, status: evidence.status },
      message: "Evidence submitted for moderation review.",
    },
    201
  );
}
