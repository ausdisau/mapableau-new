import { redirect } from "next/navigation";

import type { CurrentUser } from "@/lib/auth/current-user";
import { requireAuth } from "@/lib/auth/guards";
import { isAdminRole } from "@/lib/auth/roles";
import type { UserRole } from "@/types/mapable";

const PARTICIPANT_ROLES: UserRole[] = [
  "participant",
  "family_member",
  "mapable_admin",
];

const PROVIDER_ROLES: UserRole[] = [
  "provider_admin",
  "support_worker",
  "transport_operator",
  "mapable_admin",
];

export async function requireParticipantPanel(): Promise<CurrentUser> {
  const user = await requireAuth();
  if (
    !PARTICIPANT_ROLES.some((r) => user.roles.includes(r)) &&
    !isAdminRole(user.primaryRole)
  ) {
    redirect("/dashboard");
  }
  return user;
}

export async function requireProviderPanel(): Promise<CurrentUser> {
  const user = await requireAuth();
  if (
    !PROVIDER_ROLES.some((r) => user.roles.includes(r)) &&
    !isAdminRole(user.primaryRole)
  ) {
    redirect("/dashboard");
  }
  return user;
}
