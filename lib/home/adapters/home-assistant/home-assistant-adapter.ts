import type {
  AuthorizedHomeAction,
  HomeActionReceipt,
} from "../../contracts/action";
import type { HomeCapabilityAdapter } from "../../contracts/adapter";
import type { HomeEndpoint } from "../../contracts/environment";
import type { CapabilityState } from "../../contracts/state";
import { buildHomeActionReceipt } from "../../core/receipts";
import { normalizeCapabilityState } from "../../core/state-normalizer";

/**
 * Home Assistant placeholder — local gateway candidate for later.
 * No authentication or real device control in P0.
 */
export class HomeAssistantAdapter implements HomeCapabilityAdapter {
  readonly id = "adapter:home-assistant";
  readonly provider = "HOME_ASSISTANT" as const;
  readonly status = "SCAFFOLDED" as const;

  async discover(): Promise<HomeEndpoint[]> {
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
      explanation: "Home Assistant adapter is a placeholder in P0.",
    });
  }

  async execute(action: AuthorizedHomeAction): Promise<HomeActionReceipt> {
    return buildHomeActionReceipt({
      action,
      result: "NOT_SUPPORTED",
      stateBefore: null,
      stateAfter: null,
      explanation: "Home Assistant control is not implemented in P0.",
      undoAvailable: false,
    });
  }
}
