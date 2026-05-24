import type { MapAbleUserRole } from "@prisma/client";
import type { JWT } from "next-auth/jwt";

import { roleRequiresMfaEnrollment } from "@/lib/auth/mfa-policy";
import { getActiveTotpMethod, isTrustedDevice } from "@/lib/auth/mfa-service";

export async function applyMfaFlagsToToken(
  token: JWT,
  userId: string,
  primaryRole: MapAbleUserRole,
  deviceToken?: string,
): Promise<JWT> {
  const totp = await getActiveTotpMethod(userId);
  const trusted = await isTrustedDevice(userId, deviceToken);

  if (totp && !trusted) {
    token.mfaPending = true;
    token.mfaVerifiedAt = undefined;
  } else {
    token.mfaPending = false;
    token.mfaVerifiedAt = Date.now();
  }

  token.mfaEnrollmentRequired =
    roleRequiresMfaEnrollment(primaryRole) && !totp;

  return token;
}
