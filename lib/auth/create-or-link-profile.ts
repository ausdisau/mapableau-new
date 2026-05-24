import { randomBytes } from "node:crypto";

import type { User } from "@prisma/client";
import { hash } from "bcryptjs";

import { logAuthEvent } from "@/lib/audit/auth-audit-service";
import {
  authProviderLabel,
  normalizeAuthProvider,
  type AuthProviderId,
} from "@/lib/auth/auth-provider";
import { createPendingLinkToken } from "@/lib/auth/link-token";
import { prisma } from "@/lib/prisma";

export type OAuthSignInInput = {
  nextAuthProviderId: string;
  providerSubject: string;
  email: string;
  name: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type OAuthSignInResult =
  | { action: "allow"; userId: string }
  | { action: "redirect"; url: string }
  | { action: "deny"; reason: string };

export async function resolveOAuthSignIn(
  input: OAuthSignInInput,
): Promise<OAuthSignInResult> {
  const provider = normalizeAuthProvider(input.nextAuthProviderId);
  const normalizedEmail = input.email.trim().toLowerCase();
  const providerSubject = input.providerSubject;

  const existingLink = await prisma.authIdentityLink.findUnique({
    where: {
      provider_providerSubject: {
        provider,
        providerSubject,
      },
    },
    include: { user: true },
  });

  if (existingLink) {
    await prisma.authIdentityLink.update({
      where: { id: existingLink.id },
      data: { lastUsedAt: new Date(), email: normalizedEmail },
    });
    await logAuthEvent({
      eventType: "login_success",
      userId: existingLink.userId,
      provider,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      metadata: { method: "oauth", linked: true },
    });
    return { action: "allow", userId: existingLink.userId };
  }

  const userByEmail = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (userByEmail) {
    await logAuthEvent({
      eventType: "link_confirmation_required",
      userId: userByEmail.id,
      provider,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      metadata: { email: normalizedEmail },
    });

    const token = createPendingLinkToken({
      provider,
      providerSubject,
      email: normalizedEmail,
      name: input.name.trim() || normalizedEmail.split("@")[0] || "MapAble user",
    });

    const params = new URLSearchParams({
      token,
      provider: authProviderLabel(provider),
    });
    return {
      action: "redirect",
      url: `/auth/link-account?${params.toString()}`,
    };
  }

  const user = await createUserWithOAuthIdentity({
    email: normalizedEmail,
    name: input.name,
    provider,
    providerSubject,
  });

  await logAuthEvent({
    eventType: "login_success",
    userId: user.id,
    provider,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
    metadata: { method: "oauth", newUser: true },
  });

  return { action: "allow", userId: user.id };
}

export async function createUserWithOAuthIdentity({
  email,
  name,
  provider,
  providerSubject,
}: {
  email: string;
  name: string;
  provider: AuthProviderId;
  providerSubject: string;
}): Promise<User> {
  const passwordHash = await hash(randomBytes(32).toString("hex"), 10);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        name: name.trim() || email.split("@")[0] || "MapAble user",
        passwordHash,
        primaryRole: "participant",
      },
    });

    await tx.authIdentityLink.create({
      data: {
        userId: user.id,
        provider,
        providerSubject,
        email,
      },
    });

    await tx.profileOnboardingStatus.create({
      data: {
        userId: user.id,
        status: "not_started",
        currentStep: "welcome",
      },
    });

    await tx.authEvent.create({
      data: {
        eventType: "provider_linked",
        userId: user.id,
        provider,
        metadata: { initial: true },
      },
    });

    return user;
  });
}

export async function linkProviderToExistingUser({
  userId,
  provider,
  providerSubject,
  email,
  ipAddress,
  userAgent,
}: {
  userId: string;
  provider: AuthProviderId;
  providerSubject: string;
  email: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const existing = await prisma.authIdentityLink.findUnique({
    where: {
      provider_providerSubject: { provider, providerSubject },
    },
  });

  if (existing && existing.userId !== userId) {
    await logAuthEvent({
      eventType: "suspicious_login",
      userId,
      provider,
      ipAddress,
      userAgent,
      metadata: {
        reason: "provider_subject_already_linked",
        existingUserId: existing.userId,
      },
    });
    throw new Error("This sign-in method is already linked to another account");
  }

  if (!existing) {
    await prisma.authIdentityLink.create({
      data: {
        userId,
        provider,
        providerSubject,
        email,
      },
    });
    await logAuthEvent({
      eventType: "provider_linked",
      userId,
      provider,
      ipAddress,
      userAgent,
    });
  }

  await prisma.authIdentityLink.updateMany({
    where: { userId, provider },
    data: { lastUsedAt: new Date() },
  });
}

export async function ensureProfileOnboarding(userId: string) {
  return prisma.profileOnboardingStatus.upsert({
    where: { userId },
    create: {
      userId,
      status: "not_started",
      currentStep: "welcome",
    },
    update: {},
  });
}
