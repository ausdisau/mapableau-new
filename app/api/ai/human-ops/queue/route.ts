import {
  filterQueueForOperator,
  formatQueueRowForOperator,
  humanOpsQueueQuerySchema,
  listHumanOpsQueue,
  listReadableCategories,
  resolveHumanOpsOperatorContext,
} from "@/lib/ai/platform/human-operations";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isHumanOperationsConsoleEnabled } from "@/lib/config/human-operations";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!isHumanOperationsConsoleEnabled()) {
    return jsonError("HUMAN_OPERATIONS_CONSOLE_DISABLED", 403);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const raw = {
    status: url.searchParams.getAll("status").length
      ? url.searchParams.getAll("status")
      : undefined,
    category: url.searchParams.getAll("category").length
      ? url.searchParams.getAll("category")
      : undefined,
    missionId: url.searchParams.get("missionId") ?? undefined,
    participantId: url.searchParams.get("participantId") ?? undefined,
    assignedTo: url.searchParams.get("assignedTo") ?? undefined,
    priority: url.searchParams.getAll("priority").length
      ? url.searchParams.getAll("priority")
      : undefined,
  };

  const parsed = humanOpsQueueQuerySchema.safeParse(raw);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const operator = await resolveHumanOpsOperatorContext(user);
  if (operator.tenantIds.length === 0) {
    return jsonOk({
      items: [],
      total: 0,
      readableCategories: listReadableCategories(operator),
      a11y: {
        note: "No tenant memberships — queue empty by isolation policy.",
      },
    });
  }

  const all = listHumanOpsQueue(parsed.data);
  const visible = filterQueueForOperator(all, operator);

  return jsonOk({
    items: visible.map(formatQueueRowForOperator),
    total: visible.length,
    readableCategories: listReadableCategories(operator),
  });
}
