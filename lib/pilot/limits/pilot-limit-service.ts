import {
  assertFundingRouteAllowed,
  assertSupportItemAllowed,
} from "@/lib/pilot/policy/allowlist";
import { isPilotOperationallyActive } from "@/lib/pilot/policy/pilot-status";
import {
  assertOperationAllowedAtStage,
  isLimitedLivePermitted,
} from "@/lib/pilot/policy/stage-policy";
import { loadPilotCounters } from "@/lib/pilot/limits/pilot-counter-store";
import {
  assertExposureHeadroom,
  assertWithinTransactionLimit,
} from "@/lib/pilot/limits/limit-policy";
import { prisma } from "@/lib/prisma";

export type AssertPilotTransactionInput = {
  pilotId: string;
  participantId: string;
  amountCents: number;
  supportItemCode: string;
  fundingRoute: string;
  integrationProfileId?: string | null;
};

/**
 * Fail-closed transaction gate for ControlledPilot.
 * Does not submit to NDIA. Does not consult NdiaPilotApprovalRecord.
 */
export async function assertPilotTransactionAllowed(
  input: AssertPilotTransactionInput
): Promise<{ ok: true; pilotId: string }> {
  const pilot = await prisma.controlledPilot.findUnique({
    where: { id: input.pilotId },
  });
  if (!pilot) {
    throw new Error("PILOT_NOT_FOUND");
  }
  if (!isPilotOperationallyActive(pilot.status)) {
    throw new Error(`PILOT_NOT_ACTIVE:${pilot.status}`);
  }
  if (pilot.status === "paused") {
    throw new Error("PILOT_PAUSED_BLOCKS_NEW_OPS");
  }

  assertOperationAllowedAtStage(pilot.stage, "execute_transaction");
  assertSupportItemAllowed(pilot.supportItemAllowlist, input.supportItemCode);
  assertFundingRouteAllowed(pilot.fundingRouteAllowlist, input.fundingRoute);

  if (input.integrationProfileId) {
    if (pilot.integrationProfileIds.length === 0) {
      throw new Error("INTEGRATION_PROFILE_ALLOWLIST_EMPTY_DENY");
    }
    if (!pilot.integrationProfileIds.includes(input.integrationProfileId)) {
      throw new Error(
        `INTEGRATION_PROFILE_NOT_ALLOWLISTED:${input.integrationProfileId}`
      );
    }
  }

  const liveCheck = isLimitedLivePermitted({
    stage: pilot.stage,
    limitedLiveEnabled: pilot.limitedLiveEnabled,
    assuranceAssessmentId: pilot.assuranceAssessmentId,
    goLiveAssessmentId: pilot.goLiveAssessmentId,
  });
  if (!liveCheck.ok) {
    throw new Error(`LIMITED_LIVE_BLOCKED:${liveCheck.reasons.join(",")}`);
  }

  const enrolment = await prisma.pilotParticipantEnrolment.findUnique({
    where: {
      pilotId_participantId: {
        pilotId: input.pilotId,
        participantId: input.participantId,
      },
    },
  });
  if (!enrolment || enrolment.status !== "enrolled") {
    throw new Error("PARTICIPANT_NOT_ENROLLED_IN_PILOT");
  }
  if (!enrolment.pilotConsentAt) {
    throw new Error("PILOT_CONSENT_REQUIRED");
  }

  assertWithinTransactionLimit(pilot.maxTransactionCents, input.amountCents);
  const counters = await loadPilotCounters(input.pilotId, input.participantId);
  assertExposureHeadroom({
    limits: {
      maxTransactionCents: pilot.maxTransactionCents,
      maxDailyExposureCents: pilot.maxDailyExposureCents,
      maxParticipantExposureCents: pilot.maxParticipantExposureCents,
      maxTotalExposureCents: pilot.maxTotalExposureCents,
    },
    counters,
    amountCents: input.amountCents,
  });

  return { ok: true, pilotId: pilot.id };
}
