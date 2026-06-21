import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { listPendingApprovals } from "@/lib/abilitypay/invoice-service";
import { requireAbilityPayPermission } from "@/lib/abilitypay/api-helpers";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const denied = requireAbilityPayPermission(user, "abilitypay:invoice:approve");
  if (denied) return denied;

  const invoices = await listPendingApprovals(user.id);
  return jsonOk({ invoices });
}
