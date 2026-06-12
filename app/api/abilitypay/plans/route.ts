import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { requireAbilityPayAccess, requireAbilityPayPermission } from "@/lib/abilitypay/api-helpers";
import { createPlan, listPlansForUser } from "@/lib/abilitypay/plan-service";
import { createPlanSchema } from "@/types/abilitypay";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const denied = requireAbilityPayAccess(user);
  if (denied) return denied;

  const plans = await listPlansForUser(user.id, user.primaryRole);
  return jsonOk({ plans });
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const denied = requireAbilityPayPermission(user, "abilitypay:plan:manage");
  if (denied) return denied;

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = createPlanSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const plan = await createPlan(user.id, parsed.data);
  return jsonOk({ plan }, 201);
}
