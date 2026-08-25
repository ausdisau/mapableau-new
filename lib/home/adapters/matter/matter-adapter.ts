import type {
  AuthorizedHomeAction,
  HomeActionReceipt,
} from "../../contracts/action";
import type { HomeCapabilityAdapter } from "../../contracts/adapter";
import type { HomeEndpoint } from "../../contracts/environment";
import type { CapabilityState } from "../../contracts/state";
import { buildHomeActionReceipt } from "../../core/receipts";
import { normalizeCapabilityState } from "../../core/state-normalizer";
import { mapableHomeFlags } from "@/lib/config/mapable-home";

/**
 * Matter adapter scaffold — discovery/execute disabled in P0.
 * Does not embed connectedhomeip / CHIP.
 */
export class MatterHomeAdapter implements HomeCapabilityAdapter {
  readonly id = "adapter:matter";
  readonly provider = "MATTER" as const;
  readonly status = "SCAFFOLDED" as const;

  async discover(): Promise<HomeEndpoint[]> {
    if (!mapableHomeFlags.matterEnabled) return [];
    return [];
  }

  async getState(
    endpointId: string,
    capabilityId: string,
  ): Promise<CapabilityState> {
    return normalizeCapabilityState({
      endpointId,
      capabilityId,
      value: null,
      confidence: "UNAVAILABLE",
      observedAt: null,
      explanation: "Matter adapter is scaffolded only in P0.",
    });
  }

  async execute(action: AuthorizedHomeAction): Promise<HomeActionReceipt> {
    return buildHomeActionReceipt({
      action,
      result: "NOT_SUPPORTED",
      stateBefore: null,
      stateAfter: null,
      explanation:
        "Matter execute is not available in P0. Real device actions remain disabled.",
      undoAvailable: false,
    });
  }

  async proposeSupport(capabilityId: string) {
    return {
      supported: false,
      notes: `Matter support for ${capabilityId} is scaffolded only.`,
    };
  }
}
