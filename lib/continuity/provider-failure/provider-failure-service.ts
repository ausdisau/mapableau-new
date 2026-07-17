/**
 * Wave 11 — Provider Failure paths.
 *
 * Provider wind-down / closure / regulatory suspension trigger
 * continuity signals. Substitution requires a coordinator. AURA cannot
 * unilaterally switch a participant to another provider.
 */

import type { ContinuitySignal } from "@prisma/client";

import { recordContinuitySignal } from "@/lib/continuity/signals/signal-service";

export type ProviderFailureKind = "wind_down" | "closure" | "regulatory_suspension" | "operational_pause";

export async function emitProviderFailureSignal(params: {
  providerId: string;
  organisationId?: string | null;
  kind: ProviderFailureKind;
  narrative?: string;
  observedAt?: Date;
  affectedParticipantId?: string | null;
}): Promise<ContinuitySignal> {
  return recordContinuitySignal({
    kind: "provider_failure",
    participantId: params.affectedParticipantId ?? null,
    organisationId: params.organisationId ?? null,
    sourceKind: "provider",
    sourceRef: params.providerId,
    payload: { failureKind: params.kind, narrative: params.narrative ?? null },
    dedupeKey: `provider-failure-${params.providerId}-${params.kind}`,
    observedAt: params.observedAt ?? new Date(),
    confidence: "high",
    status: "validated",
  });
}

export function providerSubstitutionRequiresCoordinatorApproval(): true {
  return true;
}
