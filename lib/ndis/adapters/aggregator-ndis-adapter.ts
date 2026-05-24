import type { NdisAdapter } from "@/lib/ndis/ndis-adapter";

/** Swappable aggregator adapter — configure via NDIS_AGGREGATOR_* env when approved. */
export const aggregatorNdisAdapter: NdisAdapter = {
  type: "aggregator",

  async getParticipantPlanSummary(participantId) {
    throw new Error("AGGREGATOR_NOT_CONFIGURED");
  },

  async getBudgetSummary(participantId) {
    throw new Error("AGGREGATOR_NOT_CONFIGURED");
  },

  async getSyncHealth() {
    return {
      healthy: false,
      adapterType: "aggregator",
      message: "Aggregator credentials not configured",
    };
  },

  async createClaimOrPaymentRequest() {
    throw new Error("AGGREGATOR_NOT_CONFIGURED");
  },
};
