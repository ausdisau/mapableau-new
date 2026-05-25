import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { listPlanManagerFoodInvoices } from "@/lib/foods/plan-manager-service";

export async function GET() {
  const user = await requireApiPermission("foods:invoice:read");
  if (user instanceof Response) return user;
  const invoices = await listPlanManagerFoodInvoices(user);
  return jsonOk({ invoices });
}
