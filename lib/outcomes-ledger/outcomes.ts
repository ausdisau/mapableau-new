import { createHash } from "crypto";

import {
  CONNECTED_CAPABILITY_SOURCE_VERSION,
  type OutcomeContract,
  type OutcomeObservation,
  type OutcomeReceipt,
} from "@/lib/connected-capability";

export function createParticipantOutcomeContract(input: {
  id?: string;
  participantId: string;
  goalStatement: string;
  indicators: string[];
  serviceEvidenceLinks?: string[];
  isSynthetic?: boolean;
}): OutcomeContract {
  return {
    id: input.id ?? `outcome-contract-${Date.now()}`,
    participantId: input.participantId,
    goalStatement: input.goalStatement,
    indicators: input.indicators,
    serviceEvidenceLinks: input.serviceEvidenceLinks ?? [],
    state: "active",
    authoredByParticipant: true,
    successScore: null,
    sourceVersion: CONNECTED_CAPABILITY_SOURCE_VERSION,
    isSynthetic: input.isSynthetic,
  };
}

export function createOutcomeReceipt(input: {
  contract: OutcomeContract;
  participantOutcome: string;
  serviceEvidenceSummary: string[];
  unresolvedItems?: string[];
  observations?: OutcomeObservation[];
}): OutcomeReceipt {
  const createdAt = new Date().toISOString();
  const payload = JSON.stringify({
    contractId: input.contract.id,
    participantId: input.contract.participantId,
    participantOutcome: input.participantOutcome,
    serviceEvidenceSummary: input.serviceEvidenceSummary,
    unresolvedItems: input.unresolvedItems ?? [],
    createdAt,
  });
  const hash = createHash("sha256").update(payload).digest("hex");

  return {
    id: `outcome-receipt-${hash.slice(0, 12)}`,
    contractId: input.contract.id,
    participantId: input.contract.participantId,
    participantOutcome: input.participantOutcome,
    serviceEvidenceSummary: input.serviceEvidenceSummary,
    unresolvedItems: input.unresolvedItems ?? [],
    immutable: true,
    createdAt,
    hash,
    isSynthetic: input.contract.isSynthetic,
  };
}

export function taylorFirstDayOutcome() {
  const contract = createParticipantOutcomeContract({
    id: "fixture-taylor-outcome-contract",
    participantId: "fixture-taylor-participant",
    goalStatement: "Complete first-day workplace induction at Harbour Civic Centre.",
    indicators: [
      "Arrived via accessible transport",
      "Step-free entrance used",
      "Induction session completed",
    ],
    serviceEvidenceLinks: [
      "transport_trip:fixture-outbound",
      "care_shift:fixture-support",
    ],
    isSynthetic: true,
  });

  const receipt = createOutcomeReceipt({
    contract,
    participantOutcome: "Induction completed.",
    serviceEvidenceSummary: [
      "Transport completed.",
      "Worker attended.",
      "Workplace entrance used.",
    ],
    unresolvedItems: ["Return transport arrived 22 minutes late."],
  });

  return { contract, receipt };
}
