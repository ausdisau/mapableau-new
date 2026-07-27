import { randomUUID } from "crypto";

import { requireMission } from "@/lib/aura/mission/store";
import { appendWitness } from "@/lib/aura/witness";

/** Slim proposal drafts — Wave 7 Guardian venue verification only. */

export type AuraVenueVerificationRequest = {
  id: string;
  missionId: string;
  actionType: "venue_verification_request";
  recipientLabel: string;
  questions: string[];
  payload: Record<string, unknown>;
  createdAt: string;
  requiresFreshApproval: true;
  futureExecutionEligible: false;
};

const proposals = new Map<string, AuraVenueVerificationRequest>();

export function resetProposalStore(): void {
  proposals.clear();
}

export function createVenueVerificationRequest(input: {
  missionId: string;
  userId: string;
  alertId: string;
  recipientLabel?: string;
  questions?: string[];
  sourceReferences?: string[];
}): AuraVenueVerificationRequest {
  const mission = requireMission(input.missionId);
  if (mission.participantId !== input.userId) {
    throw new Error("AURA_MISSION_FORBIDDEN");
  }

  const proposal: AuraVenueVerificationRequest = {
    id: randomUUID(),
    missionId: input.missionId,
    actionType: "venue_verification_request",
    recipientLabel: input.recipientLabel ?? "Harbour Civic Centre reception",
    questions: input.questions ?? [
      "Is there an alternative accessible route while the western lift is unavailable?",
    ],
    payload: {
      alertId: input.alertId,
      sourceReferences: input.sourceReferences ?? [],
    },
    createdAt: new Date().toISOString(),
    requiresFreshApproval: true,
    futureExecutionEligible: false,
  };
  proposals.set(proposal.id, proposal);

  appendWitness({
    missionId: input.missionId,
    type: "proposal.venue_verification_request",
    summary: `Venue verification draft for ${proposal.recipientLabel}`,
    correlationId: mission.correlationId,
    actorType: "participant",
    actorId: input.userId,
    payload: { proposalId: proposal.id, alertId: input.alertId },
  });

  return proposal;
}

export function getProposal(
  proposalId: string,
): AuraVenueVerificationRequest | null {
  return proposals.get(proposalId) ?? null;
}

export function listProposalsForMission(
  missionId: string,
): AuraVenueVerificationRequest[] {
  return [...proposals.values()].filter((p) => p.missionId === missionId);
}
