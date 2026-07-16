import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";

/** Participants own their life-event and recovery content. */
export function canActivateLifeEvent(user: CurrentUser, participantId: string): boolean {
  return user.id === participantId;
}

export function canViewLifeEvent(user: CurrentUser, participantId: string): boolean {
  if (user.id === participantId) return true;
  // Platform admins do not get unrestricted routine access.
  if (isAdminRole(user.primaryRole)) return false;
  return false;
}

export function canReportFailure(user: CurrentUser, participantId: string): boolean {
  if (user.id === participantId) return true;
  // Workers/providers may report within their operational role; scoped at API layer.
  return (
    user.roles.includes("support_worker") ||
    user.roles.includes("provider_admin") ||
    user.roles.includes("driver")
  );
}

export function canSelectRecoveryOption(
  user: CurrentUser,
  participantId: string
): boolean {
  return user.id === participantId;
}

export function canAcceptHandoff(user: CurrentUser): boolean {
  return (
    user.roles.includes("provider_admin") ||
    user.roles.includes("support_worker") ||
    user.roles.includes("driver") ||
    user.roles.includes("support_coordinator")
  );
}

/** Admins may view org-level continuity metrics, not participant life-event content. */
export function canViewOrganisationContinuity(user: CurrentUser): boolean {
  return (
    isAdminRole(user.primaryRole) ||
    user.roles.includes("provider_admin") ||
    user.roles.includes("support_coordinator")
  );
}
