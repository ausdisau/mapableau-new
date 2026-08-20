import type { AdsFlagEnv } from "@/lib/ads/config/flags";
import { adsFlagsConfig } from "@/lib/ads/config/flags";
import { getPlacement } from "@/lib/ads/placement-registry";
import type { AdProviderAdapter } from "@/lib/ads/providers/adapter";
import { sanitizeExternalAdContext } from "@/lib/ads/privacy/sanitize-external-context";
import type {
  AdPlacementRequest,
  AdProviderCapabilities,
  AdProviderDecision,
  AdRequestContext,
} from "@/lib/ads/types";

/**
 * EthicalAds adapter foundation.
 * Exclusive page mode when selected. Developer-audience network —
 * MapAble eligibility is not assumed; keep disabled pending publisher approval.
 */
export class EthicalAdsAdapter implements AdProviderAdapter {
  readonly providerId = "ethicalads" as const;

  constructor(private readonly env: AdsFlagEnv = process.env) {}

  getCapabilities(): AdProviderCapabilities {
    return {
      mapMarkers: false,
      domSlots: true,
      contextualTargeting: true,
      coarseGeoTargeting: false,
      personalisedTargeting: false,
      requiresConsent: false,
      requiresExclusivePageMode: true,
    };
  }

  async isAvailable(_context: AdRequestContext): Promise<boolean> {
    if (!adsFlagsConfig.isEthicalAdsEnabled(this.env)) return false;
    return Boolean(adsFlagsConfig.getEthicalAdsPublisherId(this.env));
  }

  async requestPlacement(
    request: AdPlacementRequest,
  ): Promise<AdProviderDecision> {
    if (!(await this.isAvailable(request.context))) {
      return { fill: false, reasonCode: "PROVIDER_DISABLED" };
    }

    const placement = getPlacement(request.placement);
    if (!placement?.capabilities.supportsExternalDOMSlot) {
      return { fill: false, reasonCode: "PLACEMENT_UNSUPPORTED" };
    }

    const publisherId = adsFlagsConfig.getEthicalAdsPublisherId(this.env);
    if (!publisherId) {
      return { fill: false, reasonCode: "NO_FILL" };
    }

    sanitizeExternalAdContext(request.context.internal);

    return {
      fill: true,
      kind: "external_dom",
      slotKey: `ethicalads:${publisherId}:${request.placement}`,
    };
  }
}

export const ETHICALADS_SCRIPT_SRC =
  "https://media.ethicalads.io/media/client/ethicalads.min.js";
