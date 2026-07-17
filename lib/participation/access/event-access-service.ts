import { prisma } from "@/lib/prisma";
import { asJson, asJsonArray } from "@/lib/prisma-json";
import { assertParticipationPlannerEnabled } from "@/lib/participation/feature-flags";

const ACCESS_FRESHNESS_DAYS = 30;

export interface EventAccessFreshnessInput {
  evidenceLevel?: string | null;
  lastCheckedAt?: Date | null;
  validUntil?: Date | null;
  uncertainty?: string | null;
}

export function assessEventAccessFreshness(
  profile: EventAccessFreshnessInput | null | undefined,
  now = new Date(),
) {
  if (!profile) {
    return {
      accessible: false,
      warnings: ["Access information is unknown; unknown is not accessible."],
    };
  }
  const warnings: string[] = [];
  if (!profile.evidenceLevel || profile.evidenceLevel === "unknown") {
    warnings.push("Access evidence level is unknown.");
  }
  if (!profile.lastCheckedAt) {
    warnings.push("Access information has no last-checked date.");
  } else {
    const staleAfter = new Date(profile.lastCheckedAt);
    staleAfter.setDate(staleAfter.getDate() + ACCESS_FRESHNESS_DAYS);
    if (staleAfter < now) warnings.push("Access information may be stale.");
  }
  if (profile.validUntil && profile.validUntil < now) {
    warnings.push("Access information has expired.");
  }
  if (profile.uncertainty) warnings.push(profile.uncertainty);
  return { accessible: warnings.length === 0, warnings };
}

export async function upsertEventAccessProfile(input: {
  eventId: string;
  evidenceLevel: string;
  lastCheckedAt: Date;
  validUntil?: Date;
  uncertainty?: string;
  mobilityAccess?: Record<string, unknown>;
  sensoryAccess?: Record<string, unknown>;
  communicationAccess?: Record<string, unknown>;
  accessAssetIds?: string[];
}) {
  assertParticipationPlannerEnabled();
  return prisma.eventAccessProfile.upsert({
    where: { eventId: input.eventId },
    create: {
      ...input,
      mobilityAccess: asJson(input.mobilityAccess),
      sensoryAccess: asJson(input.sensoryAccess),
      communicationAccess: asJson(input.communicationAccess),
      accessAssetIds: asJsonArray(input.accessAssetIds ?? []) ?? [],
    },
    update: {
      ...input,
      mobilityAccess: asJson(input.mobilityAccess),
      sensoryAccess: asJson(input.sensoryAccess),
      communicationAccess: asJson(input.communicationAccess),
      accessAssetIds: asJsonArray(input.accessAssetIds ?? []) ?? [],
    },
  });
}
