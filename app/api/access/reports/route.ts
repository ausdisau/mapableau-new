import { createContentReport } from "@/lib/access-moderation/report-handling-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { accessibilityReviewsV1Enabled } from "@/lib/config/accessibility-reviews";
import { contentReportSchema } from "@/lib/validation/access-review";

export async function POST(req: Request) {
  if (!accessibilityReviewsV1Enabled) {
    return jsonError("Accessibility reviews are not enabled", 404);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = contentReportSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const result = await createContentReport({
    entityType: parsed.data.entityType,
    entityId: parsed.data.entityId,
    reporterId: user.id,
    reason: parsed.data.reason,
    details: parsed.data.details,
  });

  // Never return moderation notes or reporter-identifying internals beyond public state.
  return jsonOk(
    {
      report: {
        id: result.id,
        publicState: result.publicState,
      },
    },
    201
  );
}
