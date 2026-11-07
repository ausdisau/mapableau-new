/**
 * Participant-canonical tenancy checks before private reads (ACS Stage 1 / C4).
 * Client-supplied role/tenant claims are never authoritative.
 */

export type TenantGuardDenial =
  | "missing_tenant"
  | "empty_tenant"
  | "tenant_mismatch"
  | "forged_client_tenant";

export type TenantGuardResult =
  | { ok: true; tenantId: string }
  | { ok: false; reason: TenantGuardDenial };

/**
 * Fail closed when session tenant is missing or does not match the resource
 * participant's expected tenant. Untrusted client tenant headers are ignored
 * for allow decisions and may only be logged as forgery attempts.
 */
export function assertParticipantTenantAccess(input: {
  /** Server-attested tenant from session / org membership. */
  sessionTenantId: string | null | undefined;
  /** Expected tenant owning the participant resource. */
  resourceTenantId: string | null | undefined;
  /** Optional client-supplied claim — never used to allow. */
  untrustedClientTenantId?: string | null;
}): TenantGuardResult {
  if (input.sessionTenantId == null) {
    return { ok: false, reason: "missing_tenant" };
  }
  const sessionTenantId = input.sessionTenantId.trim();
  if (sessionTenantId.length === 0) {
    return { ok: false, reason: "empty_tenant" };
  }

  if (
    input.untrustedClientTenantId &&
    input.untrustedClientTenantId.trim().length > 0 &&
    input.untrustedClientTenantId.trim() !== sessionTenantId
  ) {
    return { ok: false, reason: "forged_client_tenant" };
  }

  if (
    input.resourceTenantId != null &&
    input.resourceTenantId.trim().length > 0 &&
    input.resourceTenantId.trim() !== sessionTenantId
  ) {
    return { ok: false, reason: "tenant_mismatch" };
  }

  return { ok: true, tenantId: sessionTenantId };
}
