import { phase4Config } from "@/lib/config/phase4";
import { isNdiaClaimingEnabled } from "@/lib/ndia/shared/config";

/**
 * Whether automated batch claiming jobs may run (future cron/workflow).
 * Manual provider UI claiming is always gated by isNdiaClaimingEnabled().
 */
export function isNdisAutoClaimingEnabled(): boolean {
  return phase4Config.ndisAutoClaimingEnabled && isNdiaClaimingEnabled();
}
