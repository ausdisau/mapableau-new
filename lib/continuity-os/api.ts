import { requireApiSession } from "@/lib/api/auth-handler";
import {
  continuityOsErrorResponse,
  featureDisabledResponse,
  type ContinuityOsErrorCode,
} from "@/lib/continuity-os/errors";
import { isContinuityOsEnabled } from "@/lib/continuity-os/feature-flags";
import type { CurrentUser } from "@/lib/auth/current-user";

export async function requireContinuitySession(): Promise<
  CurrentUser | Response
> {
  if (!isContinuityOsEnabled()) {
    return featureDisabledResponse("CONTINUITY_OS_DISABLED");
  }
  return requireApiSession();
}

export function withContinuityHandler(
  handler: (user: CurrentUser, request: Request) => Promise<Response>
) {
  return async (request: Request) => {
    try {
      const user = await requireContinuitySession();
      if (user instanceof Response) return user;
      return await handler(user, request);
    } catch (error) {
      return continuityOsErrorResponse(error);
    }
  };
}

export function disabledIf(
  enabled: boolean,
  code: ContinuityOsErrorCode
): Response | null {
  if (!enabled) return featureDisabledResponse(code);
  return null;
}
