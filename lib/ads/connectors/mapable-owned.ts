import type { ChannelConnector, ConnectorCapability } from "@/lib/ads/connectors/types";

const CAPABILITY: ConnectorCapability = {
  channel: "mapable",
  status: "demo",
  supportedObjectives: ["awareness", "traffic"],
  creativeFormats: ["image", "text", "sponsored_card"],
  currencyCodes: ["AUD"],
  canQuote: true,
  canReserve: true,
  canSubmit: true,
  canPause: true,
  canReport: true,
};

/** Synthetic MapAble-owned inventory connector — never hits production networks. */
export function createMapAbleOwnedConnector(): ChannelConnector {
  return {
    async capabilities() {
      return CAPABILITY;
    },
    async validateCreative(input: unknown) {
      const payload = input as { altText?: string; format?: string };
      const issues: string[] = [];
      if (!payload.altText || payload.altText.trim().length === 0) {
        issues.push("altText is required for informative imagery");
      }
      return { ok: issues.length === 0, issues };
    },
    async estimate() {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      return {
        indicative: true,
        expiresAt,
        totalMinor: "50000",
        currency: "AUD",
      };
    },
    async submit(input) {
      return {
        externalId: `mapable-synth-${input.internalOrderId}`,
        status: "accepted",
      };
    },
    async reconcile(orderId) {
      return {
        status: "accepted",
        observedAt: new Date().toISOString(),
        sourceId: `mapable-reconcile-${orderId}`,
      };
    },
    async pause() {
      return;
    },
    async fetchMetrics(orderId) {
      return {
        rows: [
          {
            metric: "impressions",
            value: 120,
            quality: "observed",
            orderId,
          },
        ],
        observedAt: new Date().toISOString(),
      };
    },
  };
}
