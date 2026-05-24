import type { NdisAdapterType } from "@prisma/client";

import type {
  NdisBudgetSummary,
  NdisPlanSummary,
} from "@/types/ndis";

export type NdisSyncHealth = {
  healthy: boolean;
  adapterType: NdisAdapterType;
  message?: string;
};

export type NdisSubmitClaimResult = {
  externalClaimId: string;
  status: string;
};

export interface NdisAdapter {
  type: NdisAdapterType;
  getParticipantPlanSummary(participantId: string): Promise<NdisPlanSummary>;
  getBudgetSummary(participantId: string): Promise<NdisBudgetSummary>;
  getSyncHealth(): Promise<NdisSyncHealth>;
  createClaimOrPaymentRequest(payload: unknown): Promise<NdisSubmitClaimResult>;
}
