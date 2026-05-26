import { prisma } from "@/lib/prisma";

const DEFAULT_COORDINATOR_SCOPES = [
  "care_support.assessment_share",
  "care_support.referral_manage",
];

export async function hasActiveConsentForCoordinator(
  participantId: string,
  coordinatorId: string
) {
  const rel = await prisma.supportCoordinatorRelationship.findUnique({
    where: {
      participantId_coordinatorId: { participantId, coordinatorId },
    },
  });
  return rel?.status === "active";
}

export async function coordinatorHasScope(
  participantId: string,
  coordinatorId: string,
  scope: string
): Promise<boolean> {
  const rel = await prisma.supportCoordinatorRelationship.findUnique({
    where: {
      participantId_coordinatorId: { participantId, coordinatorId },
    },
  });
  if (rel?.status !== "active") return false;

  const scopes = parseScopesJson(rel.scopesJson);
  if (scopes.length === 0) {
    return DEFAULT_COORDINATOR_SCOPES.includes(scope);
  }
  return scopes.includes(scope);
}

function parseScopesJson(scopesJson: unknown): string[] {
  if (!Array.isArray(scopesJson)) return [];
  return scopesJson.filter((s): s is string => typeof s === "string");
}

export async function getCoordinatorScopes(
  participantId: string,
  coordinatorId: string
): Promise<string[]> {
  const rel = await prisma.supportCoordinatorRelationship.findUnique({
    where: {
      participantId_coordinatorId: { participantId, coordinatorId },
    },
  });
  if (rel?.status !== "active") return [];
  const scopes = parseScopesJson(rel.scopesJson);
  return scopes.length > 0 ? scopes : [...DEFAULT_COORDINATOR_SCOPES];
}
