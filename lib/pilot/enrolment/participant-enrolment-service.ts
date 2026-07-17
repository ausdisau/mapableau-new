import { evaluateParticipantEligibility } from "@/lib/pilot/enrolment/participant-eligibility";
import { assertOperationAllowedAtStage } from "@/lib/pilot/policy/stage-policy";
import { prisma } from "@/lib/prisma";

export async function inviteParticipantToPilot(input: {
  pilotId: string;
  participantId: string;
  invitedById: string;
  delegateUserId?: string | null;
}) {
  const pilot = await prisma.controlledPilot.findUniqueOrThrow({
    where: { id: input.pilotId },
  });
  assertOperationAllowedAtStage(pilot.stage, "enrol_participant");

  return prisma.pilotParticipantEnrolment.create({
    data: {
      pilotId: input.pilotId,
      participantId: input.participantId,
      invitedById: input.invitedById,
      delegateUserId: input.delegateUserId ?? null,
      status: "invited",
    },
  });
}

/**
 * Completes enrolment only after explicit pilot consent.
 * Never auto-enrols from ordinary consent or global pilot approval.
 */
export async function enrolParticipantInPilot(input: {
  pilotId: string;
  participantId: string;
  participantActive?: boolean;
  hasOrdinaryConsent?: boolean;
}) {
  const pilot = await prisma.controlledPilot.findUniqueOrThrow({
    where: { id: input.pilotId },
  });
  assertOperationAllowedAtStage(pilot.stage, "enrol_participant");

  const enrolment = await prisma.pilotParticipantEnrolment.findUniqueOrThrow({
    where: {
      pilotId_participantId: {
        pilotId: input.pilotId,
        participantId: input.participantId,
      },
    },
  });

  const enrolledCount = await prisma.pilotParticipantEnrolment.count({
    where: { pilotId: input.pilotId, status: "enrolled" },
  });

  const eligibility = evaluateParticipantEligibility({
    participantActive: input.participantActive ?? true,
    hasOrdinaryConsent: input.hasOrdinaryConsent ?? false,
    hasPilotConsent: Boolean(enrolment.pilotConsentAt),
    alreadyEnrolled: enrolment.status === "enrolled",
    pilotAcceptingEnrolments:
      pilot.status === "active" || pilot.status === "approved",
    maxActiveParticipants: pilot.maxActiveParticipants,
    currentEnrolledCount: enrolledCount,
  });

  // Allow enrolment when only blocker is ORDINARY_CONSENT_NOT_PILOT_CONSENT
  // if pilot consent is present (evaluateParticipantEligibility adds both).
  const blockers = eligibility.reasons.filter(
    (r) => r !== "ORDINARY_CONSENT_NOT_PILOT_CONSENT"
  );
  if (blockers.length > 0) {
    throw new Error(`ENROLMENT_DENIED:${blockers.join(",")}`);
  }

  return prisma.pilotParticipantEnrolment.update({
    where: { id: enrolment.id },
    data: { status: "enrolled" },
  });
}
