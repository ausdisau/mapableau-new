import type { TenantContext } from "@/lib/tenancy/context/tenant-context";
import { assertTenantMatch } from "@/lib/tenancy/context/tenant-assertions";

export interface PrivateFilePolicyDecision {
  allowed: boolean;
  reason: string;
}

/**
 * Decide whether the tenant context may access a private file record. The
 * file MUST carry its owning organisationId at rest — files without one
 * are treated as denied by default.
 */
export function evaluatePrivateFileAccess(
  ctx: TenantContext,
  file: { organisationId: string | null; classification?: string | null }
): PrivateFilePolicyDecision {
  if (!file.organisationId) {
    return { allowed: false, reason: "file_missing_owner" };
  }
  try {
    assertTenantMatch(ctx, file.organisationId);
  } catch (e) {
    return { allowed: false, reason: (e as Error).message };
  }
  if (
    file.classification === "participant_data" ||
    file.classification === "claim_and_funding_data"
  ) {
    if (ctx.actor.role === "mapable_admin" && !ctx.breakGlassSessionId) {
      return { allowed: false, reason: "sensitive_needs_break_glass" };
    }
  }
  return { allowed: true, reason: "ok" };
}
