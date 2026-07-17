import { createCorrelationId } from "@/lib/ndis-gateway/infrastructure/correlation";
import { assertPilotTransactionAllowed } from "@/lib/pilot/limits/pilot-limit-service";
import {
  commitPilotReservation,
  releasePilotReservation,
  reservePilotLimit,
} from "@/lib/pilot/limits/pilot-reservation-service";
import { writePilotAuditEvent } from "@/lib/pilot/runtime/pilot-audit";
import { isPilotEnforcementEnabled } from "@/lib/pilot/runtime/pilot-context";
import { buildPilotIdempotencyKey } from "@/lib/pilot/runtime/pilot-idempotency";
import { assertProviderEligibleForPilot } from "@/lib/pilot/runtime/runtime-provider-gate";
import { prisma } from "@/lib/prisma";

export type ExecuteWithinPilotPolicyInput<T> = {
  pilotId: string;
  organisationId: string;
  actorUserId: string;
  participantId: string;
  amountCents: number;
  supportItemCode: string;
  fundingRoute: string;
  integrationProfileId?: string | null;
  operationLabel?: string;
  execute: () => Promise<T>;
};

/**
 * Wraps a side-effecting payment/billing action in ControlledPilot policy.
 * No real NDIA submission. Reserves → executes → commits; releases on failure.
 */
export async function executeWithinPilotPolicy<T>(
  input: ExecuteWithinPilotPolicyInput<T>
): Promise<{ result: T; correlationId: string; reservationId: string }> {
  if (!isPilotEnforcementEnabled()) {
    throw new Error("PILOT_ENFORCEMENT_DISABLED");
  }

  const pilot = await prisma.controlledPilot.findUniqueOrThrow({
    where: { id: input.pilotId },
  });
  assertProviderEligibleForPilot({
    organisationId: input.organisationId,
    pilotOrganisationId: pilot.organisationId,
  });

  await assertPilotTransactionAllowed({
    pilotId: input.pilotId,
    participantId: input.participantId,
    amountCents: input.amountCents,
    supportItemCode: input.supportItemCode,
    fundingRoute: input.fundingRoute,
    integrationProfileId: input.integrationProfileId,
  });

  const correlationId = createCorrelationId();
  const idempotencyKey = buildPilotIdempotencyKey({
    pilotId: input.pilotId,
    operation: input.operationLabel ?? "execute",
    subjectId: input.participantId,
    amountCents: input.amountCents,
    nonce: correlationId,
  });

  const reservation = await reservePilotLimit({
    pilotId: input.pilotId,
    participantId: input.participantId,
    amountCents: input.amountCents,
    idempotencyKey,
    correlationId,
    maxTransactionCents: pilot.maxTransactionCents,
    maxDailyExposureCents: pilot.maxDailyExposureCents,
    maxParticipantExposureCents: pilot.maxParticipantExposureCents,
    maxTotalExposureCents: pilot.maxTotalExposureCents,
  });

  try {
    const result = await input.execute();
    await commitPilotReservation({
      reservationId: reservation.id,
      correlationId,
    });
    await writePilotAuditEvent({
      organisationId: input.organisationId,
      pilotId: input.pilotId,
      actorUserId: input.actorUserId,
      action: "execute_within_pilot_policy",
      entityId: reservation.id,
      correlationId,
      metadata: {
        amountCents: input.amountCents,
        supportItemCode: input.supportItemCode,
        fundingRoute: input.fundingRoute,
      },
    });
    return { result, correlationId, reservationId: reservation.id };
  } catch (err) {
    await releasePilotReservation({
      reservationId: reservation.id,
      correlationId,
    });
    throw err;
  }
}
