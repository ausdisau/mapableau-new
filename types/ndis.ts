export type NdisPlanSummary = {
  participantId: string;
  planStartDate?: string;
  planEndDate?: string;
  goals?: unknown[];
  budgets?: unknown[];
};

export type NdisBudgetSummary = {
  participantId: string;
  categories?: Record<string, number>;
};

export type NdisAdapterCapabilities = {
  getParticipantPlanSummary: boolean;
  getBudgetSummary: boolean;
  createClaimOrPaymentRequest: boolean;
  getSyncHealth: boolean;
};
