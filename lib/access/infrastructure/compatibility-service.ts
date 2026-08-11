import type { AccessEntityType } from "@/lib/access/infrastructure/domains";
import {
  evaluateCompatibility,
  summariseCompatibilityForParticipant,
  type CompatibilityEvaluationResult,
} from "@/lib/access/infrastructure/engine";
import type { AccessAdjustment, AccessCapability } from "@/lib/access/infrastructure/types";
import { getPassportForUser } from "@/lib/access/infrastructure/passport-service";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export type EvaluateAndPersistInput = {
  userId: string;
  entityType: AccessEntityType;
  entityId: string;
  capabilities: Array<
    AccessCapability & {
      observationStatus?: AccessCapability["status"];
      disputed?: boolean;
      reviewDue?: string | null;
    }
  >;
  adjustments?: AccessAdjustment[];
  contextTags?: string[];
  persist?: boolean;
};

export async function evaluatePassportCompatibility(
  input: EvaluateAndPersistInput,
): Promise<CompatibilityEvaluationResult & { assessmentId?: string; participantSummary: string }> {
  const passport = await getPassportForUser(input.userId);
  if (!passport) {
    const empty: CompatibilityEvaluationResult = {
      passportId: "missing",
      entityType: input.entityType,
      entityId: input.entityId,
      state: "uncertain",
      findings: [],
      requiredMetConceptIds: [],
      requiredUnmetConceptIds: [],
      requiredUncertainConceptIds: [],
      preferenceMetConceptIds: [],
      preferenceUnmetConceptIds: [],
      preferenceUncertainConceptIds: [],
      adjustmentIds: [],
      evidenceRefs: [],
      limitations: ["No Access Passport found for participant."],
      participantDecisionRequired: true,
      decisionOwner: "PARTICIPANT",
      summary: { matched: 0, unknown: 0, mismatched: 0, adjustments: 0 },
    };
    return {
      ...empty,
      participantSummary: summariseCompatibilityForParticipant(empty),
    };
  }

  const result = evaluateCompatibility({
    passportId: passport.id,
    requirements: passport.requirements,
    entityType: input.entityType,
    entityId: input.entityId,
    capabilities: input.capabilities,
    adjustments: input.adjustments ?? [],
    contextTags: input.contextTags,
  });

  let assessmentId: string | undefined;
  if (input.persist) {
    const assessment = await prisma.accessCompatibilityRecord.create({
      data: {
        passportId: passport.id,
        entityType: input.entityType,
        entityId: input.entityId,
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
        findings: {
          create: result.findings.map((f) => ({
            requirementId: passport.requirements.some((r) => r.id === f.requirementId)
              ? f.requirementId
              : null,
            ontologyConceptId: f.ontologyConceptId,
            result: f.result,
            capabilityId: f.capabilityId,
            observationId: f.observationId,
            adjustmentId: f.adjustmentId,
            reasonCode: f.reasonCode,
            explanation: f.explanation,
            requiresConfirmation: f.requiresConfirmation,
          })),
        },
      },
    });
    assessmentId = assessment.id;

    await prisma.accessChangeEventRecord.create({
      data: {
        passportId: passport.id,
        eventType: "compatibility_evaluated",
        actorUserId: input.userId,
        entityType: input.entityType,
        entityId: input.entityId,
        summary: `Compatibility evaluated: ${result.state}`,
        metadataJson: { state: result.state, summary: result.summary },
      },
    });

    await createAuditEvent({
      actorUserId: input.userId,
      action: "ACCESS_COMPATIBILITY_EVALUATED",
      entityType: "AccessCompatibility",
      entityId: assessment.id,
      participantId: input.userId,
      metadata: {
        state: result.state,
        entityType: input.entityType,
        matched: result.summary.matched,
        unknown: result.summary.unknown,
        mismatched: result.summary.mismatched,
      },
    });
  }

  return {
    ...result,
    assessmentId,
    participantSummary: summariseCompatibilityForParticipant(result),
  };
}

export async function getAssessmentForOwner(userId: string, assessmentId: string) {
  const passport = await getPassportForUser(userId);
  if (!passport) return null;
  return prisma.accessCompatibilityRecord.findFirst({
    where: { id: assessmentId, passportId: passport.id },
    include: { findings: true },
  });
}
