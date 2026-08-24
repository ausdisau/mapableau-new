import {
  assertCanViewReview,
  formatReviewForOperator,
  formatReviewForParticipant,
  getHumanOpsReview,
  listHumanOpsAuditForReview,
  patchHumanOpsReview,
  patchHumanOpsReviewSchema,
  resolveHumanOpsOperatorContext,
} from "@/lib/ai/platform/human-operations";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isHumanOperationsConsoleEnabled } from "@/lib/config/human-operations";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ reviewId: string }> };

export async function GET(_req: Request, context: RouteContext) {
  if (!isHumanOperationsConsoleEnabled()) {
    return jsonError("HUMAN_OPERATIONS_CONSOLE_DISABLED", 403);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { reviewId } = await context.params;
  const item = getHumanOpsReview(reviewId);
  if (!item) return jsonError("REVIEW_NOT_FOUND", 404);

  if (user.id === item.participantId) {
    return jsonOk({
      view: "participant",
      review: formatReviewForParticipant(item),
    });
  }

  const operator = await resolveHumanOpsOperatorContext(user);
  const gate = assertCanViewReview(operator, item);
  if (!gate.ok) return jsonError(gate.reason, 403);

  return jsonOk({
    view: "operator",
    review: formatReviewForOperator(item),
    audit: listHumanOpsAuditForReview(item.reviewId),
  });
}

export async function PATCH(req: Request, context: RouteContext) {
  if (!isHumanOperationsConsoleEnabled()) {
    return jsonError("HUMAN_OPERATIONS_CONSOLE_DISABLED", 403);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { reviewId } = await context.params;
  const body = await req.json().catch(() => null);
  const parsed = patchHumanOpsReviewSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const operator = await resolveHumanOpsOperatorContext(user);
  const result = patchHumanOpsReview({
    reviewId,
    operator,
    ...parsed.data,
  });
  if (!result.ok) {
    const status =
      result.reason === "NOT_FOUND"
        ? 404
        : result.reason === "TENANT_ISOLATION" ||
            result.reason === "CATEGORY_FORBIDDEN" ||
            result.reason === "WRITE_FORBIDDEN"
          ? 403
          : 400;
    return jsonError(result.reason, status);
  }
  return jsonOk({ review: formatReviewForOperator(result.item) });
}
