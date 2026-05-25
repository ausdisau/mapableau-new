import { NextResponse } from "next/server";
import { z } from "zod";

import { completeOnboardingRole } from "@/lib/auth/create-or-link-mapable-profile";
import { getCurrentUser } from "@/lib/auth/current-user";
import { grantPrivacyConsent } from "@/lib/privacy/privacy-consent-service";
import type { MapAbleUserRole } from "@prisma/client";

const bodySchema = z.object({
  role: z.enum([
    "participant",
    "family_member",
    "support_coordinator",
    "support_worker",
    "provider_admin",
    "transport_operator",
    "driver",
    "employer",
    "plan_manager",
    "mapable_admin",
  ]),
  privacyConsent: z.literal(true),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const now = new Date();
  await grantPrivacyConsent({
    userId: user.id,
    grantType: "privacy_policy",
    purpose: "MapAble privacy policy and APP collection notice",
  });
  await grantPrivacyConsent({
    userId: user.id,
    grantType: "terms_of_service",
    purpose: "MapAble terms of service",
  });

  await completeOnboardingRole(
    user.id,
    parsed.data.role as MapAbleUserRole,
    now
  );

  return NextResponse.json({ ok: true });
}
