import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { requireAbilityPayAccess } from "@/lib/abilitypay/api-helpers";
import { getInvoiceById, updateInvoice } from "@/lib/abilitypay/invoice-service";
import { canViewInvoice } from "@/lib/abilitypay/policy";
import { updateInvoiceSchema } from "@/types/abilitypay";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const denied = requireAbilityPayAccess(user);
  if (denied) return denied;

  const { id } = await context.params;
  if (!(await canViewInvoice(user, id))) {
    return jsonError("Invoice not found", 404);
  }

  const invoice = await getInvoiceById(id);
  if (!invoice) return jsonError("Invoice not found", 404);

  return jsonOk({ invoice });
}

export async function PATCH(req: Request, context: RouteContext) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const denied = requireAbilityPayAccess(user);
  if (denied) return denied;

  const { id } = await context.params;
  if (!(await canViewInvoice(user, id))) {
    return jsonError("Invoice not found", 404);
  }

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = updateInvoiceSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const invoice = await updateInvoice(id, user.id, parsed.data);
  return jsonOk({ invoice });
}
