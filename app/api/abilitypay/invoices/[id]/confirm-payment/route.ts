import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireAbilityPayPermission } from "@/lib/abilitypay/api-helpers";
import { confirmPlanManagedPayment } from "@/lib/abilitypay/plan-manager-adapter-service";
import { canViewInvoice } from "@/lib/abilitypay/policy";
import { z } from "zod";

const bodySchema = z.object({
  notes: z.string().max(2000).optional(),
});

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

  let body: z.infer<typeof bodySchema> = {};
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return jsonError("Invalid request body", 400);
  }

  try {
    const result = await confirmPlanManagedPayment({
      invoiceId: id,
      actorUserId: user.id,
      actorRole: user.primaryRole,
      notes: body.notes,
    });
    return jsonOk(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Confirm failed";
    const status =
      message === "PLAN_MANAGER_REQUIRED"
        ? 403
        : message === "NOT_PLAN_MANAGED" ||
            message === "INVALID_STATUS" ||
            message === "ALREADY_PAID"
          ? 400
          : 404;
    return jsonError(message, status);
  }
}
