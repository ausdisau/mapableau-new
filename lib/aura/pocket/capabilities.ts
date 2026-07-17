import { auraFlags } from "../feature-flags";
import type { AuraPocketCapability, AuraPocketCapabilityState } from "./types";

function now(): string {
  return new Date().toISOString();
}

function baseState(
  capability: AuraPocketCapability,
  partial: Partial<AuraPocketCapabilityState>,
): AuraPocketCapabilityState {
  return {
    capability,
    state: "not_supported",
    provider: "none",
    localProcessing: false,
    networkRequired: false,
    sensitiveInputAllowed: false,
    limitations: [],
    checkedAt: now(),
    ...partial,
  };
}

/**
 * Deterministic capability detection — never claims on-device AI when absent.
 * Server-side: reports policy + platform hints; client bridges refine at runtime.
 */
export function detectPocketCapabilities(input?: {
  platform?: "android" | "ios" | "browser" | "simulator";
  nativeBridgeAvailable?: boolean;
  userDisabled?: AuraPocketCapability[];
}): AuraPocketCapabilityState[] {
  const platform = input?.platform ?? "browser";
  const disabled = new Set(input?.userDisabled ?? []);
  const pocketEnabled =
    auraFlags.pocketEnabled ||
    process.env.NODE_ENV === "test" ||
    process.env.MAPABLE_AURA_DEMO === "true";

  if (!pocketEnabled) {
    return ALL_CAPABILITIES.map((c) =>
      baseState(c, {
        state: "disabled_by_policy",
        limitations: ["MAPABLE_AURA_POCKET_ENABLED is false"],
      }),
    );
  }

  const nativeAi =
    input?.nativeBridgeAvailable === true &&
    auraFlags.nativeBridgesEnabled &&
    (platform === "android" || platform === "ios");

  return ALL_CAPABILITIES.map((capability) => {
    if (disabled.has(capability)) {
      return baseState(capability, {
        state: "disabled_by_user",
        limitations: ["Disabled by participant preference"],
      });
    }

    switch (capability) {
      case "offline_mission":
      case "offline_visit_pack":
        return baseState(capability, {
          state: auraFlags.offlineRuntimeEnabled ? "available" : "disabled_by_policy",
          provider: "deterministic",
          localProcessing: true,
          limitations: auraFlags.offlineRuntimeEnabled
            ? []
            : ["MAPABLE_AURA_OFFLINE_RUNTIME_ENABLED is false"],
        });
      case "local_plain_language":
      case "local_text_rewrite":
      case "local_summarisation":
        return baseState(capability, {
          state: "available",
          provider: "deterministic",
          localProcessing: true,
          sensitiveInputAllowed: true,
        });
      case "local_speech_recognition":
      case "local_image_description":
      case "local_multimodal_prompt":
        if (nativeAi && auraFlags.onDeviceAiEnabled) {
          return baseState(capability, {
            state: "available_with_limits",
            provider: platform === "android" ? "android_on_device" : "ios_on_device",
            localProcessing: true,
            sensitiveInputAllowed: true,
            limitations: ["Native bridge must be connected; not available in web-only build"],
          });
        }
        if (platform === "browser") {
          return baseState(capability, {
            state: "not_supported",
            provider: "browser",
            limitations: [
              "Browser on-device generative AI not available; use deterministic or cloud with consent",
            ],
          });
        }
        return baseState(capability, {
          state: auraFlags.onDeviceAiEnabled ? "not_supported" : "disabled_by_policy",
          limitations: auraFlags.onDeviceAiEnabled
            ? ["On-device AI not available on this device"]
            : ["MAPABLE_AURA_ON_DEVICE_AI_ENABLED is false"],
        });
      case "camera_capture":
        return baseState(capability, {
          state: platform === "browser" ? "permission_required" : "available_with_limits",
          provider: platform === "browser" ? "browser" : "native_bridge",
          localProcessing: true,
          sensitiveInputAllowed: true,
          limitations: ["Camera requires explicit permission; optional workflow"],
        });
      case "spatial_capture":
        if (nativeAi && auraFlags.spatialLensEnabled) {
          return baseState(capability, {
            state: "available_with_limits",
            provider: "native_bridge",
            localProcessing: true,
            limitations: ["Spatial output is provisional; not assessor verification"],
          });
        }
        return baseState(capability, {
          state: auraFlags.spatialLensEnabled ? "not_supported" : "disabled_by_policy",
          provider: "deterministic",
          localProcessing: true,
          limitations: ["Manual measurement path available without spatial hardware"],
        });
      case "symbol_rendering":
        return baseState(capability, {
          state: auraFlags.adaptiveCommunicationEnabled ? "available" : "disabled_by_policy",
          provider: "deterministic",
          localProcessing: true,
          limitations: auraFlags.waiAdaptEnabled
            ? ["WAI-Adapt experimental; standard text always present"]
            : ["Symbol mode optional; standard text always present"],
        });
      case "text_to_speech":
        return baseState(capability, {
          state: "available_with_limits",
          provider: platform === "browser" ? "browser" : "deterministic",
          localProcessing: true,
        });
      case "haptic_guidance":
        return baseState(capability, {
          state: platform === "browser" ? "not_supported" : "permission_required",
          provider: platform === "browser" ? "none" : "native_bridge",
        });
      case "local_encrypted_storage":
        return baseState(capability, {
          state: "available_with_limits",
          provider: platform === "browser" ? "browser" : "native_bridge",
          localProcessing: true,
          sensitiveInputAllowed: true,
          limitations: [
            "Web: structured storage with namespace; native: encrypted storage when bridge connected",
            "Plain localStorage is never used for sensitive snapshots",
          ],
        });
      case "background_sync":
        return baseState(capability, {
          state: auraFlags.offlineRuntimeEnabled ? "available_with_limits" : "disabled_by_policy",
          provider: "deterministic",
          networkRequired: true,
          limitations: ["Sync requires reconnect; offline approvals never auto-execute"],
        });
      default: {
        const _exhaustive: never = capability;
        return baseState(_exhaustive, { state: "not_supported" });
      }
    }
  });
}

const ALL_CAPABILITIES: AuraPocketCapability[] = [
  "offline_mission",
  "offline_visit_pack",
  "local_plain_language",
  "local_text_rewrite",
  "local_summarisation",
  "local_speech_recognition",
  "local_image_description",
  "local_multimodal_prompt",
  "camera_capture",
  "spatial_capture",
  "symbol_rendering",
  "text_to_speech",
  "haptic_guidance",
  "local_encrypted_storage",
  "background_sync",
];
