import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireAbilityPayPermission } from "@/lib/abilitypay/api-helpers";
import {
  getReconciliationSummary,
  listPaymentAttemptsForUser,
} from "@/lib/abilitypay/reconciliation-service";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const denied = requireAbilityPayPermission(user, "abilitypay:audit:read");
  if (denied) return denied;

  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? undefined;
  const adapter = url.searchParams.get("adapter") ?? undefined;

  const [attempts, summary] = await Promise.all([
    listPaymentAttemptsForUser(user.id, user.primaryRole, { status, adapter }),
    getReconciliationSummary(user.primaryRole),
  ]);

  return jsonOk({ attempts, summary });
}
