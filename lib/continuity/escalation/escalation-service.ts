/**
 * Wave 11 — Continuity escalation.
 *
 * Escalates a continuity case to a human coordinator. AURA CANNOT close a
 * safeguarding case, alter consent, or dispatch emergency services. When
 * those thresholds are hit, the case MUST be escalated.
 */

import type { ContinuityCase } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { transitionContinuityCase } from "@/lib/continuity/cases/case-service";

export type EscalationReason =
  | "no_safe_option"
  | "participant_unable_to_decide"
  | "delegate_required"
  | "safeguarding_threshold"
  | "financial_authority_required"
  | "emergency_boundary_reached"
  | "coordinator_requested";

export interface EscalateCaseInput {
  caseId: string;
  reason: EscalationReason;
  actorUserId: string;
  narrative?: string;
}

export async function escalateContinuityCase(input: EscalateCaseInput): Promise<ContinuityCase> {
  const c = await prisma.continuityCase.findUnique({ where: { id: input.caseId } });
  if (!c) throw new Error("CONTINUITY_CASE_NOT_FOUND");
  const nextStatus = input.reason === "coordinator_requested" ? "monitoring" : "awaiting_approval";
  // We transition through the state machine when possible.
  try {
    return await transitionContinuityCase({
      caseId: c.id,
      toStatus: nextStatus,
      actorUserId: input.actorUserId,
      narrative: input.narrative,
    });
  } catch {
    // If the transition is illegal we still note the case's priority.
    return prisma.continuityCase.update({
      where: { id: c.id },
      data: { priority: "urgent" },
    });
  }
}
