import type { AuraOnDeviceAiAdapter } from "./types";

/** Deterministic simulator — never claims real on-device AI. */
export const simulatorOnDeviceAdapter: AuraOnDeviceAiAdapter = {
  adapterId: "aura-on-device-simulator",
  platform: "simulator",
  async detectCapabilities() {
    return [];
  },
  async describeImage(input) {
    return {
      description: `Simulated description for ${input.localReference}. Not a measurement.`,
      provisional: true,
      notAMeasurement: true,
    };
  },
  async rewriteText(input) {
    return { text: input.text, localOnly: true };
  },
};

export const noopOnDeviceAdapter: AuraOnDeviceAiAdapter = {
  adapterId: "aura-on-device-noop",
  platform: "browser",
  async detectCapabilities() {
    return [];
  },
};

/**
 * Native bridge contract — not connected unless native project exists.
 * Web build does not depend on native SDK.
 */
export const NATIVE_BRIDGE_CONTRACT = {
  version: "1.0.0",
  methods: [
    "detectCapabilities",
    "transcribeSpeech",
    "describeImage",
    "rewriteText",
    "summariseText",
    "runMultimodalPrompt",
  ],
  connected: false,
} as const;

export function selectOnDeviceAdapter(input?: {
  nativeBridgeConnected?: boolean;
}): AuraOnDeviceAiAdapter {
  if (input?.nativeBridgeConnected) {
    return simulatorOnDeviceAdapter;
  }
  return noopOnDeviceAdapter;
}

export { type AuraOnDeviceAiAdapter } from "./types";
