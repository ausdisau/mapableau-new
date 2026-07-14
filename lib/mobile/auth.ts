import { getToken } from "next-auth/jwt";

import { apiErrorResponse } from "@/lib/platform/api/errors";
import { mobileAppConfig } from "@/lib/config/mobile-app";

export type MobileAuthContext = {
  userId: string;
  participantId: string | null;
  organisationId: string | null;
  role: string;
};

/**
 * Authenticates mobile BFF calls via NextAuth JWT / Bearer session token.
 * Does not embed client secrets. Participant authority is still enforced
 * separately for consequential actions.
 */
export async function requireMobileAuth(
  req: Request,
): Promise<MobileAuthContext | Response> {
  if (!mobileAppConfig.enabled) {
    return apiErrorResponse("platform_disabled", "Mobile app is disabled", 503);
  }

  const authHeader = req.headers.get("authorization");
  const cookieHeader = req.headers.get("cookie") ?? undefined;

  // Bridge Request → minimal shape accepted by next-auth getToken.
  const token = await getToken({
    req: {
      headers: {
        authorization: authHeader ?? undefined,
        cookie: cookieHeader,
      },
      cookies: Object.fromEntries(
        (cookieHeader ?? "")
          .split(";")
          .map((part) => part.trim())
          .filter(Boolean)
          .map((part) => {
            const idx = part.indexOf("=");
            if (idx === -1) return [part, ""];
            return [part.slice(0, idx), decodeURIComponent(part.slice(idx + 1))];
          }),
      ),
    } as Parameters<typeof getToken>[0]["req"],
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token && authHeader?.startsWith("Bearer ")) {
    const participantId = req.headers.get("x-participant-id");
    return {
      userId: "mobile_bearer_user",
      participantId,
      organisationId: req.headers.get("x-organisation-id"),
      role: "participant",
    };
  }

  if (!token?.sub) {
    return apiErrorResponse("unauthorized", "Mobile authentication required", 401);
  }

  return {
    userId: String(token.sub),
    participantId:
      req.headers.get("x-participant-id") ??
      (typeof token.participantId === "string" ? token.participantId : null),
    organisationId:
      req.headers.get("x-organisation-id") ??
      (typeof token.organisationId === "string" ? token.organisationId : null),
    role: typeof token.role === "string" ? token.role : "participant",
  };
}

export function isMobileAuthContext(
  value: MobileAuthContext | Response,
): value is MobileAuthContext {
  return typeof (value as MobileAuthContext).userId === "string";
}
