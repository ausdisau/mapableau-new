import {
  hasActivePlan,
  PLAN_MANAGER_EXPORT_QUOTA_FREE,
  PLAN_MANAGER_EXPORT_QUOTA_PRO,
} from "@/lib/billing-core/entitlements";
import { countUsageInPeriod } from "@/lib/usage/usage-ledger";

function monthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function getExportQuota(userId: string) {
  const hasPro = await hasActivePlan(userId, "plan_manager_pro");
  return hasPro ? PLAN_MANAGER_EXPORT_QUOTA_PRO : PLAN_MANAGER_EXPORT_QUOTA_FREE;
}

export async function getRemainingExports(userId: string) {
  const quota = await getExportQuota(userId);
  const used = await countUsageInPeriod({
    category: "export",
    eventType: "abilitypay.claim_pack",
    userId,
    periodStart: monthStart(),
  });
  return Math.max(0, quota - used);
}

export async function canExportClaimPack(userId: string) {
  const remaining = await getRemainingExports(userId);
  if (remaining > 0) {
    return { allowed: true as const, remaining };
  }
  return {
    allowed: false as const,
    remaining: 0,
    reason: "Export quota exceeded. Upgrade to Plan Manager Pro for more exports.",
  };
}

export async function canUseAiAssist(userId: string) {
  const hasPro = await hasActivePlan(userId, "plan_manager_pro");
  return hasPro;
}
