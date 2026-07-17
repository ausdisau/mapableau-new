import type { Prisma } from "@prisma/client";

import { assertPositiveCents } from "@/lib/ndis-gateway/billing/money";
import { createCorrelationId } from "@/lib/ndis-gateway/infrastructure/correlation";
import {
  assertExposureHeadroom,
  assertWithinTransactionLimit,
  computeReservationBalances,
} from "@/lib/pilot/limits/limit-policy";
import { loadPilotCounters } from "@/lib/pilot/limits/pilot-counter-store";
import { appendExposureLedgerEntry } from "@/lib/pilot/limits/pilot-exposure-ledger";
import { prisma } from "@/lib/prisma";

export async function reservePilotLimit(input: {
  pilotId: string;
  participantId?: string | null;
  amountCents: number;
  idempotencyKey: string;
  correlationId?: string;
  maxTransactionCents: number;
  maxDailyExposureCents: number;
  maxParticipantExposureCents: number;
  maxTotalExposureCents: number;
}) {
  const amountCents = assertPositiveCents(input.amountCents);
  assertWithinTransactionLimit(input.maxTransactionCents, amountCents);
  const correlationId = input.correlationId ?? createCorrelationId();

  return prisma.$transaction(async (tx) => {
    const existing = await tx.pilotLimitReservation.findUnique({
      where: {
        pilotId_idempotencyKey: {
          pilotId: input.pilotId,
          idempotencyKey: input.idempotencyKey,
        },
      },
    });
    if (existing) return existing;

    const counters = await loadPilotCounters(
      input.pilotId,
      input.participantId,
      tx
    );
    assertExposureHeadroom({
      limits: {
        maxTransactionCents: input.maxTransactionCents,
        maxDailyExposureCents: input.maxDailyExposureCents,
        maxParticipantExposureCents: input.maxParticipantExposureCents,
        maxTotalExposureCents: input.maxTotalExposureCents,
      },
      counters,
      amountCents,
    });

    const next = computeReservationBalances({
      reservedCents: counters.reservedCents,
      committedCents: counters.committedCents,
      amountCents,
      action: "reserve",
    });

    const reservation = await tx.pilotLimitReservation.create({
      data: {
        pilotId: input.pilotId,
        participantId: input.participantId ?? null,
        reservationType: "transaction",
        status: "reserved",
        amountCents,
        idempotencyKey: input.idempotencyKey,
        correlationId,
      },
    });

    await appendExposureLedgerEntry({
      pilotId: input.pilotId,
      participantId: input.participantId,
      entryType: "reserve",
      amountCents,
      balanceAfterCents: next.reservedCents + next.committedCents,
      reservationId: reservation.id,
      correlationId,
      db: tx,
    });

    return reservation;
  });
}

export async function commitPilotReservation(input: {
  reservationId: string;
  correlationId?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.pilotLimitReservation.findUniqueOrThrow({
      where: { id: input.reservationId },
    });
    if (reservation.status === "committed") return reservation;
    if (reservation.status !== "reserved") {
      throw new Error(`RESERVATION_NOT_COMMITTIBLE:${reservation.status}`);
    }

    const counters = await loadPilotCounters(
      reservation.pilotId,
      reservation.participantId,
      tx
    );
    const next = computeReservationBalances({
      reservedCents: counters.reservedCents,
      committedCents: counters.committedCents,
      amountCents: reservation.amountCents,
      action: "commit",
    });

    const updated = await tx.pilotLimitReservation.update({
      where: { id: reservation.id },
      data: { status: "committed", committedAt: new Date() },
    });

    await appendExposureLedgerEntry({
      pilotId: reservation.pilotId,
      participantId: reservation.participantId,
      entryType: "commit",
      amountCents: reservation.amountCents,
      balanceAfterCents: next.reservedCents + next.committedCents,
      reservationId: reservation.id,
      correlationId: input.correlationId ?? reservation.correlationId,
      db: tx,
    });

    return updated;
  });
}

export async function releasePilotReservation(input: {
  reservationId: string;
  correlationId?: string;
}) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const reservation = await tx.pilotLimitReservation.findUniqueOrThrow({
      where: { id: input.reservationId },
    });
    if (reservation.status === "released") return reservation;
    if (reservation.status !== "reserved") {
      throw new Error(`RESERVATION_NOT_RELEASABLE:${reservation.status}`);
    }

    const counters = await loadPilotCounters(
      reservation.pilotId,
      reservation.participantId,
      tx
    );
    const next = computeReservationBalances({
      reservedCents: counters.reservedCents,
      committedCents: counters.committedCents,
      amountCents: reservation.amountCents,
      action: "release",
    });

    const updated = await tx.pilotLimitReservation.update({
      where: { id: reservation.id },
      data: { status: "released", releasedAt: new Date() },
    });

    await appendExposureLedgerEntry({
      pilotId: reservation.pilotId,
      participantId: reservation.participantId,
      entryType: "release",
      amountCents: -reservation.amountCents,
      balanceAfterCents: next.reservedCents + next.committedCents,
      reservationId: reservation.id,
      correlationId: input.correlationId ?? reservation.correlationId,
      db: tx,
    });

    return updated;
  });
}
