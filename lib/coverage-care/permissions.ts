import type { CurrentUser } from "@/lib/auth/current-user";
import type { CoverageCareEnquiry } from "@/lib/coverage-care/types";
import { isProviderVisible } from "@/lib/tenancy/tenant-enquiry-model";

export class CoverageCarePermissionError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "FORBIDDEN"
      | "TENANT_MISMATCH"
      | "NOT_OWNER"
      | "ROLE_REQUIRED"
      | "CONSENT_WITHDRAWN",
  ) {
    super(message);
    this.name = "CoverageCarePermissionError";
  }
}

export function assertSameTenant(
  actorTenantId: string | null | undefined,
  resourceTenantId: string,
): void {
  if (!actorTenantId) {
    throw new CoverageCarePermissionError(
      "Tenant context is required.",
      "TENANT_MISMATCH",
    );
  }
  if (actorTenantId !== resourceTenantId) {
    throw new CoverageCarePermissionError(
      "Cross-tenant access denied.",
      "TENANT_MISMATCH",
    );
  }
}

/**
 * Participant ownership only. Platform admin does NOT inherit participant
 * authority (prompt: mapable_admin must not auto-access participant records).
 */
export function assertEnquiryParticipant(
  user: CurrentUser,
  enquiry: CoverageCareEnquiry,
): void {
  if (enquiry.participantUserId !== user.id) {
    throw new CoverageCarePermissionError(
      "Only the participant who created this enquiry may perform this action.",
      "NOT_OWNER",
    );
  }
}

export function assertProviderTenantStaff(
  user: CurrentUser,
  actorTenantId: string | null | undefined,
  resourceTenantId: string,
): void {
  assertSameTenant(actorTenantId, resourceTenantId);
  const allowed =
    user.primaryRole === "provider_admin" ||
    user.roles.includes("provider_admin") ||
    user.primaryRole === "support_worker" ||
    user.roles.includes("support_worker");
  if (!allowed) {
    throw new CoverageCarePermissionError(
      "Coverage Care provider staff role is required.",
      "ROLE_REQUIRED",
    );
  }
}

/** @deprecated Use assertProviderTenantStaff — name retained for call-site compatibility. */
export function assertProviderTenantAdmin(
  user: CurrentUser,
  actorTenantId: string | null | undefined,
  resourceTenantId: string,
): void {
  assertProviderTenantStaff(user, actorTenantId, resourceTenantId);
}

export function canReadProviderInbox(user: CurrentUser): boolean {
  return (
    user.primaryRole === "provider_admin" ||
    user.roles.includes("provider_admin") ||
    user.primaryRole === "support_worker" ||
    user.roles.includes("support_worker")
  );
}

export function assertProviderCanViewEnquiry(enquiry: CoverageCareEnquiry): void {
  if (
    !isProviderVisible(enquiry.status, enquiry.providerStatus) ||
    enquiry.deletedAt ||
    enquiry.status === "withdrawn"
  ) {
    throw new CoverageCarePermissionError(
      "Consent withdrawn or enquiry not visible to provider.",
      "CONSENT_WITHDRAWN",
    );
  }
}
