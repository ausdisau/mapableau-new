import { runCapacityMatch } from "@/lib/capacity/capacity-matching-service";
import { isModuleEnabled } from "@/lib/feature-flags/server-feature-flag";

export async function matchWaitlistWhenReady(waitlistId: string) {
  if (!(await isModuleEnabled("waitlist_exchange_enabled"))) {
    return { skipped: true };
  }
  return runCapacityMatch(waitlistId);
}
