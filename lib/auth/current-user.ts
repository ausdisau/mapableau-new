import type { MapAbleUserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { resolveAppUserFromSupabase } from "@/lib/auth/supabase-app-user";
import type { UserRole } from "@/types/mapable";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  timezone: string;
  locale: string;
  primaryRole: UserRole;
  roles: UserRole[];
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) return null;

  const user = await resolveAppUserFromSupabase(supabaseUser);
  if (!user) return null;

  const roles: UserRole[] = [
    user.primaryRole as UserRole,
    ...user.roleAssignments.map((r) => r.role as UserRole),
  ];
  const uniqueRoles = [...new Set(roles)];

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    timezone: user.timezone,
    locale: user.locale,
    primaryRole: user.primaryRole as UserRole,
    roles: uniqueRoles,
  };
}

export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export function userHasRole(
  user: CurrentUser,
  role: UserRole | MapAbleUserRole
): boolean {
  return user.roles.includes(role as UserRole);
}
