import { randomUUID } from "crypto";

import { auraFlags } from "../feature-flags";
import { getGuardian } from "../guardian";

export type PredictiveGuardianFinding = {
  id: string;
  missionId: string;
  signal:
    | "evidence_nearing_expiry"
    | "single_lift_dependency"
    | "entrance_closing_before_arrival"
    | "transport_unassigned"
    | "support_worker_timing_conflict"
    | "recurrent_service_interruption"
    | "low_telemetry_coverage"
    | "curb_regularly_unavailable"
    | "connection_buffer_insufficient";
  summary: string;
  source: string;
  assumptions: string[];
  confidence: number;
  uncertainty: string;
  participantActionOptions: string[];
  nonAiAlternative: string;
  describesSystemReliability: true;
  prohibitedParticipantScoring: false;
  createdAt: string;
};

const findings = new Map<string, PredictiveGuardianFinding[]>();

export function resetPredictiveGuardianStore(): void {
  findings.clear();
}

export function runPredictiveGuardianScan(input: {
  missionId: string;
  userId: string;
}): PredictiveGuardianFinding[] {
  if (
    !auraFlags.predictiveGuardianEnabled &&
    process.env.NODE_ENV !== "test"
  ) {
    throw new Error("MAPABLE_AURA_PREDICTIVE_GUARDIAN_DISABLED");
  }
  const guardian = getGuardian(input.missionId);
  if (guardian && guardian.userId !== input.userId) {
    throw new Error("AURA_MISSION_FORBIDDEN");
  }

  const result: PredictiveGuardianFinding[] = [
    {
      id: randomUUID(),
      missionId: input.missionId,
      signal: "single_lift_dependency",
      summary:
        "Preferred route depends on a single western lift. No verified alternative lift.",
      source: "journey_world.edges",
      assumptions: ["Western lift remains the only step-free vertical path"],
      confidence: 0.8,
      uncertainty: "Assessor may identify an unverified secondary path",
      participantActionOptions: [
        "Request venue verification of alternative lift",
        "Adjust arrival time",
        "Cancel monitoring",
      ],
      nonAiAlternative: "Contact venue reception via standard MapAble services",
      describesSystemReliability: true,
      prohibitedParticipantScoring: false,
      createdAt: new Date().toISOString(),
    },
  ];
  findings.set(input.missionId, result);
  return result;
}

export function listPredictiveFindings(missionId: string): PredictiveGuardianFinding[] {
  return findings.get(missionId) ?? [];
}
