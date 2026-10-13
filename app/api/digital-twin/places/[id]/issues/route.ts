import { submitIssue } from "@/lib/digital-twin/digital-twin-service";
import { submitIssueSchema } from "@/lib/digital-twin/schema";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/digital-twin/places/[id]/issues
 * Body: issueType, severity, summary, details?, dateObserved?, wantsFollowUp?, contactEmail?
 * Submissions enter pending_review — not auto-published.
 */
export async function POST(req: Request, { params }: RouteParams) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = submitIssueSchema.safeParse({ ...(body as object), placeId: id });
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const issue = submitIssue({
    placeId: parsed.data.placeId,
    featureId: parsed.data.featureId,
    issueType: parsed.data.issueType,
    severity: parsed.data.severity,
    summary: parsed.data.summary,
  });

  return jsonOk(
    {
      issue: { id: issue.id, status: issue.status },
      message: "Issue submitted for review. Urgent safety matters should be reported to emergency services or relevant authorities.",
    },
    201
  );
}
