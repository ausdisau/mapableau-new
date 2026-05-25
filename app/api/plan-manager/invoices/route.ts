import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { listPlanManagerInvoices } from "@/lib/plan-manager/plan-manager-service";

export async function GET() {
  const user = await requireApiPermission("plan_manager:portal");
  if (user instanceof Response) return user;

  const invoices = await listPlanManagerInvoices({
    planManagerId: user.id,
    actorRole: user.primaryRole,
  });
  return jsonOk({ invoices });
}
