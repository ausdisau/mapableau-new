import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";

import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { requestSecurityContext } from "@/lib/audit/auth-security-audit";
import { getCurrentUser, type CurrentUser } from "@/lib/auth/current-user";
import { apiForbidden, apiUnauthorized } from "@/lib/auth/guards";
import type { StepUpAction } from "@/lib/auth/mfa-policy";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import {
  apiMfaEnrollmentRequired,
  apiStepUpRequired,
  assertMfaEnrollmentForRole,
  MfaEnrollmentRequiredError,
  requireStepUp,
  StepUpRequiredError,
} from "@/lib/auth/require-step-up";
import { isAdminRole } from "@/lib/auth/roles";

export async function requireApiSession(): Promise<
  CurrentUser | Response
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return apiUnauthorized();
  const user = await getCurrentUser();
  if (!user) return apiUnauthorized();
  return user;
}

export async function requireApiPermission(
  permission: Permission
): Promise<CurrentUser | Response> {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!hasPermission(user.primaryRole, permission)) return apiForbidden();
  return user;
}

export async function requireApiAdmin(): Promise<CurrentUser | Response> {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!isAdminRole(user.primaryRole)) return apiForbidden();
  return user;
}

export async function requireApiStepUp(
  request: NextRequest,
  action: StepUpAction,
): Promise<CurrentUser | Response> {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const audit = requestSecurityContext(request.headers);

  try {
    await assertMfaEnrollmentForRole(user);
    await requireStepUp(user, action, token, audit);
  } catch (error) {
    if (error instanceof StepUpRequiredError) {
      return apiStepUpRequired(error.action);
    }
    if (error instanceof MfaEnrollmentRequiredError) {
      return apiMfaEnrollmentRequired();
    }
    throw error;
  }

  return user;
}
