import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";

export function canViewQuoteRequest(
  user: CurrentUser,
  quote: { participantId: string },
  invitedOrgIds: string[]
): boolean {
  if (user.id === quote.participantId) return true;
  if (isAdminRole(user.primaryRole)) return true;
  return false;
}

export function providerCanRespond(
  organisationId: string,
  invitedOrgIds: string[]
): boolean {
  return invitedOrgIds.includes(organisationId);
}
