import { auraFlags } from "../feature-flags";
import { detectPocketCapabilities } from "./capabilities";
import type { AuraInferenceMode, AuraInferenceSelection } from "./types";

export type InferenceSelectInput = {
  requestedMode: AuraInferenceMode;
  platform?: "android" | "ios" | "browser" | "simulator";
  nativeBridgeAvailable?: boolean;
  sensitiveContent?: boolean;
  cloudFallbackApproved?: boolean;
};

/**
 * Deterministic inference selector — user chooses mode; never inferred from disability.
 */
export function selectInferenceProvider(
  input: InferenceSelectInput,
): AuraInferenceSelection {
  const caps = detectPocketCapabilities({
    platform: input.platform,
    nativeBridgeAvailable: input.nativeBridgeAvailable,
  });
  const hasLocalAi = caps.some(
    (c) =>
      (c.capability === "local_image_description" ||
        c.capability === "local_multimodal_prompt") &&
      c.state === "available_with_limits",
  );

  switch (input.requestedMode) {
    case "no_ai":
      return {
        requestedMode: "no_ai",
        selectedProvider: "deterministic",
        localProcessing: true,
        networkRequired: false,
        fallbackUsed: false,
        limitations: ["Deterministic content and saved snapshots only"],
        consentRequired: false,
      };

    case "local_only":
      if (hasLocalAi && auraFlags.onDeviceAiEnabled) {
        return {
          requestedMode: "local_only",
          selectedProvider:
            input.platform === "android"
              ? "android_on_device"
              : input.platform === "ios"
                ? "ios_on_device"
                : "browser_local",
          localProcessing: true,
          networkRequired: false,
          fallbackUsed: false,
          limitations: [],
          consentRequired: false,
        };
      }
      return {
        requestedMode: "local_only",
        selectedProvider: "deterministic",
        localProcessing: true,
        networkRequired: false,
        fallbackUsed: true,
        limitations: [
          "No on-device generative model available; using deterministic services",
        ],
        consentRequired: false,
      };

    case "local_preferred":
      if (hasLocalAi && auraFlags.onDeviceAiEnabled) {
        return {
          requestedMode: "local_preferred",
          selectedProvider:
            input.platform === "android"
              ? "android_on_device"
              : input.platform === "ios"
                ? "ios_on_device"
                : "browser_local",
          localProcessing: true,
          networkRequired: false,
          fallbackUsed: false,
          limitations: [],
          consentRequired: input.sensitiveContent === true,
        };
      }
      if (
        auraFlags.onDeviceAiEnabled &&
        input.cloudFallbackApproved &&
        input.sensitiveContent
      ) {
        return {
          requestedMode: "local_preferred",
          selectedProvider: "cloud",
          localProcessing: false,
          networkRequired: true,
          fallbackUsed: true,
          limitations: ["Cloud fallback approved by participant for sensitive content"],
          consentRequired: true,
        };
      }
      if (auraFlags.onDeviceAiEnabled && !input.sensitiveContent) {
        return {
          requestedMode: "local_preferred",
          selectedProvider: "deterministic",
          localProcessing: true,
          networkRequired: false,
          fallbackUsed: true,
          limitations: [
            "Local AI unavailable; deterministic fallback without cloud",
          ],
          consentRequired: false,
        };
      }
      return {
        requestedMode: "local_preferred",
        selectedProvider: "deterministic",
        localProcessing: true,
        networkRequired: false,
        fallbackUsed: true,
        limitations: [
          "Cloud fallback requires explicit approval for sensitive content",
        ],
        consentRequired: input.sensitiveContent === true,
      };

    case "cloud_allowed":
      if (!auraFlags.onDeviceAiEnabled && !auraFlags.multimodalEnabled) {
        return {
          requestedMode: "cloud_allowed",
          selectedProvider: "deterministic",
          localProcessing: true,
          networkRequired: false,
          fallbackUsed: true,
          limitations: ["Multimodal and on-device AI disabled by policy"],
          consentRequired: false,
        };
      }
      return {
        requestedMode: "cloud_allowed",
        selectedProvider: hasLocalAi ? "browser_local" : "cloud",
        localProcessing: hasLocalAi,
        networkRequired: !hasLocalAi,
        fallbackUsed: !hasLocalAi,
        limitations: hasLocalAi
          ? ["Local processing preferred when available"]
          : ["Cloud processing per existing consent rules"],
        consentRequired: input.sensitiveContent === true,
      };

    default: {
      const _exhaustive: never = input.requestedMode;
      throw new Error(`Unknown inference mode: ${_exhaustive}`);
    }
  }
}

/** Local-only mode must never select cloud. */
export function assertLocalOnlyNoCloud(selection: AuraInferenceSelection): void {
  if (
    selection.requestedMode === "local_only" &&
    selection.selectedProvider === "cloud"
  ) {
    throw new Error("AURA_LOCAL_ONLY_CLOUD_VIOLATION");
  }
}
