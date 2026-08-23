import { randomUUID } from "crypto";

import type {
  AccessibilityObservation,
  AccessibilityObservationIngest,
  GaisPromotionState,
} from "./contracts";
import { canTransitionPromotion } from "./promotion";

/**
 * Process-local pilot store. Not durable across instances.
 * No public participant identity exposure.
 */
const observations = new Map<string, AccessibilityObservation>();

export function resetTelemetryStoreForTests(): void {
  observations.clear();
}

export function ingestObservation(input: {
  payload: AccessibilityObservationIngest;
  ingestedByUserId: string;
  synthetic?: boolean;
}): AccessibilityObservation {
  const observationId = `gais-obs-${randomUUID()}`;
  const now = new Date().toISOString();

  const synthetic =
    input.synthetic === true ||
    input.payload.synthetic === true ||
    input.payload.sourceClass === "development_simulator" ||
    input.payload.sourceClass === "synthetic_fixture";

  const observation: AccessibilityObservation = {
    observationId,
    sourceDeviceId: input.payload.sourceDeviceId,
    sourceClass: input.payload.sourceClass,
    observedAt: input.payload.observedAt,
    geometry: input.payload.geometry,
    observationType: input.payload.observationType,
    values: { ...input.payload.values },
    confidence: input.payload.confidence,
    verificationState: "SENSOR_OBSERVED",
    promotionState: "received",
    synthetic,
    placeId: input.payload.placeId,
    receivedAt: now,
    ingestedByUserId: input.ingestedByUserId,
  };

  observations.set(observationId, observation);
  return observation;
}

export function getObservation(
  observationId: string,
): AccessibilityObservation | null {
  return observations.get(observationId) ?? null;
}

export function listObservations(options?: {
  promotionState?: GaisPromotionState;
  syntheticOnly?: boolean;
  limit?: number;
}): AccessibilityObservation[] {
  let rows = [...observations.values()];
  if (options?.promotionState) {
    rows = rows.filter((o) => o.promotionState === options.promotionState);
  }
  if (options?.syntheticOnly) {
    rows = rows.filter((o) => o.synthetic);
  }
  rows.sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
  return rows.slice(0, options?.limit ?? 100);
}

export function transitionObservationPromotion(input: {
  observationId: string;
  toState: GaisPromotionState;
}):
  | { ok: true; observation: AccessibilityObservation }
  | { ok: false; error: string } {
  const existing = observations.get(input.observationId);
  if (!existing) return { ok: false, error: "Observation not found" };

  if (!canTransitionPromotion(existing.promotionState, input.toState)) {
    return {
      ok: false,
      error: `Cannot transition from ${existing.promotionState} to ${input.toState}`,
    };
  }

  // Publishing does not upgrade verificationState to VERIFIED.
  const updated: AccessibilityObservation = {
    ...existing,
    promotionState: input.toState,
    verificationState: "SENSOR_OBSERVED",
  };
  observations.set(input.observationId, updated);
  return { ok: true, observation: updated };
}
