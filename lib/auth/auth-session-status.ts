import type { MapAbleUserRole, User } from "@prisma/client";

import { resolveAppUserFromSupabase } from "@/lib/auth/supabase-app-user";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/mapable";

import type { CurrentUser } from "./current-user";

export type AuthSessionStatus =
  | { status: "anonymous" }
  | { status: "unregistered"; email: string }
  | { status: "registered"; user: CurrentUser };

type AppUserWithRoles = User & {
  roleAssignments: { role: MapAbleUserRole }[];
};

export function toCurrentUser(user: AppUserWithRoles): CurrentUser {
  const roles: UserRole[] = [
    user.primaryRole as UserRole,
    ...user.roleAssignments.map((r) => r.role as UserRole),
  ];

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    timezone: user.timezone,
    locale: user.locale,
    primaryRole: user.primaryRole as UserRole,
    roles: [...new Set(roles)],
  };
}

export async function isEmailRegistered(email: string): Promise<boolean> {
  const normalized = email.trim();
  const user = await prisma.user.findFirst({
    where: { email: { equals: normalized, mode: "insensitive" } },
    select: { id: true },
  });
  return Boolean(user);
}

export async function getAuthSessionStatus(): Promise<AuthSessionStatus> {
  const supabase = await createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser?.email) {
    return { status: "anonymous" };
  }

  const appUser = await resolveAppUserFromSupabase(supabaseUser);
  if (!appUser) {
    return { status: "unregistered", email: supabaseUser.email };
  }

  return { status: "registered", user: toCurrentUser(appUser) };
}
