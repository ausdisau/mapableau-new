import { NextResponse } from "next/server";
import { z } from "zod";

import { getOnboardingStatus } from "@/lib/auth/auth-profile-bridge";
import { getCurrentUser } from "@/lib/auth/current-user";
import { runAuthBridgeIfNeeded } from "@/lib/auth/run-auth-bridge";
import { getPrivacyConsentsForUser } from "@/lib/privacy/privacy-consent-service";
import { rateLimitAuthEndpoint } from "@/lib/security/rate-limit";

const meResponseSchema = z.object({
  user: z
    .object({
      id: z.string(),
      email: z.string(),
      name: z.string(),
      primaryRole: z.string(),
      roles: z.array(z.string()),
    })
    .nullable(),
  onboarding: z
    .object({
      status: z.string(),
      roleSelected: z.string().nullable().optional(),
      privacyConsentAt: z.string().nullable().optional(),
    })
    .nullable(),
  consents: z.array(
    z.object({
      grantType: z.string(),
      grantedAt: z.string(),
    })
  ),
  linkingRequired: z.boolean().optional(),
});

export async function GET(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const rl = rateLimitAuthEndpoint(ip);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const bridge = await runAuthBridgeIfNeeded();
  const user = await getCurrentUser();
  const onboarding = user
    ? await getOnboardingStatus(user.id)
    : null;
  const consents = user ? await getPrivacyConsentsForUser(user.id) : [];

  const body = {
    user: user
      ? {
          id: user.id,
          email: user.email,
          name: user.name,
          primaryRole: user.primaryRole,
          roles: user.roles,
        }
      : null,
    onboarding: onboarding
      ? {
          status: onboarding.status,
          roleSelected: onboarding.roleSelected ?? undefined,
          privacyConsentAt: onboarding.privacyConsentAt?.toISOString(),
        }
      : null,
    consents: consents.map((c) => ({
      grantType: c.grantType,
      grantedAt: c.grantedAt.toISOString(),
    })),
    linkingRequired: bridge.linkingRequired,
  };

  meResponseSchema.parse(body);
  return NextResponse.json(body);
}
