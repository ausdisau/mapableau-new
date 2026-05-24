import type { JWT } from "next-auth/jwt";

import { logAuthSecurityEvent } from "@/lib/audit/auth-security-audit";
import type { CurrentUser } from "@/lib/auth/current-user";
import {
  actionRequiresStepUp,
  roleRequiresMfaEnrollment,
  STEP_UP_DURATION_MS,
  type StepUpAction,
} from "@/lib/auth/mfa-policy";
import { userHasMfaEnrolled } from "@/lib/auth/mfa-service";

export class StepUpRequiredError extends Error {
  readonly code = "STEP_UP_REQUIRED" as const;
  readonly action: StepUpAction;
  readonly redirectUrl: string;

  constructor(action: StepUpAction) {
    super(`Step-up MFA required for ${action}`);
    this.name = "StepUpRequiredError";
    this.action = action;
    this.redirectUrl = `/auth/mfa?action=${encodeURIComponent(action)}&mode=step_up`;
  }
}

export class MfaEnrollmentRequiredError extends Error {
  readonly code = "MFA_ENROLLMENT_REQUIRED" as const;
  readonly redirectUrl = "/settings/security?required=1";

  constructor() {
    super("MFA enrollment required for this role");
    this.name = "MfaEnrollmentRequiredError";
  }
}

export function isStepUpValid(token: JWT | null | undefined): boolean {
  if (!token?.stepUpUntil) return false;
  return Date.now() < (token.stepUpUntil as number);
}

export function isMfaSessionValid(token: JWT | null | undefined): boolean {
  if (token?.mfaPending) return false;
  if (!token?.mfaVerifiedAt) return true;
  return true;
}

export async function assertMfaEnrollmentForRole(user: CurrentUser): Promise<void> {
  if (!roleRequiresMfaEnrollment(user.primaryRole)) return;
  const enrolled = await userHasMfaEnrolled(user.id);
  if (!enrolled) {
    throw new MfaEnrollmentRequiredError();
  }
}

export async function requireStepUp(
  user: CurrentUser,
  action: StepUpAction,
  token: JWT | null | undefined,
  audit?: { ipAddress?: string | null; userAgent?: string | null },
): Promise<void> {
  await assertMfaEnrollmentForRole(user);

  if (!actionRequiresStepUp(action, user.primaryRole)) {
    return;
  }

  if (isStepUpValid(token)) {
    return;
  }

  await logAuthSecurityEvent({
    eventType: "step_up_required",
    userId: user.id,
    ipAddress: audit?.ipAddress,
    userAgent: audit?.userAgent,
    metadata: { action },
  });

  throw new StepUpRequiredError(action);
}

export function stepUpUntilTimestamp(): number {
  return Date.now() + STEP_UP_DURATION_MS;
}

export function apiStepUpRequired(action: StepUpAction) {
  return Response.json(
    {
      error: "Step-up verification required",
      code: "STEP_UP_REQUIRED",
      action,
      redirect: `/auth/mfa?action=${encodeURIComponent(action)}&mode=step_up`,
    },
    { status: 403 },
  );
}

export function apiMfaEnrollmentRequired() {
  return Response.json(
    {
      error: "MFA enrollment required for your role",
      code: "MFA_ENROLLMENT_REQUIRED",
      redirect: "/settings/security?required=1",
    },
    { status: 403 },
  );
}
