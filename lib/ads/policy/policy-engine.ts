import { adsFlagsConfig, type AdsFlagEnv } from "@/lib/ads/config/flags";
import type {
  AdPolicyDecision,
  AdPolicyReasonCode,
  AdRequestContext,
  PlacementCode,
} from "@/lib/ads/types";
import { getPlacement } from "@/lib/ads/placement-registry";
import { validateAdDestination } from "@/lib/ads/destination/validate-url";

export type PolicyInput = {
  context: AdRequestContext;
  placement: PlacementCode;
  providerId?: string;
  campaignStatus?: string;
  creativeStatus?: string;
  advertiserStatus?: string;
  destinationUrl?: string;
  providerEnabled?: boolean;
  placementEnabled?: boolean;
  surfaceEnabled?: boolean;
  exclusiveConflict?: boolean;
  requiresConsent?: boolean;
  env?: AdsFlagEnv;
};

/**
 * Deterministic advertising policy gate.
 * Returns allow or a stable reason code — never logs sensitive context.
 */
export function evaluateAdPolicy(input: PolicyInput): AdPolicyDecision {
  const env = input.env ?? process.env;

  if (adsFlagsConfig.isGlobalKillSwitch(env)) {
    return deny("GLOBAL_KILL_SWITCH");
  }
  if (!adsFlagsConfig.isEnabled(env)) {
    return deny("FEATURE_FLAG_OFF");
  }

  const placement = getPlacement(input.placement);
  if (!placement) {
    return deny("PLACEMENT_UNSUPPORTED");
  }

  if (input.surfaceEnabled === false) {
    return deny("SURFACE_DISABLED");
  }
  if (input.placementEnabled === false) {
    return deny("PLACEMENT_DISABLED");
  }

  if (input.exclusiveConflict) {
    return deny("EXCLUSIVE_PROVIDER_CONFLICT");
  }

  if (input.providerEnabled === false) {
    return deny("PROVIDER_DISABLED");
  }

  if (input.requiresConsent && !input.context.consentForPersonalisedAds) {
    // Contextual (non-personalised) may still proceed; callers set requiresConsent
    // only when the provider requires consent for the requested mode.
    return deny("MISSING_REQUIRED_CONSENT");
  }

  if (input.advertiserStatus && input.advertiserStatus !== "ACTIVE") {
    return deny("ADVERTISER_DISABLED");
  }

  if (
    input.campaignStatus &&
    input.campaignStatus !== "ACTIVE" &&
    input.campaignStatus !== "APPROVED"
  ) {
    return deny("CAMPAIGN_INACTIVE");
  }

  if (
    input.creativeStatus &&
    input.creativeStatus !== "APPROVED" &&
    input.creativeStatus !== "ACTIVE"
  ) {
    return deny("CREATIVE_UNAPPROVED");
  }

  if (input.destinationUrl) {
    const dest = validateAdDestination(input.destinationUrl, {
      requireHttps: false,
    });
    if (!dest.ok) {
      return deny("INVALID_DESTINATION");
    }
  }

  // Sensitive raw search context must not drive external targeting decisions here;
  // sanitiser handles outbound. Block obviously unsafe free-text for policy.
  const search = input.context.internal.searchContext?.toLowerCase() ?? "";
  if (
    search &&
    /\b(ndis\s*number|plan\s*balance|diagnosis|cerebral\s*palsy\s+physiotherapy\s+near\s+home)\b/i.test(
      search,
    )
  ) {
    // Do not block internal contextual fills solely on query content;
    // mark unsafe for external path via caller. Keep policy open for internal.
  }

  return { allowed: true };
}

function deny(reasonCode: AdPolicyReasonCode): AdPolicyDecision {
  return { allowed: false, reasonCode };
}
