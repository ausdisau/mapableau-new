import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { rejectInvoice } from "@/lib/abilitypay/approval-service";
import { requireAbilityPayPermission } from "@/lib/abilitypay/api-helpers";
import { canViewInvoice } from "@/lib/abilitypay/policy";
import { rejectSchema } from "@/types/abilitypay";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, context: RouteContext) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const denied = requireAbilityPayPermission(user, "abilitypay:invoice:approve");
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

  const parsed = rejectSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const result = await rejectInvoice({
      invoiceId: id,
      actorUserId: user.id,
      actorRole: user.primaryRole,
      notes: parsed.data.notes,
    });
    return jsonOk(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Rejection failed";
    if (message === "HUMAN_APPROVAL_REQUIRED") {
      return jsonError("Only a human participant, nominee, or plan manager can reject", 403);
    }
    return jsonError(message, 400);
  }
}
