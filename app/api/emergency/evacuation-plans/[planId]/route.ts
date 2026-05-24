import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getEvacuationPlan } from "@/lib/emergency/evacuation-service";

type Params = { params: Promise<{ planId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const user = await requireApiPermission("emergency:read:self");
  if (user instanceof Response) return user;
  const { planId } = await params;
  const plan = await getEvacuationPlan(planId, user.id);
  if (!plan) return jsonError("Not found", 404);
  return jsonOk({ plan });
}
