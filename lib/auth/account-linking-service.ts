import { createHash, randomBytes } from "crypto";

import { logAuthSecurityEvent } from "@/lib/auth/auth-audit-service";
import { prisma } from "@/lib/prisma";

const LINK_TOKEN_TTL_MS = 15 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** In-memory fallback; production should use Redis */
const pendingLinks = new Map<
  string,
  { userId: string; auth0UserId: string; email: string; expiresAt: number }
>();

export async function requestAccountLink(params: {
  existingUserId: string;
  auth0UserId: string;
  email: string;
  identity: {
    provider?: "auth0" | "google";
    providerUserId?: string;
    email_verified?: boolean;
    name?: string;
  };
}): Promise<{ token: string; confirmUrl: string }> {
  const token = randomBytes(32).toString("hex");
  pendingLinks.set(hashToken(token), {
    userId: params.existingUserId,
    auth0UserId: params.auth0UserId,
    email: params.email,
    expiresAt: Date.now() + LINK_TOKEN_TTL_MS,
  });

  await logAuthSecurityEvent({
    userId: params.existingUserId,
    auth0UserId: params.auth0UserId,
    eventType: "account_link_requested",
    metadata: { email: params.email },
  });

  return {
    token,
    confirmUrl: `/login/link-account?token=${token}`,
  };
}

export async function confirmAccountLink(token: string): Promise<{
  ok: boolean;
  userId?: string;
  error?: string;
}> {
  const entry = pendingLinks.get(hashToken(token));
  if (!entry) {
    return { ok: false, error: "Invalid or expired link token" };
  }
  if (Date.now() > entry.expiresAt) {
    pendingLinks.delete(hashToken(token));
    return { ok: false, error: "Link token expired" };
  }

  const existing = await prisma.authIdentityLink.findUnique({
    where: { auth0UserId: entry.auth0UserId },
  });
  if (existing) {
    pendingLinks.delete(hashToken(token));
    return { ok: false, error: "Identity already linked" };
  }

  await prisma.authIdentityLink.create({
    data: {
      userId: entry.userId,
      auth0UserId: entry.auth0UserId,
      email: entry.email,
      emailVerified: true,
      lastLoginAt: new Date(),
    },
  });

  pendingLinks.delete(hashToken(token));

  await logAuthSecurityEvent({
    userId: entry.userId,
    auth0UserId: entry.auth0UserId,
    eventType: "account_link_confirmed",
  });

  return { ok: true, userId: entry.userId };
}

export async function linkAuth0ToExistingUser(params: {
  userId: string;
  auth0UserId: string;
  email?: string;
  emailVerified?: boolean;
  provider?: "auth0" | "google";
  providerUserId?: string;
}) {
  await prisma.authIdentityLink.create({
    data: {
      userId: params.userId,
      auth0UserId: params.auth0UserId,
      email: params.email,
      emailVerified: params.emailVerified ?? false,
      provider: params.provider ?? "auth0",
      providerUserId: params.providerUserId,
      lastLoginAt: new Date(),
    },
  });

  await logAuthSecurityEvent({
    userId: params.userId,
    auth0UserId: params.auth0UserId,
    eventType: "account_link_confirmed",
  });
}
