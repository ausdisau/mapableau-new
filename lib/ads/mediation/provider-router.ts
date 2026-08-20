import { buildMediationPolicy } from "@/lib/ads/config/mediation";
import type { AdsFlagEnv } from "@/lib/ads/config/flags";
import { adsFlagsConfig, isAdsSurfaceEnabled } from "@/lib/ads/config/flags";
import {
  createEmptyKillSwitchState,
  isKilled,
  type KillSwitchState,
} from "@/lib/ads/config/kill-switches";
import { emitAdsEvent } from "@/lib/ads/observability/events";
import { getPlacement } from "@/lib/ads/placement-registry";
import { evaluateAdPolicy } from "@/lib/ads/policy/policy-engine";
import type { AdProviderAdapter } from "@/lib/ads/providers/adapter";
import { sanitizeExternalAdContext } from "@/lib/ads/privacy/sanitize-external-context";
import type {
  AdPlacementFill,
  AdPlacementRequest,
  AdPolicyReasonCode,
  AdProviderId,
  PlacementCode,
} from "@/lib/ads/types";

export type ProviderRouterDeps = {
  adapters: Partial<Record<AdProviderId, AdProviderAdapter>>;
  env?: AdsFlagEnv;
  killSwitches?: KillSwitchState;
  createDecisionId?: () => string;
};

/**
 * Mediates among providers. Configuration-driven order.
 * No-fill is a valid outcome — never blocks MapAble features.
 */
export async function routePlacementRequest(
  request: AdPlacementRequest,
  deps: ProviderRouterDeps,
): Promise<AdPlacementFill> {
  const env = deps.env ?? process.env;
  const kill = deps.killSwitches ?? createEmptyKillSwitchState(
    adsFlagsConfig.isGlobalKillSwitch(env),
  );
  const decisionId =
    deps.createDecisionId?.() ??
    `dec_${request.context.requestId}_${request.placement}`;

  emitAdsEvent({
    event: "ads.request",
    requestId: request.context.requestId,
    placementCode: request.placement,
    surface: request.context.internal.surface,
  });

  const placement = getPlacement(request.placement);
  if (!placement) {
    return noFill("PLACEMENT_UNSUPPORTED");
  }

  const surfaceEnabled = isAdsSurfaceEnabled(placement.surface, env);
  const globalKill = isKilled(kill, {
    surface: placement.surface,
    placementCode: request.placement,
  });
  if (globalKill.killed) {
    emitAdsEvent({
      event: "ads.kill_switch",
      reasonCode: globalKill.scope,
      placementCode: request.placement,
    });
    return noFill("GLOBAL_KILL_SWITCH");
  }

  const policy = evaluateAdPolicy({
    context: request.context,
    placement: request.placement,
    surfaceEnabled,
    env,
  });
  if (!policy.allowed) {
    emitAdsEvent({
      event: "ads.policy.blocked",
      reasonCode: policy.reasonCode,
      placementCode: request.placement,
      requestId: request.context.requestId,
    });
    return noFill(policy.reasonCode);
  }

  emitAdsEvent({
    event: "ads.policy.allowed",
    placementCode: request.placement,
    requestId: request.context.requestId,
  });

  const mediation = buildMediationPolicy(env);
  const timeoutMs = adsFlagsConfig.getExternalTimeoutMs(env);

  for (const providerId of mediation.providerOrder) {
    const providerKill = isKilled(kill, { providerId });
    if (providerKill.killed) continue;

    const adapter = deps.adapters[providerId];
    if (!adapter) continue;

    if (
      mediation.pageAdMode === "ethicalads_exclusive" &&
      providerId === "google_ad_manager"
    ) {
      continue;
    }

    if (providerId === "google_ad_manager" || providerId === "ethicalads") {
      if (!placement.capabilities.supportsExternalDOMSlot) continue;
    }
    if (
      providerId === "mapable_internal" &&
      placement.capabilities.supportsMapMarker &&
      request.placement.endsWith("sponsored-marker")
    ) {
      // markers only via internal
    }

    try {
      const available = await withTimeout(
        adapter.isAvailable(request.context),
        timeoutMs,
      );
      if (!available) continue;

      const decision = await withTimeout(
        adapter.requestPlacement(request),
        timeoutMs,
      );

      if (!decision.fill) continue;

      if (decision.kind === "internal") {
        emitAdsEvent({
          event: "ads.fill.internal",
          campaignId: decision.campaignId,
          placementCode: request.placement,
          decisionId,
        });
        return {
          kind: "internal",
          provider: "mapable_internal",
          decisionId,
          campaignId: decision.campaignId,
          creative: decision.creative,
          disclosureLabel: "Sponsored",
          clickPath: `/r/ads/${decisionId}`,
        };
      }

      if (
        providerId !== "google_ad_manager" &&
        providerId !== "ethicalads"
      ) {
        continue;
      }

      const externalContext = sanitizeExternalAdContext(
        request.context.internal,
      );
      emitAdsEvent({
        event:
          providerId === "google_ad_manager"
            ? "ads.fill.google"
            : "ads.fill.ethicalads",
        placementCode: request.placement,
        decisionId,
        provider: providerId,
      });
      return {
        kind: "external_dom",
        provider: providerId,
        decisionId,
        slotKey: decision.slotKey,
        disclosureLabel: "Sponsored",
        externalContext,
      };
    } catch (err) {
      const isTimeout = err instanceof Error && err.message === "timeout";
      emitAdsEvent({
        event: isTimeout ? "ads.provider_timeout" : "ads.provider_error",
        provider: providerId,
        placementCode: request.placement,
      });
      continue;
    }
  }

  emitAdsEvent({
    event: "ads.no_fill",
    placementCode: request.placement,
    requestId: request.context.requestId,
  });
  return noFill("NO_FILL");
}

function noFill(reasonCode: AdPolicyReasonCode): AdPlacementFill {
  return { kind: "no_fill", reasonCode };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

export function buildPlacementRequest(input: {
  placement: PlacementCode;
  requestId: string;
  surface: "access" | "provider_finder";
  bbox?: [number, number, number, number];
  zoom?: number;
  category?: string;
  regionCode?: string;
  consentForPersonalisedAds?: boolean;
  anonymousSessionRef?: string;
}): AdPlacementRequest {
  return {
    placement: input.placement,
    context: {
      requestId: input.requestId,
      consentForPersonalisedAds: input.consentForPersonalisedAds ?? false,
      anonymousSessionRef: input.anonymousSessionRef,
      internal: {
        surface: input.surface,
        placement: input.placement,
        viewportBBox: input.bbox,
        zoom: input.zoom,
        category: input.category,
        regionCode: input.regionCode,
      },
    },
  };
}
