import type { MapAbleUserRole } from "@prisma/client";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/auth-options";
import { isNeonAuthEnabled } from "@/lib/auth/auth-provider";
import { ensureAppUserFromNeonSession } from "@/lib/auth/neon-app-user";
import { getNeonAuth } from "@/lib/auth/neon-auth-server";
import { agentLog } from "@/lib/debug/agent-log";
import { prisma } from "@/lib/prisma";
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

async function currentUserFromPrisma(userId: string): Promise<CurrentUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roleAssignments: true },
  });

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

export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (isNeonAuthEnabled()) {
    const { data: session } = await getNeonAuth().getSession();
    if (!session?.user?.email) return null;

    const appUser = await ensureAppUserFromNeonSession({
      email: session.user.email,
      name: session.user.name ?? null,
    });
    return currentUserFromPrisma(appUser.id);
  }

  const session = await getServerSession(authOptions);
  // #region agent log
  agentLog("E", "current-user.ts:getCurrentUser:session", "session read", {
    hasSession: Boolean(session),
    sessionUserId: session?.user?.id ?? null,
  });
  // #endregion
  if (!session?.user?.id) return null;

  // #region agent log
  agentLog("E", "current-user.ts:getCurrentUser:db", "db user lookup", {
    sessionUserId: session.user.id,
  });
  // #endregion

  return currentUserFromPrisma(session.user.id);
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
