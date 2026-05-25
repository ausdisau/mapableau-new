import { auth0 } from "@/lib/auth0/client";
import { getAuth0Env } from "@/lib/auth0/env";
import type { CurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/types/mapable";

export async function getAuth0SessionUser() {
  if (getAuth0Env().AUTH_PROVIDER !== "auth0") return null;
  try {
    const session = await auth0.getSession();
    return session?.user ?? null;
  } catch {
    return null;
  }
}

export async function loadCurrentUserFromProfileId(
  profileId: string
): Promise<CurrentUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: profileId },
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

export async function loadCurrentUserFromAuth0(): Promise<CurrentUser | null> {
  const authUser = await getAuth0SessionUser();
  if (!authUser?.sub) return null;

  const link = await prisma.authIdentityLink.findUnique({
    where: { auth0UserId: authUser.sub },
  });
  if (!link) return null;

  return loadCurrentUserFromProfileId(link.userId);
}

export async function getOnboardingStatus(profileId: string) {
  return prisma.profileOnboardingStatus.findUnique({
    where: { userId: profileId },
  });
}
