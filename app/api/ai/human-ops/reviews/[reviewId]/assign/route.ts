import {
  assignHumanOpsReview,
  assignHumanOpsReviewSchema,
  formatReviewForOperator,
  resolveHumanOpsOperatorContext,
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
  const parsed = assignHumanOpsReviewSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const operator = await resolveHumanOpsOperatorContext(user);
  const result = assignHumanOpsReview({
    reviewId,
    operator,
    assigneeId: parsed.data.assigneeId,
    note: parsed.data.note,
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
