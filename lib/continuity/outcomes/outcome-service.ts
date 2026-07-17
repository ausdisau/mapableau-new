/**
 * Wave 11 — Continuity outcomes.
 *
 * Every case that reaches `resolved` should record an outcome signal.
 * "Preserved" means the participant's goal was actually preserved — not
 * that a booking was successfully cancelled.
 */

import type { ContinuityOutcome, ContinuityOutcomeSignal } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { asJson } from "@/lib/prisma-json";

export interface RecordOutcomeInput {
  caseId: string;
  signal: ContinuityOutcomeSignal;
  observedById?: string | null;
  narrative?: string;
  detailsJson?: Record<string, unknown>;
}

export async function recordOutcome(input: RecordOutcomeInput): Promise<ContinuityOutcome> {
  return prisma.continuityOutcome.create({
    data: {
      caseId: input.caseId,
      signal: input.signal,
      observedById: input.observedById ?? null,
      narrative: input.narrative,
      detailsJson: asJson(input.detailsJson ?? undefined),
    },
  });
}
