import {
  assertNoForbiddenTargeting,
  type SafeAdContext,
} from "@/lib/ads/ad-slot-policy";

export type AdEventType = "impression" | "click" | "hidden" | "reported";

export type AdEventPayload = {
  eventType: AdEventType;
  slotId: string;
  side?: "left" | "right";
  pageContext: string;
  context?: SafeAdContext;
  creativeId?: string;
};

const impressionKeys = new Set<string>();

function sessionImpressionKey(slotId: string, pageContext: string): string {
  return `mapable-ad-impression:${slotId}:${pageContext}`;
}

/** Session-level idempotency so the same slot does not spam impressions. */
export function shouldRecordImpression(slotId: string, pageContext: string): boolean {
  if (typeof window === "undefined") return false;
  const key = sessionImpressionKey(slotId, pageContext);
  if (sessionStorage.getItem(key)) return false;
  if (impressionKeys.has(key)) return false;
  impressionKeys.add(key);
  sessionStorage.setItem(key, "1");
  return true;
}

export async function recordAdEvent(payload: AdEventPayload): Promise<void> {
  assertNoForbiddenTargeting(payload as unknown as Record<string, unknown>);
  assertNoForbiddenTargeting((payload.context ?? {}) as Record<string, unknown>);

  await fetch("/api/ads/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventType: payload.eventType,
      slotId: payload.slotId,
      side: payload.side,
      pageContext: payload.pageContext,
      context: payload.context,
      creativeId: payload.creativeId,
    }),
    keepalive: payload.eventType === "click",
  });
}

export function trackAdImpression(
  payload: Omit<AdEventPayload, "eventType">,
): void {
  if (!shouldRecordImpression(payload.slotId, payload.pageContext)) return;
  void recordAdEvent({ ...payload, eventType: "impression" });
}
