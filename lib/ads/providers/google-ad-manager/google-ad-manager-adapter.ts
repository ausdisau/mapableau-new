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
  PlacementCode,
} from "@/lib/ads/types";

/**
 * Google Ad Manager (GPT) adapter foundation.
 * DOM slots only — never creates MapLibre markers.
 * Disabled by default; requires network code + unit path env.
 */
export class GoogleAdManagerAdapter implements AdProviderAdapter {
  readonly providerId = "google_ad_manager" as const;

  constructor(private readonly env: AdsFlagEnv = process.env) {}

  getCapabilities(): AdProviderCapabilities {
    return {
      mapMarkers: false,
      domSlots: true,
      contextualTargeting: true,
      coarseGeoTargeting: true,
      // MapAble disables personalised targeting for this surface.
      personalisedTargeting: false,
      requiresConsent: true,
      requiresExclusivePageMode: false,
    };
  }

  async isAvailable(_context: AdRequestContext): Promise<boolean> {
    if (!adsFlagsConfig.isGoogleEnabled(this.env)) return false;
    return Boolean(adsFlagsConfig.getGoogleNetworkCode(this.env));
  }

  resolveSlotKey(placement: PlacementCode): string | undefined {
    const def = getPlacement(placement);
    if (!def) return undefined;
    if (def.surface === "access") {
      return adsFlagsConfig.getGoogleAccessMapUnit(this.env);
    }
    return adsFlagsConfig.getGoogleProviderFinderUnit(this.env);
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

    // Personalised targeting is disabled by MapAble — ignore consent-for-personalised;
    // limited/contextual ads may still require a general ads consent flag from callers.
    if (!request.context.consentForPersonalisedAds) {
      // Treat as missing consent for third-party script load until ops define
      // a dedicated contextual-ads consent scope.
      return { fill: false, reasonCode: "MISSING_REQUIRED_CONSENT" };
    }

    const slotKey = this.resolveSlotKey(request.placement);
    if (!slotKey) {
      return { fill: false, reasonCode: "NO_FILL" };
    }

    // Ensure context is sanitised (side-effect free validation for callers)
    sanitizeExternalAdContext(request.context.internal);

    return {
      fill: true,
      kind: "external_dom",
      slotKey,
    };
  }
}

/** GPT script URL — limited ads path preferred when privacy restricted. */
export const GPT_SCRIPT_SRC =
  "https://securepubads.g.doubleclick.net/tag/js/gpt.js";
