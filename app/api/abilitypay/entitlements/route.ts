import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  canExportClaimPack,
  canUseAiAssist,
  getExportQuota,
  getRemainingExports,
} from "@/lib/abilitypay/entitlements";
import { hasActivePlan } from "@/lib/billing-core/entitlements";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const [quota, remaining, exportGate, aiAssist, hasPro] = await Promise.all([
    getExportQuota(user.id),
    getRemainingExports(user.id),
    canExportClaimPack(user.id),
    canUseAiAssist(user.id),
    hasActivePlan(user.id, "plan_manager_pro"),
  ]);

  return jsonOk({
    quota,
    remainingExports: remaining,
    canExport: exportGate.allowed,
    canUseAiAssist: aiAssist,
    hasPlanManagerPro: hasPro,
  });
}
