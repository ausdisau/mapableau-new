import type { HomeEnvironment, HomeEndpoint, HomeZone } from "../contracts/environment";
import type { CapabilityState } from "../contracts/state";

export const SIMULATOR_ADAPTER_ID = "adapter:simulator";
export const SYNTHETIC_ENVIRONMENT_ID = "env:synthetic-home";

export const SYNTHETIC_ZONES: HomeZone[] = [
  {
    id: "zone:entry",
    environmentId: SYNTHETIC_ENVIRONMENT_ID,
    displayName: "Entry",
    privacyZone: "SECURITY_SENSITIVE",
  },
  {
    id: "zone:living",
    environmentId: SYNTHETIC_ENVIRONMENT_ID,
    displayName: "Living room",
    privacyZone: "SHARED",
  },
  {
    id: "zone:bedroom",
    environmentId: SYNTHETIC_ENVIRONMENT_ID,
    displayName: "Bedroom",
    privacyZone: "PERSONAL",
  },
  {
    id: "zone:utility",
    environmentId: SYNTHETIC_ENVIRONMENT_ID,
    displayName: "Utility",
    privacyZone: "PERSONAL",
  },
  {
    id: "zone:building",
    environmentId: SYNTHETIC_ENVIRONMENT_ID,
    displayName: "Building",
    privacyZone: "SHARED",
  },
];

const now = () => new Date().toISOString();

export function createSyntheticEndpoints(): HomeEndpoint[] {
  const observed = now();
  return [
    {
      id: "sim-front-door",
      adapterId: SIMULATOR_ADAPTER_ID,
      environmentId: SYNTHETIC_ENVIRONMENT_ID,
      zoneId: "zone:entry",
      displayName: "Front door",
      category: "DOOR",
      capabilities: ["READ_STATE", "OPEN", "CLOSE"],
      availability: "AVAILABLE",
      stateConfidence: "KNOWN",
      lastObservedAt: observed,
    },
    {
      id: "sim-front-lock",
      adapterId: SIMULATOR_ADAPTER_ID,
      environmentId: SYNTHETIC_ENVIRONMENT_ID,
      zoneId: "zone:entry",
      displayName: "Front door lock",
      category: "LOCK",
      capabilities: ["READ_STATE", "LOCK", "UNLOCK"],
      availability: "AVAILABLE",
      stateConfidence: "KNOWN",
      lastObservedAt: observed,
    },
    {
      id: "sim-intercom",
      adapterId: SIMULATOR_ADAPTER_ID,
      environmentId: SYNTHETIC_ENVIRONMENT_ID,
      zoneId: "zone:entry",
      displayName: "Entry intercom",
      category: "INTERCOM",
      capabilities: ["CALL", "NOTIFY", "SPEAK", "READ_STATE"],
      availability: "AVAILABLE",
      stateConfidence: "KNOWN",
      lastObservedAt: observed,
    },
    {
      id: "sim-hall-light",
      adapterId: SIMULATOR_ADAPTER_ID,
      environmentId: SYNTHETIC_ENVIRONMENT_ID,
      zoneId: "zone:entry",
      displayName: "Hallway light",
      category: "LIGHT",
      capabilities: ["READ_STATE", "TURN_ON", "TURN_OFF", "SET_LEVEL"],
      availability: "AVAILABLE",
      stateConfidence: "KNOWN",
      lastObservedAt: observed,
    },
    {
      id: "sim-living-light",
      adapterId: SIMULATOR_ADAPTER_ID,
      environmentId: SYNTHETIC_ENVIRONMENT_ID,
      zoneId: "zone:living",
      displayName: "Living room light",
      category: "LIGHT",
      capabilities: ["READ_STATE", "TURN_ON", "TURN_OFF", "SET_LEVEL"],
      availability: "AVAILABLE",
      stateConfidence: "KNOWN",
      lastObservedAt: observed,
    },
    {
      id: "sim-living-blinds",
      adapterId: SIMULATOR_ADAPTER_ID,
      environmentId: SYNTHETIC_ENVIRONMENT_ID,
      zoneId: "zone:living",
      displayName: "Living room blinds",
      category: "COVERING",
      capabilities: ["READ_STATE", "SET_COVERING_POSITION", "OPEN", "CLOSE"],
      availability: "AVAILABLE",
      stateConfidence: "KNOWN",
      lastObservedAt: observed,
    },
    {
      id: "sim-thermostat",
      adapterId: SIMULATOR_ADAPTER_ID,
      environmentId: SYNTHETIC_ENVIRONMENT_ID,
      zoneId: "zone:living",
      displayName: "Living thermostat",
      category: "THERMOSTAT",
      capabilities: ["READ_STATE", "SET_TEMPERATURE"],
      availability: "AVAILABLE",
      stateConfidence: "KNOWN",
      lastObservedAt: observed,
    },
    {
      id: "sim-bedroom-light",
      adapterId: SIMULATOR_ADAPTER_ID,
      environmentId: SYNTHETIC_ENVIRONMENT_ID,
      zoneId: "zone:bedroom",
      displayName: "Bedroom light",
      category: "LIGHT",
      capabilities: ["READ_STATE", "TURN_ON", "TURN_OFF", "SET_LEVEL"],
      availability: "AVAILABLE",
      stateConfidence: "KNOWN",
      lastObservedAt: observed,
    },
    {
      id: "sim-adjustable-bed",
      adapterId: SIMULATOR_ADAPTER_ID,
      environmentId: SYNTHETIC_ENVIRONMENT_ID,
      zoneId: "zone:bedroom",
      displayName: "Adjustable bed (simulated)",
      category: "BED",
      capabilities: ["READ_STATE", "SET_POSITION"],
      availability: "AVAILABLE",
      stateConfidence: "KNOWN",
      lastObservedAt: observed,
    },
    {
      id: "sim-wheelchair-charger",
      adapterId: SIMULATOR_ADAPTER_ID,
      environmentId: SYNTHETIC_ENVIRONMENT_ID,
      zoneId: "zone:utility",
      displayName: "Wheelchair charger (simulated)",
      category: "CHARGER",
      capabilities: ["READ_STATE", "REPORT_CHARGING", "REPORT_BATTERY", "REPORT_AVAILABILITY"],
      availability: "UNKNOWN",
      stateConfidence: "UNKNOWN",
      lastObservedAt: null,
    },
    {
      id: "sim-building-lift",
      adapterId: SIMULATOR_ADAPTER_ID,
      environmentId: SYNTHETIC_ENVIRONMENT_ID,
      zoneId: "zone:building",
      displayName: "Building lift (simulated)",
      category: "LIFT",
      capabilities: ["READ_STATE", "REPORT_AVAILABILITY", "REPORT_FAULT"],
      availability: "UNKNOWN",
      stateConfidence: "UNKNOWN",
      lastObservedAt: null,
    },
    // Descriptor-only stub — no motion/control code.
    {
      id: "sim-fetch-robot-stub",
      adapterId: SIMULATOR_ADAPTER_ID,
      environmentId: SYNTHETIC_ENVIRONMENT_ID,
      zoneId: "zone:living",
      displayName: "Fetch robot (descriptor stub only)",
      category: "OTHER",
      capabilities: ["REPORT_AVAILABILITY", "REPORT_FAULT"],
      availability: "UNAVAILABLE",
      stateConfidence: "UNAVAILABLE",
      lastObservedAt: null,
      vendorRef: "stub:fetch-robot",
    },
  ];
}

