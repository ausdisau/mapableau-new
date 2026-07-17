/**
 * Wave 11 — Employment continuity adapter.
 */

import type { ContinuitySignal } from "@prisma/client";

import { recordContinuitySignal } from "@/lib/continuity/signals/signal-service";

export async function emitEmploymentDisruptionSignal(params: {
  placementRef: string;
  participantId?: string | null;
  organisationId?: string | null;
  narrative?: string;
  observedAt?: Date;
}): Promise<ContinuitySignal> {
  return recordContinuitySignal({
    kind: "other",
    participantId: params.participantId ?? null,
    organisationId: params.organisationId ?? null,
    sourceKind: "employment_placement",
    sourceRef: params.placementRef,
    payload: { narrative: params.narrative ?? null },
    dedupeKey: `employment-disruption-${params.placementRef}`,
    observedAt: params.observedAt ?? new Date(),
    confidence: "medium",
    status: "validated",
  });
}
