import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

import {
  evaluateFeatureFlag,
  type EvaluateContext,
} from "./feature-flag-service";
import { isFailClosedKey } from "./feature-flag-policy";

export async function buildEvaluateContext(
  overrideUserId?: string
): Promise<EvaluateContext> {
  const user = await getCurrentUser();
  const effectiveUserId = overrideUserId ?? user?.id;
  const profile = effectiveUserId
    ? await prisma.participantProfile.findUnique({
        where: { userId: effectiveUserId },
        select: { homeSuburb: true, homeState: true },
      })
    : null;

  const membership = effectiveUserId
    ? await prisma.organisationMember.findFirst({
        where: { userId: effectiveUserId },
        select: { organisationId: true },
      })
    : null;

  return {
    userId: effectiveUserId,
    roles: user?.roles,
    organisationId: membership?.organisationId,
    region: profile?.homeSuburb ?? profile?.homeState ?? undefined,
    environment: process.env.NODE_ENV ?? "development",
  };
}

export async function isModuleEnabled(
  key: string,
  context?: EvaluateContext
): Promise<boolean> {
  const ctx = context ?? (await buildEvaluateContext());
  return evaluateFeatureFlag(key, ctx);
}

export async function requireModuleEnabled(
  key: string,
  context?: EvaluateContext
): Promise<void> {
  const enabled = await isModuleEnabled(key, context);
  if (!enabled) {
    throw new Error(
      isFailClosedKey(key) ? "MODULE_DISABLED" : "FEATURE_DISABLED"
    );
  }
}
