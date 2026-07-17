import { recordAdEvent, type AdEventPayload } from "@/lib/ads/ad-impression-service";

export function trackAdClick(
  payload: Omit<AdEventPayload, "eventType">,
): void {
  void recordAdEvent({ ...payload, eventType: "click" });
}

export function trackAdHidden(
  payload: Omit<AdEventPayload, "eventType">,
): void {
  void recordAdEvent({ ...payload, eventType: "hidden" });
}
