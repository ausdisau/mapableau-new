import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getRehabPlanForParticipant } from "@/lib/moves/rehab-plan-service";

type Params = { params: Promise<{ planId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const user = await requireApiPermission("care:manage:self");
  if (user instanceof Response) return user;
  const { planId } = await params;
  const plan = await getRehabPlanForParticipant(planId, user.id);
  if (!plan) return jsonError("Not found", 404);
  return jsonOk({ plan });
}
