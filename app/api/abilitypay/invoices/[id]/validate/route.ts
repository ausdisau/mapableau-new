import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireAbilityPayAccess } from "@/lib/abilitypay/api-helpers";
import { validateAbilityPayInvoice } from "@/lib/abilitypay/invoice-validation-service";
import { canViewInvoice } from "@/lib/abilitypay/policy";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_req: Request, context: RouteContext) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const denied = requireAbilityPayAccess(user);
  if (denied) return denied;

  const { id } = await context.params;
  if (!(await canViewInvoice(user, id))) {
    return jsonError("Invoice not found", 404);
  }

  const result = await validateAbilityPayInvoice(id, user.id);
  return jsonOk({ validation: result });
}
