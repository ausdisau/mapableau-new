import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { requireAbilityPayPermission } from "@/lib/abilitypay/api-helpers";
import { addBudgetCategory } from "@/lib/abilitypay/plan-service";
import { createBudgetCategorySchema } from "@/types/abilitypay";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, context: RouteContext) {
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

  const parsed = createBudgetCategorySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const category = await addBudgetCategory(id, user.id, parsed.data);
  return jsonOk({ category }, 201);
}
