import { randomUUID } from "crypto";

import type { CurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { agentsFeatureFlags, assertAgentsEnabled } from "@/lib/config/agents";
import { checkConsent } from "@/lib/consent/consent-service";
import { prisma } from "@/lib/prisma";
import type { ConsentScope } from "@/types/mapable";

import type { AgentContext } from "./agent-types";
import { AgentConsentError, AgentDisabledError } from "./agent-errors";

export async function buildAgentContext(
  user: CurrentUser,
  sessionId?: string
): Promise<AgentContext> {
  assertAgentsEnabled();

  const profile = await prisma.participantProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  const memberships = await prisma.organisationMember.findMany({
    where: { userId: user.id },
    select: { organisationId: true },
  });

  const consentRecords = await prisma.consentRecord.findMany({
    where: { subjectUserId: user.id, status: "active" },
    select: { scope: true },
  });

  const permissions = (
    [
      "profile:read:self",
      "booking:read:self",
      "invoice:read:self",
      "consent:manage:self",
      "search:providers",
      "incident:create",
      "care:read:org",
      "invoice:read:org",
      "provider_quality:read",
      "admin:dashboard",
    ] as const
  ).filter((p) => hasPermission(user.primaryRole, p));

  return {
    userId: user.id,
    profileId: profile?.id ?? user.id,
    role: user.primaryRole,
    organisationId: memberships[0]?.organisationId,
    participantId:
      user.primaryRole === "participant" || user.primaryRole === "family_member"
        ? user.id
        : undefined,
    sessionId: sessionId ?? randomUUID(),
    consentScopes: consentRecords.map((c) => String(c.scope)),
    permissions: [...permissions],
    featureFlags: agentsFeatureFlags(),
  };
}

export async function assertAgentConsentScopes(
  context: AgentContext,
  scopes: string[]
): Promise<void> {
  for (const scope of scopes) {
    const ok = await checkConsent({
      subjectUserId: context.participantId ?? context.userId,
      scope: scope as ConsentScope,
      grantedToUserId: context.userId,
    });
    if (!ok && context.role !== "mapable_admin") {
      throw new AgentConsentError(
        `I need consent (${scope}) before I can access this.`
      );
    }
  }
}

export function assertAgentsFeatureClosed(context: AgentContext): void {
  if (!context.featureFlags.agents_enabled) {
    throw new AgentDisabledError();
  }
}
