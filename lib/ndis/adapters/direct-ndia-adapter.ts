import type { NdisAdapter } from "@/lib/ndis/ndis-adapter";

/** Placeholder until official NDIA API access and specs are available. */
export const directNdiaAdapter: NdisAdapter = {
  type: "direct_ndia",

  async getParticipantPlanSummary() {
    throw new Error("DIRECT_NDIA_NOT_APPROVED");
  },

  async getBudgetSummary() {
    throw new Error("DIRECT_NDIA_NOT_APPROVED");
  },

  async getSyncHealth() {
    return {
      healthy: false,
      adapterType: "direct_ndia",
      message: "Direct NDIA integration requires formal approval",
    };
  },

  async createClaimOrPaymentRequest() {
    throw new Error("DIRECT_NDIA_NOT_APPROVED");
  },
};
