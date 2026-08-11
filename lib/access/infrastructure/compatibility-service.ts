import { prisma } from "@/lib/prisma";

import { listEntityCapabilities, listPlaceCapabilities } from "./capabilities-service";
import {
  evaluateCompatibility,
  toCompatibilityApiResponse,
  type CompatibilityEngineResult,
} from "./compatibility-engine";
import { getAccessPassportForUser, getOrCreateAccessPassport } from "./passport-service";

export async function evaluateEntityCompatibility(input: {
  userId: string;
  entityType: CompatibilityEngineResult["entityType"];
  entityId: string;
  activity?: string | null;
  journeyId?: string | null;
  persist?: boolean;
}): Promise<ReturnType<typeof toCompatibilityApiResponse>> {
  const passport = await getOrCreateAccessPassport(input.userId);

  const bundle =
    input.entityType === "place"
      ? await listPlaceCapabilities(input.entityId)
      : await listEntityCapabilities(input.entityType, input.entityId);

  const result = evaluateCompatibility({
    passportId: passport.id,
    entityType: input.entityType,
    entityId: input.entityId,
    journeyId: input.journeyId,
    activity: input.activity,
    requirements: passport.requirements,
    capabilities: bundle.capabilities,
    adjustments: bundle.adjustments,
  });

  if (input.persist !== false) {
    await prisma.accessCompatibilityRecord.create({
      data: {
        id: result.id,
        passportId: result.passportId,
        entityType: result.entityType,
        entityId: result.entityId,
        journeyId: result.journeyId,
        state: result.state,
        requiredMetConceptIds: result.requiredMetConceptIds,
        requiredUnmetConceptIds: result.requiredUnmetConceptIds,
        requiredUncertainConceptIds: result.requiredUncertainConceptIds,
        preferenceMetConceptIds: result.preferenceMetConceptIds,
        preferenceUnmetConceptIds: result.preferenceUnmetConceptIds,
        preferenceUncertainConceptIds: result.preferenceUncertainConceptIds,
        adjustmentIds: result.adjustmentIds,
        evidenceRefs: result.evidenceRefs,
        limitations: result.limitations,
        participantDecisionRequired: true,
        evaluatedAt: new Date(result.evaluatedAt),
      },
    });
  }

  return toCompatibilityApiResponse(result, bundle.adjustments);
}

export async function evaluatePlaceCompatibilityForUser(input: {
  userId: string;
  placeId: string;
  activity?: string | null;
  persist?: boolean;
}) {
  const passport = await getAccessPassportForUser(input.userId);
  if (!passport || passport.requirements.length === 0) {
    return null;
  }
  return evaluateEntityCompatibility({
    userId: input.userId,
    entityType: "place",
    entityId: input.placeId,
    activity: input.activity,
    persist: input.persist,
  });
}
