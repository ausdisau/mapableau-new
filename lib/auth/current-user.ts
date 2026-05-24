import type { MapAbleUserRole } from "@prisma/client";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { auth0 } from "@/lib/auth/auth0";
import { getProfileIdFromAuth0Session } from "@/lib/auth/auth-bridge-service";
import { getOnboardingStatus } from "@/lib/auth/role-onboarding-router";
import { isAuth0Configured } from "@/lib/config/auth-env";
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

export interface CurrentUserProfile extends CurrentUser {
  onboarding: {
    status: string;
    selectedRole: string | null;
    nextStep: string | null;
  } | null;
}

async function loadUserById(userId: string): Promise<CurrentUser | null> {
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

export async function getCurrentUserProfile(
  userId: string,
): Promise<CurrentUserProfile | null> {
  const user = await loadUserById(userId);
  if (!user) return null;

  const onboarding = await getOnboardingStatus(userId);

  return {
    ...user,
    onboarding: onboarding
      ? {
          status: onboarding.onboardingStatus,
          selectedRole: onboarding.selectedRole,
          nextStep: onboarding.nextStep,
        }
      : null,
  };
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (isAuth0Configured()) {
    try {
      const session = await auth0.getSession();
      if (session) {
        const profileId = await getProfileIdFromAuth0Session(session);
        if (profileId) {
          return loadUserById(profileId);
        }
      }
    } catch {
      // Fall through to legacy session
    }
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  return loadUserById(session.user.id);
}

export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export function userHasRole(
  user: CurrentUser,
  role: UserRole | MapAbleUserRole,
): boolean {
  return user.roles.includes(role as UserRole);
}
