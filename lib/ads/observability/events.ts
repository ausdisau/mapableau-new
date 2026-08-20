/**
 * Structured ads observability events.
 * Never log disability/NDIS/PII request context.
 */

export type AdsEventName =
  | "ads.request"
  | "ads.policy.allowed"
  | "ads.policy.blocked"
  | "ads.fill.internal"
  | "ads.fill.google"
  | "ads.fill.ethicalads"
  | "ads.no_fill"
  | "ads.impression"
  | "ads.click"
  | "ads.provider_error"
  | "ads.provider_timeout"
  | "ads.kill_switch";

export type AdsEventPayload = {
  event: AdsEventName;
  requestId?: string;
  placementCode?: string;
  provider?: string;
  campaignId?: string;
  reasonCode?: string;
  surface?: string;
  decisionId?: string;
};

export function emitAdsEvent(payload: AdsEventPayload): void {
  // Structured console for foundation; audit wiring optional and privacy-safe.
  const safe = {
    ...payload,
    ts: new Date().toISOString(),
  };
  if (process.env.NODE_ENV === "test") return;
  // eslint-disable-next-line no-console
  console.info(JSON.stringify(safe));
}
