import { getNdiaHttpConfig } from "@/lib/ndia/shared/config";
import { logNdiaEvent } from "@/lib/ndia/shared/ndia-logger";

export type NdisParticipantVerificationResult = {
  mode: "mock" | "http";
  valid: boolean;
  participantNumber: string;
  status: string;
  message?: string;
  planSummary?: {
    planStart?: string;
    planEnd?: string;
    managementType?: string;
  };
  raw?: unknown;
};

export type NdisPlanSummaryResult = {
  mode: "mock" | "http";
  participantNumber: string;
  categories?: Array<{
    name: string;
    remainingCents?: number;
    totalCents?: number;
  }>;
  raw?: unknown;
};

function isParticipantApiEnabled(): boolean {
  return getNdiaHttpConfig().participantApiEnabled;
}

/**
 * Verify participant NDIS number against NDIA partner API.
 * Mock-first until NDIA publishes participant verification OpenAPI.
 */
export async function verifyParticipantNdisNumber(
  participantNumber: string
): Promise<NdisParticipantVerificationResult> {
  if (!isParticipantApiEnabled()) {
    logNdiaEvent("participant.verify.mock", {
      participantNumber: "****",
    });
    return {
      mode: "mock",
      valid: true,
      participantNumber,
      status: "mock_verified",
      message:
        "Participant verification mock — enable NDIA_PARTICIPANT_API_ENABLED when NDIA credentials are available.",
    };
  }

  throw new Error("NDIA_PARTICIPANT_API_NOT_IMPLEMENTED");
}

/**
 * Fetch plan/budget summary for a participant.
 * Scaffold only — requires NDIA plan API specification.
 */
export async function fetchParticipantPlanSummary(
  participantNumber: string
): Promise<NdisPlanSummaryResult> {
  if (!isParticipantApiEnabled()) {
    return {
      mode: "mock",
      participantNumber,
      categories: [],
      raw: {
        message: "Plan summary unavailable until NDIA plan API is configured.",
      },
    };
  }

  throw new Error("NDIA_PLAN_API_NOT_IMPLEMENTED");
}
