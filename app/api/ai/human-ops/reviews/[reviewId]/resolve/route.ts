import {
  formatReviewForOperator,
  resolveHumanOpsOperatorContext,
  resolveHumanOpsReview,
  resolveHumanOpsReviewSchema,
} from "@/lib/ai/platform/human-operations";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isHumanOperationsConsoleEnabled } from "@/lib/config/human-operations";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ reviewId: string }> };

export async function POST(req: Request, context: RouteContext) {
  if (!isHumanOperationsConsoleEnabled()) {
    return jsonError("HUMAN_OPERATIONS_CONSOLE_DISABLED", 403);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { reviewId } = await context.params;
  const body = await req.json().catch(() => null);
  const parsed = resolveHumanOpsReviewSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const operator = await resolveHumanOpsOperatorContext(user);
  const result = resolveHumanOpsReview({
    reviewId,
    operator,
    resolution: parsed.data.resolution,
    resolutionReason: parsed.data.resolutionReason,
    evidenceRefsUsed: parsed.data.evidenceRefsUsed,
    decidedUnderAuthority: parsed.data.decidedUnderAuthority,
    participantApprovalBypassed: false,
    delegateAuthorityId: parsed.data.delegateAuthorityId,
    nextStepsPrepared: parsed.data.nextStepsPrepared,
    internalNote: parsed.data.internalNote,
    generatedByModel: false,
  });
  if (!result.ok) {
    const status =
      result.reason === "NOT_FOUND"
        ? 404
        : result.reason === "TENANT_ISOLATION" ||
            result.reason === "CATEGORY_FORBIDDEN" ||
            result.reason === "WRITE_FORBIDDEN" ||
            result.reason === "MODEL_SAFEGUARDING_DECISION_FORBIDDEN" ||
            result.reason === "SAFEGUARDING_RESOLUTION_FORBIDDEN"
          ? 403
          : 400;
    return jsonError(result.reason, status);
  }
  return jsonOk({
    review: formatReviewForOperator(result.item),
    note: "Resolution recorded. Prepared next steps are not executed by this endpoint.",
  });
}
