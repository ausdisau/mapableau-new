/**
 * Wave 11 — Housing continuity adapter.
 *
 * Housing changes always require a human coordinator. AURA can only
 * describe the situation.
 */

import type { ContinuitySignal } from "@prisma/client";

import { recordContinuitySignal } from "@/lib/continuity/signals/signal-service";

export async function emitHousingDisruptionSignal(params: {
  housingRef: string;
  participantId?: string | null;
  organisationId?: string | null;
  narrative?: string;
  observedAt?: Date;
}): Promise<ContinuitySignal> {
  return recordContinuitySignal({
    kind: "other",
    participantId: params.participantId ?? null,
    organisationId: params.organisationId ?? null,
    sourceKind: "housing_arrangement",
    sourceRef: params.housingRef,
    payload: { narrative: params.narrative ?? null },
    dedupeKey: `housing-disruption-${params.housingRef}`,
    observedAt: params.observedAt ?? new Date(),
    confidence: "medium",
    status: "validated",
  });
}
