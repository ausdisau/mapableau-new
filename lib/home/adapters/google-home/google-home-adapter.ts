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
import type { GoogleHomeBridge } from "./google-home-mapper";

/** Simulated Google bridge — no real account or SDK. */
export function createSimulatedGoogleHomeBridge(): GoogleHomeBridge {
  return {
    async listStructures() {
      return [{ id: "sim-structure-1", name: "Simulated Google Home" }];
    },
    async listDevices() {
      return [
        {
          id: "sim-google-light-1",
          name: "Simulated lamp",
          traits: ["OnOff"],
          roomId: "sim-room-living",
        },
      ];
    },
    async commissionDevice() {
      return {
        supported: false,
        reason: "Google Home commissioning is disabled in P0.",
      };
    },
  };
}

export class GoogleHomeAdapter implements HomeCapabilityAdapter {
  readonly id = "adapter:google-home";
  readonly provider = "GOOGLE_HOME" as const;
  readonly status = "SCAFFOLDED" as const;

  constructor(private readonly bridge: GoogleHomeBridge = createSimulatedGoogleHomeBridge()) {}

  async discover(): Promise<HomeEndpoint[]> {
    if (!mapableHomeFlags.googleEnabled) return [];
    // Simulated mapping only — still not executable.
    const devices = await this.bridge.listDevices();
    return devices.map((d) => ({
      id: d.id,
      adapterId: this.id,
      environmentId: "env:google-simulated",
      zoneId: d.roomId ?? "zone:unknown",
      displayName: d.name,
      category: "LIGHT" as const,
      capabilities: ["TURN_ON", "TURN_OFF", "READ_STATE"] as const,
      availability: "UNKNOWN" as const,
      stateConfidence: "UNKNOWN" as const,
      lastObservedAt: null,
      vendorRef: d.id,
    }));
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
      explanation: "Google Home adapter is scaffolded; no live device state in P0.",
    });
  }

  async execute(action: AuthorizedHomeAction): Promise<HomeActionReceipt> {
    return buildHomeActionReceipt({
      action,
      result: "NOT_SUPPORTED",
      stateBefore: null,
      stateAfter: null,
      explanation:
        "Google Home execute is not available in P0. Native Home APIs require Android/iOS.",
      undoAvailable: false,
    });
  }
}
