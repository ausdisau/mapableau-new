import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import type { CoverageCareEnquiry } from "@/lib/coverage-care/types";

export class CoverageCarePermissionError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "FORBIDDEN"
      | "TENANT_MISMATCH"
      | "NOT_OWNER"
      | "ROLE_REQUIRED",
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

export function assertEnquiryParticipant(
  user: CurrentUser,
  enquiry: CoverageCareEnquiry,
): void {
  if (enquiry.participantUserId !== user.id && !isAdminRole(user.primaryRole)) {
    throw new CoverageCarePermissionError(
      "Only the participant who created this enquiry may perform this action.",
      "NOT_OWNER",
    );
  }
}

export function assertProviderTenantAdmin(
  user: CurrentUser,
  actorTenantId: string | null | undefined,
  resourceTenantId: string,
): void {
  assertSameTenant(actorTenantId, resourceTenantId);
  const allowed =
    user.primaryRole === "provider_admin" ||
    user.roles.includes("provider_admin") ||
    isAdminRole(user.primaryRole);
  if (!allowed) {
    throw new CoverageCarePermissionError(
      "Provider administrator role is required.",
      "ROLE_REQUIRED",
    );
  }
}

export function canReadProviderInbox(user: CurrentUser): boolean {
  return (
    user.primaryRole === "provider_admin" ||
    user.roles.includes("provider_admin") ||
    user.primaryRole === "support_worker" ||
    user.roles.includes("support_worker") ||
    isAdminRole(user.primaryRole)
  );
}