export function createSyntheticEnvironment(): HomeEnvironment {
  return {
    id: SYNTHETIC_ENVIRONMENT_ID,
    displayName: "Synthetic MapAble Home",
    adapterId: SIMULATOR_ADAPTER_ID,
    zones: SYNTHETIC_ZONES,
    endpoints: createSyntheticEndpoints(),
    claimState: "SIMULATION",
  };
}

export function createInitialCapabilityStates(
  endpoints: HomeEndpoint[],
): Map<string, CapabilityState> {
  const states = new Map<string, CapabilityState>();
  const observed = now();

  for (const endpoint of endpoints) {
    for (const kind of endpoint.capabilities) {
      const key = `${endpoint.id}:${kind}`;
      if (
        endpoint.id === "sim-wheelchair-charger" ||
        endpoint.id === "sim-building-lift"
      ) {
        states.set(key, {
          endpointId: endpoint.id,
          capabilityId: kind,
          value: null,
          confidence: "UNKNOWN",
          observedAt: null,
          explanation:
            "State is unknown in the synthetic home; MapAble will not invent availability.",
        });
        continue;
      }
      if (endpoint.id === "sim-fetch-robot-stub") {
        states.set(key, {
          endpointId: endpoint.id,
          capabilityId: kind,
          value: null,
          confidence: "UNAVAILABLE",
          observedAt: null,
          explanation: "Fetch robot is a descriptor stub only — no control path.",
        });
        continue;
      }

      let value: unknown = null;
      if (kind === "READ_STATE" || kind === "TURN_ON" || kind === "TURN_OFF") {
        value = { on: false };
      } else if (kind === "LOCK" || kind === "UNLOCK") {
        value = { locked: true };
      } else if (kind === "OPEN" || kind === "CLOSE") {
        value = { open: false };
      } else if (kind === "SET_LEVEL" || kind === "SET_COVERING_POSITION" || kind === "SET_POSITION") {
        value = { position: kind === "SET_LEVEL" ? 0 : 50 };
      } else if (kind === "SET_TEMPERATURE") {
        value = { celsius: 21 };
      }

      states.set(key, {
        endpointId: endpoint.id,
        capabilityId: kind,
        value,
        confidence: "KNOWN",
        observedAt: observed,
      });
    }
  }

  return states;
}

/** Example purpose-bound delegation for tests (no real remote access). */
export const EXAMPLE_SUPPORT_WORKER_DELEGATION = {
  id: "delegation:support-worker-afternoon",
  participantId: "participant:demo",
  delegateId: "delegate:support-worker",
  displayName: "Support worker (afternoon)",
  validFrom: "2026-01-01T14:00:00.000Z",
  validUntil: "2026-01-01T17:00:00.000Z",
  allowedCapabilityKinds: ["OPEN", "TURN_ON", "TURN_OFF", "SET_COVERING_POSITION", "NOTIFY"],
  deniedCapabilityKinds: ["UNLOCK", "LOCK", "CALL"],
  purpose: "Afternoon support visit — internal access only",
  active: true,
} as const;
