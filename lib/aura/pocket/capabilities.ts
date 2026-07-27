import { auraFlags } from "@/lib/aura/feature-flags";
import type {
  AuraPocketCapability,
  AuraPocketCapabilityState,
} from "@/lib/aura/pocket/types";

const ALL_CAPABILITIES: AuraPocketCapability[] = [
  "offline_mission",
  "offline_visit_pack",
  "local_plain_language",
  "local_encrypted_storage",
  "background_sync",
];

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
    limitations: [],
    checkedAt: now(),
    ...partial,
  };
}

export function detectPocketCapabilities(input?: {
  platform?: "android" | "ios" | "browser" | "simulator";
}): AuraPocketCapabilityState[] {
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

  void input?.platform;

  return ALL_CAPABILITIES.map((capability) => {
    switch (capability) {
      case "offline_mission":
      case "offline_visit_pack":
      case "background_sync":
        return baseState(capability, {
          state: auraFlags.offlineRuntimeEnabled
            ? "available"
            : "disabled_by_policy",
          provider: "deterministic",
          localProcessing: true,
          limitations: auraFlags.offlineRuntimeEnabled
            ? []
            : ["MAPABLE_AURA_OFFLINE_RUNTIME_ENABLED is false"],
        });
      case "local_plain_language":
      case "local_encrypted_storage":
        return baseState(capability, {
          state: "available",
          provider: "deterministic",
          localProcessing: true,
        });
      default: {
        const _exhaustive: never = capability;
        return _exhaustive;
      }
    }
  });
}
