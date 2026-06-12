import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { requireAbilityPayAccess, requireAbilityPayPermission } from "@/lib/abilitypay/api-helpers";
import {
  getPlanById,
  getPlanWalletSummary,
  updatePlan,
} from "@/lib/abilitypay/plan-service";
import { updatePlanSchema } from "@/types/abilitypay";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const denied = requireAbilityPayAccess(user);
  if (denied) return denied;

  const { id } = await context.params;
  const plan = await getPlanById(id);
  if (!plan) return jsonError("Plan not found", 404);

  const wallet = await getPlanWalletSummary(id);
  return jsonOk({ plan, wallet });
}

export async function PATCH(req: Request, context: RouteContext) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const denied = requireAbilityPayPermission(user, "abilitypay:plan:manage");
  if (denied) return denied;

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = updatePlanSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const plan = await updatePlan(id, user.id, parsed.data);
  return jsonOk({ plan });
}
