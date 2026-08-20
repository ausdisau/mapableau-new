import { adsFlagsConfig, type AdsFlagEnv } from "@/lib/ads/config/flags";
import type { AdMediationPolicy, AdProviderId } from "@/lib/ads/types";

/**
 * Configuration-driven provider order.
 * EthicalAds exclusive mode suppresses Google and other third-party networks
 * on the same rendered page.
 */
export function buildMediationPolicy(
  env: AdsFlagEnv = process.env,
): AdMediationPolicy {
  const ethicalAdsExclusive = adsFlagsConfig.isEthicalAdsEnabled(env);

  if (ethicalAdsExclusive) {
    const order: AdProviderId[] = [];
    if (adsFlagsConfig.isInternalEnabled(env)) {
      // House/internal may coexist only where policy permits; default: allow
      // MapAble house after EthicalAds no-fill, not concurrent paid third-party.
      order.push("ethicalads");
      order.push("mapable_internal");
    } else {
      order.push("ethicalads");
    }
    return {
      providerOrder: order,
      allowHouseFallback: adsFlagsConfig.isInternalEnabled(env),
      allowNoFill: true,
      pageAdMode: "ethicalads_exclusive",
    };
  }

  const order: AdProviderId[] = [];
  if (adsFlagsConfig.isInternalEnabled(env)) order.push("mapable_internal");
  if (adsFlagsConfig.isGoogleEnabled(env)) order.push("google_ad_manager");

  return {
    providerOrder: order,
    allowHouseFallback: adsFlagsConfig.isInternalEnabled(env),
    allowNoFill: true,
    pageAdMode: "open",
  };
}
