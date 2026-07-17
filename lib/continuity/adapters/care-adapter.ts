/**
 * Wave 11 — Care domain adapter.
 *
 * Emits ContinuitySignals when a care shift or care request status changes
 * that could affect continuity. Care cancellation MUST NOT auto-cancel
 * linked transport — that path is handled by the orchestrator (which now
 * opens a continuity case instead of mutating status).
 */

import type { ContinuitySignal } from "@prisma/client";

import { recordContinuitySignal } from "@/lib/continuity/signals/signal-service";

export async function emitCareShiftCancelledSignal(params: {
  careShiftId: string;
  participantId?: string | null;
  organisationId?: string | null;
  observedAt?: Date;
  cancelledByUserId?: string;
}): Promise<ContinuitySignal> {
  const observedAt = params.observedAt ?? new Date();
  return recordContinuitySignal({
    kind: "care_shift_cancelled",
    participantId: params.participantId ?? null,
    organisationId: params.organisationId ?? null,
    sourceKind: "care_shift",
    sourceRef: params.careShiftId,
    payload: { cancelledByUserId: params.cancelledByUserId ?? null },
    dedupeKey: `care-shift-cancelled-${params.careShiftId}`,
    observedAt,
    confidence: "high",
    status: "validated",
  });
}
