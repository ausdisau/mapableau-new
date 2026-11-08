import { createHash } from "node:crypto";

import type { DoohBuyingAdapter } from "@/lib/ads/connectors/types";
import { SYNTHETIC_DOOH_SCREENS } from "@/lib/ads/fixtures/dooh-sandbox-inventory";

/**
 * Provider-neutral synthetic DOOH adapter.
 * capabilityStatus is always demo — never live partner credentials.
 */
export function createDoohSandboxAdapter(): DoohBuyingAdapter {
  const orderState = new Map<
    string,
    { state: "accepted_by_partner" | "submission_unknown" | "playing" | "pause_pending"; externalOrderId?: string }
  >();

  return {
    async getCapabilities() {
      return {
        enabled: false,
        countries: ["AU"],
        modes: ["programmatic_guaranteed"],
        proofTiers: ["partner_reported_play", "modelled_impressions"],
      };
    },
    async searchInventory() {
      return {
        records: SYNTHETIC_DOOH_SCREENS,
        observedAt: new Date().toISOString(),
        sourceId: "dooh-sandbox-fixture",
      };
    },
    async requestQuote(proposal: unknown) {
      const termsHash = createHash("sha256")
        .update(JSON.stringify(proposal ?? {}))
        .digest("hex")
        .slice(0, 32);
      const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
      return {
        quoteId: `dooh-sandbox-q-${termsHash.slice(0, 8)}`,
        firm: false,
        expiresAt,
        termsHash,
        totalMinor: 154000,
        currency: "AUD",
      };
    },
    async submitApprovedOrder(input) {
      if (input.idempotencyKey.endsWith("-unknown")) {
        orderState.set(input.internalOrderId, { state: "submission_unknown" });
        return { state: "submission_unknown" };
      }
      const externalOrderId = `dooh-ext-${input.internalOrderId}`;
      orderState.set(input.internalOrderId, {
        state: "accepted_by_partner",
        externalOrderId,
      });
      return { state: "accepted_by_partner", externalOrderId };
    },
    async getOrderStatus(internalOrderId) {
      const row = orderState.get(internalOrderId);
      return {
        state: row?.state ?? "submission_pending",
        providerStatus: row?.state ?? "pending",
        observedAt: new Date().toISOString(),
      };
    },
    async requestPause(internalOrderId) {
      orderState.set(internalOrderId, {
        state: "pause_pending",
        externalOrderId: orderState.get(internalOrderId)?.externalOrderId,
      });
      return { state: "pause_pending" };
    },
    async requestCancel() {
      return { state: "cancel_pending", feeEstimateMinor: "0" };
    },
    async getDeliveryEvidence(internalOrderId) {
      const row = orderState.get(internalOrderId);
      if (!row || row.state === "submission_unknown") {
        return {
          proofTiers: "unavailable",
          observedAt: new Date().toISOString(),
        };
      }
      return {
        proofTiers: "partner_reported_play",
        observedPlays: 7,
        estimatedImpressions: 2100,
        observedAt: new Date().toISOString(),
      };
    },
  };
}
