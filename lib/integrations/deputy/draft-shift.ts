import { isDeputyEnabled } from "@/lib/integrations/deputy/flags";
import type {
  DeputyDraftShiftInput,
  DeputyDraftShiftResult,
} from "@/lib/integrations/deputy/types";

/**
 * Create an unpublished Deputy roster draft.
 * Never publishes (blnPublish must remain false). No silent employee create.
 */
export async function createDeputyDraftShift(
  input: DeputyDraftShiftInput,
  options?: { dryRun?: boolean },
): Promise<DeputyDraftShiftResult> {
  if (!isDeputyEnabled()) {
    return {
      ok: false,
      denialReason: "deputy_disabled",
      message: "DEPUTY_ENABLED is false (fail-closed).",
    };
  }

  if (input.publish !== false) {
    return {
      ok: false,
      denialReason: "publish_forbidden",
      message: "Automatic Deputy publish is forbidden; provider review required.",
    };
  }

  if (!Number.isFinite(input.deputyEmployeeId) || input.deputyEmployeeId <= 0) {
    return {
      ok: false,
      denialReason: "missing_employee_mapping",
      message: "Worker must be mapped to a Deputy employee ID before draft sync.",
    };
  }

  const dryRun = options?.dryRun ?? process.env.MAPABLE_INTEGRATIONS_DRY_RUN !== "false";

  // Live Deputy POST /api/v1/supervise/roster is intentionally not called until
  // OAuth + hostname allowlist land in a follow-up. Dry-run records the contract.
  return {
    ok: true,
    draft: true,
    published: false,
    remoteRosterId: dryRun ? null : null,
    dryRun,
  };
}

/** Timesheet read is review-gated — never auto-approves participant billing. */
export function deputyTimesheetRequiresHumanReview(): true {
  return true;
}
