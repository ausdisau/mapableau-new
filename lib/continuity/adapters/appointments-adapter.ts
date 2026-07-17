/**
 * Wave 11 — Non-clinical appointment adapter.
 *
 * Explicitly non-clinical. Clinical appointments (medical, mental health,
 * allied health) are NOT in scope for AURA continuity actions and MUST be
 * hand-off cases to a human.
 */

import type { ContinuitySignal } from "@prisma/client";

import { recordContinuitySignal } from "@/lib/continuity/signals/signal-service";

export function isClinicalAppointment(labelOrKind: string | null | undefined): boolean {
  if (!labelOrKind) return false;
  const norm = labelOrKind.toLowerCase();
  return (
    norm.includes("medical") ||
    norm.includes("clinical") ||
    norm.includes("gp") ||
    norm.includes("doctor") ||
    norm.includes("psych") ||
    norm.includes("nurse") ||
    norm.includes("allied health") ||
    norm.includes("physio") ||
    norm.includes("occupational therapy") ||
    norm.includes("speech pathology")
  );
}

export async function emitAppointmentDisruptedSignal(params: {
  appointmentRef: string;
  labelOrKind: string;
  participantId?: string | null;
  organisationId?: string | null;
  observedAt?: Date;
}): Promise<ContinuitySignal> {
  if (isClinicalAppointment(params.labelOrKind)) {
    throw new Error("APPOINTMENTS_ADAPTER_CLINICAL_OUT_OF_SCOPE");
  }
  return recordContinuitySignal({
    kind: "other",
    participantId: params.participantId ?? null,
    organisationId: params.organisationId ?? null,
    sourceKind: "appointment_non_clinical",
    sourceRef: params.appointmentRef,
    payload: { labelOrKind: params.labelOrKind },
    dedupeKey: `appointment-disrupted-${params.appointmentRef}`,
    observedAt: params.observedAt ?? new Date(),
    confidence: "medium",
    status: "validated",
  });
}
