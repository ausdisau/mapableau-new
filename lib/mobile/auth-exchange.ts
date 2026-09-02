import { compare } from "bcryptjs";

import type { CurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import {
  isMobileAuthExchangeEnabled,
  mobileApiConfig,
} from "@/lib/mobile/config";
import { mintMobileToken, verifyMobileToken } from "@/lib/mobile/tokens";
import type { UserRole } from "@/types/mapable";

export type MobileSessionResponse = {
  accessToken: string;
  refreshToken: string;
  expiresAtEpochMs: number;
  userId: string;
  email: string;
  primaryRole: string;
};

function toSession(
  user: { id: string; email: string; primaryRole: string },
): MobileSessionResponse {
  const access = mintMobileToken({
    sub: user.id,
    email: user.email,
    primaryRole: user.primaryRole,
    typ: "access",
    ttlSeconds: mobileApiConfig.accessTokenTtlSeconds,
  });
  const refresh = mintMobileToken({
    sub: user.id,
    email: user.email,
    primaryRole: user.primaryRole,
    typ: "refresh",
    ttlSeconds: mobileApiConfig.refreshTokenTtlSeconds,
  });
  return {
    accessToken: access.token,
    refreshToken: refresh.token,
    expiresAtEpochMs: access.expiresAtEpochMs,
    userId: user.id,
    email: user.email,
    primaryRole: user.primaryRole,
  };
}

/**
 * Password grant — verifies against the same User table as NextAuth Credentials.
 * Google/passkey grants can be added without a competing user model.
 */
export async function exchangePasswordGrant(input: {
  email: string;
  password: string;
}): Promise<
  | { ok: true; session: MobileSessionResponse }
  | { ok: false; status: number; error: string }
> {
  if (!isMobileAuthExchangeEnabled()) {
    return { ok: false, status: 503, error: "Mobile auth exchange disabled." };
  }
  if (!mobileApiConfig.tokenSecret) {
    return {
      ok: false,
      status: 503,
      error: "Mobile token secret not configured.",
    };
  }

  const email = input.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      primaryRole: true,
    },
  });

  if (!user?.passwordHash) {
    return { ok: false, status: 401, error: "Invalid email or password." };
  }

  const valid = await compare(input.password, user.passwordHash);
  if (!valid) {
    return { ok: false, status: 401, error: "Invalid email or password." };
  }

  return {
    ok: true,
    session: toSession({
      id: user.id,
      email: user.email,
      primaryRole: user.primaryRole,
    }),
  };
}

export async function refreshMobileSession(
  refreshToken: string,
): Promise<
  | { ok: true; session: MobileSessionResponse }
  | { ok: false; status: number; error: string }
> {
  if (!isMobileAuthExchangeEnabled()) {
    return { ok: false, status: 503, error: "Mobile auth exchange disabled." };
  }
  const claims = verifyMobileToken(refreshToken, "refresh");
  if (!claims) {
    return { ok: false, status: 401, error: "Invalid refresh token." };
  }
  const user = await prisma.user.findUnique({
    where: { id: claims.sub },
    select: { id: true, email: true, primaryRole: true },
  });
  if (!user) {
    return { ok: false, status: 401, error: "User unavailable." };
  }
  return {
    ok: true,
    session: toSession({
      id: user.id,
      email: user.email,
      primaryRole: user.primaryRole,
    }),
  };
}

/** Resolve Bearer mobile access token to CurrentUser-shaped identity. */
export async function getUserFromMobileAccessToken(
  token: string,
): Promise<CurrentUser | null> {
  const claims = verifyMobileToken(token, "access");
  if (!claims) return null;

  const user = await prisma.user.findUnique({
    where: { id: claims.sub },
    include: { roleAssignments: { select: { role: true } } },
  });
  if (!user) return null;

  const roles = Array.from(
    new Set([
      user.primaryRole as UserRole,
      ...user.roleAssignments.map((r) => r.role as UserRole),
    ]),
  );

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    timezone: user.timezone,
    locale: user.locale,
    primaryRole: user.primaryRole as UserRole,
    roles,
  };
}
