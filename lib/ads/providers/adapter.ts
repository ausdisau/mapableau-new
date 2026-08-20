import type {
  AdClickEvent,
  AdImpressionEvent,
  AdPlacementRequest,
  AdProviderCapabilities,
  AdProviderDecision,
  AdProviderId,
  AdRequestContext,
} from "@/lib/ads/types";

export interface AdProviderAdapter {
  readonly providerId: AdProviderId;
  getCapabilities(): AdProviderCapabilities;
  isAvailable(context: AdRequestContext): Promise<boolean>;
  requestPlacement(request: AdPlacementRequest): Promise<AdProviderDecision>;
  recordImpression?(event: AdImpressionEvent): Promise<void>;
  recordClick?(event: AdClickEvent): Promise<void>;
  destroy?(): Promise<void>;
}
