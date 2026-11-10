import type { MapAbleUserRole } from "@prisma/client";
import { auth, currentUser as currentClerkUser } from "@clerk/nextjs/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
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

function toCurrentUser(
  user: {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    timezone: string;
    locale: string;
    primaryRole: MapAbleUserRole;
    roleAssignments: { role: MapAbleUserRole }[];
  },
): CurrentUser {
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

/**
 * Dual-run resolver: prefer Clerk when the session maps to a Prisma user via
 * `external_id` (legacy NextAuth / Prisma `User.id`). Fall back to NextAuth.
 */
async function getCurrentUserFromClerk(): Promise<CurrentUser | null> {
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) return null;

  const clerkUser = await currentClerkUser();
  const externalId = clerkUser?.externalId?.trim();
  if (!externalId) {
    agentLog(
      "E",
      "current-user.ts:getCurrentUserFromClerk:noExternalId",
      "Clerk session has no external_id yet",
      { clerkUserId: clerkUser?.id ?? null },
    );
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: externalId },
    include: { roleAssignments: true },
  });
  if (!user) return null;
  return toCurrentUser(user);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const fromClerk = await getCurrentUserFromClerk();
  if (fromClerk) {
    agentLog("E", "current-user.ts:getCurrentUser:clerk", "resolved via Clerk", {
      userId: fromClerk.id,
    });
    return fromClerk;
  }

  const session = await getServerSession(authOptions);
  // #region agent log
  agentLog("E", "current-user.ts:getCurrentUser:session", "session read", {
    hasSession: Boolean(session),
    sessionUserId: session?.user?.id ?? null,
  });
  // #endregion
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { roleAssignments: true },
  });

  // #region agent log
  agentLog("E", "current-user.ts:getCurrentUser:db", "db user lookup", {
    found: Boolean(user),
    primaryRole: user?.primaryRole ?? null,
  });
  // #endregion
  if (!user) return null;

  return toCurrentUser(user);
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
