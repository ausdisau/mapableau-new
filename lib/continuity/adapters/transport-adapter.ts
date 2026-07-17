/**
 * Wave 11 — Transport domain adapter.
 */

import type { ContinuitySignal } from "@prisma/client";

import { recordContinuitySignal } from "@/lib/continuity/signals/signal-service";

export async function emitTransportBookingCancelledSignal(params: {
  transportBookingId: string;
  participantId?: string | null;
  organisationId?: string | null;
  observedAt?: Date;
  cancelledByUserId?: string;
}): Promise<ContinuitySignal> {
  return recordContinuitySignal({
    kind: "transport_booking_cancelled",
    participantId: params.participantId ?? null,
    organisationId: params.organisationId ?? null,
    sourceKind: "transport_booking",
    sourceRef: params.transportBookingId,
    payload: { cancelledByUserId: params.cancelledByUserId ?? null },
    dedupeKey: `transport-booking-cancelled-${params.transportBookingId}`,
    observedAt: params.observedAt ?? new Date(),
    confidence: "high",
    status: "validated",
  });
}
