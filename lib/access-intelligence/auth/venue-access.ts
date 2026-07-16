import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";

import { isDemoMode } from "../configuration";
import { AccessIntelligenceError } from "../errors";
import { getLivingPersistence } from "../persistence";

export type VenueAccessRole =
  | "visitor"
  | "venue_staff"
  | "venue_admin"
  | "mapable_admin";

/**
 * Demo role preview is ONLY honoured when:
 * - ACCESS_INTELLIGENCE_DEMO_MODE is on, AND
 * - ACCESS_INTELLIGENCE_ALLOW_DEMO_ROLE_PREVIEW is not "false"
 *
 * Production (demo mode off) never trusts x-access-role headers.
 */
export function allowDemoRolePreview(): boolean {
  if (!isDemoMode()) return false;
  return process.env.ACCESS_INTELLIGENCE_ALLOW_DEMO_ROLE_PREVIEW !== "false";
}

export function platformVenueRoles(user: CurrentUser): boolean {
  return (
    isAdminRole(user.primaryRole) ||
    user.roles.includes("mapable_admin") ||
    user.roles.includes("provider_admin")
  );
}

export async function userHasVenueOperateAccess(input: {
  user: CurrentUser;
  placeId: string;
  roleHeader?: string | null;
}): Promise<{ allowed: boolean; reason: string; effectiveRole: VenueAccessRole }> {
  if (platformVenueRoles(input.user)) {
    return {
      allowed: true,
      reason: "Platform admin / provider_admin role.",
      effectiveRole: isAdminRole(input.user.primaryRole)
        ? "mapable_admin"
        : "venue_admin",
    };
  }

  const persistence = getLivingPersistence();
  const assigned = await persistence.isVenueStaff(input.user.id, input.placeId);
  if (assigned) {
    return {
      allowed: true,
      reason: "AiVenueStaffAssignment record.",
      effectiveRole: "venue_staff",
    };
  }

  if (allowDemoRolePreview()) {
    const header = input.roleHeader;
    if (header === "venue_staff" || header === "admin" || header === "demo_preview") {
      return {
        allowed: true,
        reason:
          "Demo role preview header (disabled automatically when ACCESS_INTELLIGENCE_DEMO_MODE=false).",
        effectiveRole: header === "admin" ? "venue_admin" : "venue_staff",
      };
    }
  } else if (input.roleHeader && !isDemoMode()) {
    return {
      allowed: false,
      reason:
        "Role preview headers are ignored in production. Assign AiVenueStaffAssignment or use mapable_admin / provider_admin.",
      effectiveRole: "visitor",
    };
  }

  return {
    allowed: false,
    reason: "Not authorised for Operate/Improve on this place.",
    effectiveRole: "visitor",
  };
}

export async function requireVenueOperateAccess(input: {
  user: CurrentUser;
  placeId: string;
  roleHeader?: string | null;
}): Promise<{ effectiveRole: VenueAccessRole }> {
  const result = await userHasVenueOperateAccess(input);
  if (!result.allowed) {
    throw new AccessIntelligenceError(
      "FORBIDDEN",
      result.reason,
      "Ask a MapAble admin to grant venue staff access for this place, or sign in with an authorised role.",
      { placeId: input.placeId },
    );
  }
  return { effectiveRole: result.effectiveRole };
}
