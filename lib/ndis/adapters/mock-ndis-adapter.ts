import type { NdisAdapter } from "@/lib/ndis/ndis-adapter";

export const mockNdisAdapter: NdisAdapter = {
  type: "mock",

  async getParticipantPlanSummary(participantId) {
    return {
      participantId,
      planStartDate: "2025-07-01",
      planEndDate: "2026-06-30",
      goals: [{ id: "g1", title: "Increase community participation" }],
      budgets: [{ category: "core", remaining: 12000 }],
    };
  },

  async getBudgetSummary(participantId) {
    return {
      participantId,
      categories: { core: 12000, capacity: 5000 },
    };
  },

  async getSyncHealth() {
    return { healthy: true, adapterType: "mock", message: "Mock adapter OK" };
  },

  async createClaimOrPaymentRequest() {
    return {
      externalClaimId: `mock-claim-${Date.now()}`,
      status: "submitted",
    };
  },
};
