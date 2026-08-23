import type { BillingAccountRole } from "@prisma/client";

import type { UserRole } from "@/types/mapable";

/** Map a MapAble user role onto the BillingAccount role used for Stripe customers. */
export function billingAccountRoleForUserRole(
  role: UserRole
): BillingAccountRole {
  switch (role) {
    case "provider_admin":
      return "provider";
    case "employer":
      return "employer";
    case "mapable_admin":
      return "admin";
    case "support_worker":
      return "support_worker";
    case "transport_operator":
      return "transport_operator";
    case "participant":
    case "family_member":
    case "support_coordinator":
    case "driver":
    case "plan_manager":
    case "ambassador":
      return "participant";
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}

export function isCustomerBillingNavRole(role: UserRole): boolean {
  switch (role) {
    case "participant":
    case "family_member":
    case "support_coordinator":
      return true;
    case "support_worker":
    case "provider_admin":
    case "transport_operator":
    case "driver":
    case "employer":
    case "plan_manager":
    case "ambassador":
    case "mapable_admin":
      return false;
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}
