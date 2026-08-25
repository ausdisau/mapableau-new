import type {
  AuthorizedHomeAction,
  HomeActionReceipt,
} from "../../contracts/action";
import type { HomeCapabilityAdapter } from "../../contracts/adapter";
import type { HomeEndpoint } from "../../contracts/environment";
import type { CapabilityState } from "../../contracts/state";
import {
  buildHomeActionReceipt,
  explainSimulatedAction,
} from "../../core/receipts";
import { normalizeCapabilityState } from "../../core/state-normalizer";
import {
  SIMULATOR_ADAPTER_ID,
  createInitialCapabilityStates,
  createSyntheticEndpoints,
  createSyntheticEnvironment,
} from "../../fixtures/synthetic-home";

/**
 * Only fully executable adapter in P0.
 * Mutates in-memory synthetic state only.
 */
export class SimulatorHomeAdapter implements HomeCapabilityAdapter {
  readonly id = SIMULATOR_ADAPTER_ID;
  readonly provider = "SIMULATOR" as const;
  readonly status = "READY" as const;

  private readonly endpoints: HomeEndpoint[];
  private readonly states: Map<string, CapabilityState>;
  private readonly endpointNames: Map<string, string>;

  constructor() {
    const env = createSyntheticEnvironment();
    this.endpoints = env.endpoints;
    this.states = createInitialCapabilityStates(this.endpoints);
    this.endpointNames = new Map(
      this.endpoints.map((e) => [e.id, e.displayName]),
    );
  }

  getEnvironment() {
    return createSyntheticEnvironment();
  }

  async discover(): Promise<HomeEndpoint[]> {
    return this.endpoints.map((e) => ({ ...e }));
  }

  async getState(
    endpointId: string,
    capabilityId: string,
  ): Promise<CapabilityState> {
    const key = `${endpointId}:${capabilityId}`;
    const existing = this.states.get(key);
    if (existing) return { ...existing };

    return normalizeCapabilityState({
      endpointId,
      capabilityId,
      value: null,
      confidence: "UNKNOWN",
      observedAt: null,
      explanation: "No observed state for this capability.",
    });
  }

  /**
   * Accepts AuthorizedHomeAction only.
   * Calling with a raw request type is a type error by design.
   */
  async execute(action: AuthorizedHomeAction): Promise<HomeActionReceipt> {
    const startedAt = new Date().toISOString();
    const readKey = `${action.endpointId}:READ_STATE`;
    const capKey = `${action.endpointId}:${action.capabilityKind}`;
    const stateBefore =
      this.states.get(capKey) ?? this.states.get(readKey) ?? null;

    const displayName =
      this.endpointNames.get(action.endpointId) ?? action.endpointId;

    if (action.capabilityKind === "COMMISSION_DEVICE" || action.capabilityKind === "SHARE_DEVICE") {
      return buildHomeActionReceipt({
        action,
        result: "NOT_SUPPORTED",
        stateBefore,
        stateAfter: stateBefore,
        explanation: "Commissioning and sharing are disabled in P0.",
        startedAt,
        undoAvailable: false,
      });
    }

    const observedAt = new Date().toISOString();
    let nextValue: unknown = stateBefore?.value ?? null;

    switch (action.capabilityKind) {
      case "TURN_ON":
        nextValue = { on: true };
        break;
      case "TURN_OFF":
        nextValue = { on: false };
        break;
      case "LOCK":
        nextValue = { locked: true };
        break;
      case "UNLOCK":
        nextValue = { locked: false };
        break;
      case "OPEN":
        nextValue = { open: true };
        break;
      case "CLOSE":
        nextValue = { open: false };
        break;
      case "SET_LEVEL":
        nextValue = { level: Number(action.parameters?.level ?? 50) };
        break;
      case "SET_COVERING_POSITION":
      case "SET_POSITION":
        nextValue = { position: Number(action.parameters?.position ?? 50) };
        break;
      case "SET_TEMPERATURE":
        nextValue = { celsius: Number(action.parameters?.celsius ?? 21) };
        break;
      case "NOTIFY":
      case "SPEAK":
      case "CALL":
      case "REQUEST_ASSISTANCE":
        nextValue = { lastEventAt: observedAt, ...(action.parameters ?? {}) };
        break;
      case "READ_STATE":
      case "REPORT_AVAILABILITY":
      case "REPORT_BATTERY":
      case "REPORT_CHARGING":
      case "REPORT_FAULT":
        // Observe only — preserve UNKNOWN.
        return buildHomeActionReceipt({
          action,
          result: "SUCCEEDED",
          stateBefore,
          stateAfter: stateBefore,
          explanation: explainSimulatedAction({
            capabilityKind: action.capabilityKind,
            endpointDisplayName: displayName,
            authorityBasis: action.authorityBasis,
          }),
          startedAt,
          undoAvailable: false,
        });
      default:
        return buildHomeActionReceipt({
          action,
          result: "NOT_SUPPORTED",
          stateBefore,
          stateAfter: stateBefore,
          explanation: `Capability ${action.capabilityKind} is not executable in the simulator.`,
          startedAt,
          undoAvailable: false,
        });
    }

    const stateAfter = normalizeCapabilityState({
      endpointId: action.endpointId,
      capabilityId: action.capabilityKind,
      value: nextValue,
      confidence: "KNOWN",
      observedAt,
    });
    this.states.set(capKey, stateAfter);
    this.states.set(readKey, {
      ...stateAfter,
      capabilityId: "READ_STATE",
    });

    return buildHomeActionReceipt({
      action,
      result: "SUCCEEDED",
      stateBefore,
      stateAfter,
      explanation: explainSimulatedAction({
        capabilityKind: action.capabilityKind,
        endpointDisplayName: displayName,
        authorityBasis: action.authorityBasis,
      }),
      startedAt,
      undoAvailable: true,
    });
  }

  /** Test helper — does not invent values for UNKNOWN endpoints. */
  getRawState(endpointId: string, capabilityId: string): CapabilityState | undefined {
    return this.states.get(`${endpointId}:${capabilityId}`);
  }
}

export function createSimulatorHomeAdapter(): SimulatorHomeAdapter {
  return new SimulatorHomeAdapter();
}
