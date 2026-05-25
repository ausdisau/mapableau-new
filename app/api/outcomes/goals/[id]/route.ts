import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getOutcomeGoal } from "@/lib/outcomes/outcome-goal-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;
  try {
    const goal = await getOutcomeGoal(id, user);
    if (!goal) return jsonError("Not found", 404);
    return jsonOk({ goal });
  } catch {
    return jsonError("Forbidden", 403);
  }
}
