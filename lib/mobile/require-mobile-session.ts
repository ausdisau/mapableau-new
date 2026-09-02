import { NextResponse } from "next/server";

import type { CurrentUser } from "@/lib/auth/current-user";
import { apiUnauthorized } from "@/lib/auth/guards";
import {
  bearerFromAuthorizationHeader,
  getUserFromMobileAccessToken,
  isMobileApiEnabled,
} from "@/lib/mobile";

/**
 * Accept MapAble mobile Bearer tokens for native Android clients.
 * Does not replace requireApiSession for cookie-based web routes.
 */
export async function requireMobileAccessToken(
  req: Request,
): Promise<CurrentUser | Response> {
  if (!isMobileApiEnabled()) {
    return NextResponse.json(
      { error: "Mobile API disabled." },
      { status: 503 },
    );
  }
  const token = bearerFromAuthorizationHeader(
    req.headers.get("authorization"),
  );
  if (!token) return apiUnauthorized();
  const user = await getUserFromMobileAccessToken(token);
  if (!user) return apiUnauthorized();
  return user;
}
