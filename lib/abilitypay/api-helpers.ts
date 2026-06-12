import { jsonError } from "@/lib/api/response";
import type { CurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";

import { canAccessAbilityPay } from "./policy";

export function abilityPayForbidden() {
  return jsonError("You do not have access to AbilityPay", 403);
}

export function requireAbilityPayAccess(user: CurrentUser) {
  if (!canAccessAbilityPay(user)) {
    return abilityPayForbidden();
  }
  return null;
}

export function requireAbilityPayPermission(
  user: CurrentUser,
  permission: Parameters<typeof hasPermission>[1]
) {
  const access = requireAbilityPayAccess(user);
  if (access) return access;
  if (!hasPermission(user.primaryRole, permission)) {
    return abilityPayForbidden();
  }
  return null;
}
