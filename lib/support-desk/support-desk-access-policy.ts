import type { CurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";

export function canViewTicket(
  user: CurrentUser,
  ticket: { createdById: string; participantId: string | null }
): boolean {
  if (isAdminRole(user.primaryRole)) return true;
  if (hasPermission(user.primaryRole, "support:manage:any")) return true;
  if (ticket.createdById === user.id) return true;
  if (ticket.participantId === user.id) return true;
  return false;
}
