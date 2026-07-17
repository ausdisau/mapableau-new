import type { NdisBillingRoute } from "@prisma/client";

/**
 * Participant safeguards for billing / payment workflows.
 * Pure policy helpers — no PII.
 */
export function participantRequiredForRoute(route: NdisBillingRoute): boolean {
  return (
    route === "ndis_self_managed" ||
    route === "ndis_plan_managed" ||
    route === "ndis_ndia_managed" ||
    route === "private_pay"
  );
}

export function shouldHoldPaymentOnDispute(): boolean {
  return true;
}

export function mayParticipantRaiseDispute(input: {
  billableItemParticipantId: string | null;
  actorParticipantId: string;
}): boolean {
  return (
    input.billableItemParticipantId != null &&
    input.billableItemParticipantId === input.actorParticipantId
  );
}

/** Provider exception must never be treated as participant consent. */
export function providerExceptionCountsAsParticipantApproval(): false {
  return false;
}

export function sanitizeDisputeDescription(description: string): string {
  return description.trim().slice(0, 4000);
}
