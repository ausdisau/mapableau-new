import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  countPendingAgentReviews,
  listUnifiedAgentAudit,
} from "@/lib/agent-ops/unified-audit-service";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (user.primaryRole !== "mapable_admin") {
    return jsonError("Forbidden", 403);
  }

  const url = new URL(req.url);
  const requiresReview = url.searchParams.get("requiresReview") === "true";

  const [runs, pendingCount] = await Promise.all([
    listUnifiedAgentAudit({ requiresReview, limit: 50 }),
    countPendingAgentReviews(),
  ]);

  return jsonOk({ runs, pendingCount });
}
