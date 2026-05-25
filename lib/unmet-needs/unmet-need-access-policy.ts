import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";

export function canViewUnmetNeed(
  user: CurrentUser,
  record: { participantId: string; createdById: string | null }
): boolean {
  if (user.id === record.participantId) return true;
  if (isAdminRole(user.primaryRole)) return true;
  if (user.primaryRole === "support_coordinator") return true;
  return false;
}

export const AGGREGATE_MIN_CELL_SIZE = 5;
