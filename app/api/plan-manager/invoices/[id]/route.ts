import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { accessDeniedMessage } from "@/lib/access/role-policy";
import { getInvoiceForPlanManager } from "@/lib/plan-manager/plan-manager-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("plan_manager:portal");
  if (user instanceof Response) return user;

  const { id } = await params;

  try {
    const data = await getInvoiceForPlanManager({
      invoiceId: id,
      planManagerId: user.id,
      actorRole: user.primaryRole,
    });
    return jsonOk(data);
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "CONSENT_REQUIRED") {
        return jsonError(accessDeniedMessage("no_link"), 403);
      }
      if (e.message === "NOT_FOUND") {
        return jsonError(accessDeniedMessage("not_found"), 404);
      }
    }
    return jsonError("Could not load invoice", 400);
  }
}
