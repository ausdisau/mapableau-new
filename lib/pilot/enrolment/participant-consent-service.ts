import { canDelegateProvidePilotConsent } from "@/lib/pilot/enrolment/delegate-authority";
import { ordinaryConsentSatisfiesPilotConsent } from "@/lib/pilot/enrolment/participant-eligibility";
import { prisma } from "@/lib/prisma";

export async function recordPilotConsent(input: {
  pilotId: string;
  participantId: string;
  actorUserId: string;
  consentVersion: string;
  hasOrdinaryConsent?: boolean;
}) {
  if (
    input.hasOrdinaryConsent &&
    ordinaryConsentSatisfiesPilotConsent(input.hasOrdinaryConsent)
  ) {
    // Unreachable by design — documents the invariant.
    throw new Error("ORDINARY_CONSENT_CANNOT_SATISFY_PILOT_CONSENT");
  }

  const enrolment = await prisma.pilotParticipantEnrolment.findUniqueOrThrow({
    where: {
      pilotId_participantId: {
        pilotId: input.pilotId,
        participantId: input.participantId,
      },
    },
  });

  const isSelf = input.actorUserId === input.participantId;
  if (!isSelf) {
    const check = canDelegateProvidePilotConsent({
      delegateUserId: input.actorUserId,
      actorUserId: input.actorUserId,
      enrolmentDelegateUserId: enrolment.delegateUserId,
    });
    if (!check.allowed) {
      throw new Error(check.reason ?? "DELEGATE_DENIED");
    }
  }

  if (enrolment.status === "withdrawn" || enrolment.status === "exited") {
    throw new Error(`ENROLMENT_NOT_CONSENTABLE:${enrolment.status}`);
  }

  return prisma.pilotParticipantEnrolment.update({
    where: { id: enrolment.id },
    data: {
      status: "consent_pending",
      pilotConsentAt: new Date(),
      pilotConsentVersion: input.consentVersion,
      pilotConsentById: input.actorUserId,
    },
  });
}

export async function withdrawPilotConsent(input: {
  pilotId: string;
  participantId: string;
  actorUserId: string;
  reason?: string;
}) {
  return prisma.pilotParticipantEnrolment.update({
    where: {
      pilotId_participantId: {
        pilotId: input.pilotId,
        participantId: input.participantId,
      },
    },
    data: {
      status: "withdrawn",
      withdrawnAt: new Date(),
      exitReason: input.reason ?? "consent_withdrawn",
      exitedAt: new Date(),
      safeNotesJson: { withdrawnById: input.actorUserId },
    },
  });
}
