import type { HomeCapabilityKind } from "../../contracts/capability";

/**
 * Matter semantic mapping fixtures (reference only).
 * Web runtime is NOT a Matter controller — edge/native host required later.
 */
export type MatterClusterDescriptor = {
  clusterId: number;
  name: string;
  mapableCapability: HomeCapabilityKind | "UNKNOWN";
  notes: string;
};

export type MatterEndpointDescriptor = {
  nodeId: string;
  endpointId: number;
  clusters: MatterClusterDescriptor[];
};

export const MATTER_CLUSTER_FIXTURES: MatterClusterDescriptor[] = [
  {
    clusterId: 0x0006,
    name: "OnOff",
    mapableCapability: "TURN_ON",
    notes: "OnOff.onOff maps to TURN_ON / TURN_OFF when semantics match.",
  },
  {
    clusterId: 0x0008,
    name: "LevelControl",
    mapableCapability: "SET_LEVEL",
    notes: "CurrentLevel maps to SET_LEVEL.",
  },
  {
    clusterId: 0x0101,
    name: "DoorLock",
    mapableCapability: "LOCK",
    notes: "LockState maps to LOCK / UNLOCK. HIGH risk.",
  },
  {
    clusterId: 0x0102,
    name: "WindowCovering",
    mapableCapability: "SET_COVERING_POSITION",
    notes: "CurrentPositionLiftPercent100ths maps when genuinely equivalent.",
  },
  {
    clusterId: 0x0201,
    name: "Thermostat",
    mapableCapability: "SET_TEMPERATURE",
    notes: "OccupiedCooling/HeatingSetpoint maps to SET_TEMPERATURE within bounds.",
  },
];

export function mapMatterClusterToCapability(
  clusterName: string,
): HomeCapabilityKind | "UNKNOWN" {
  const found = MATTER_CLUSTER_FIXTURES.find(
    (c) => c.name.toLowerCase() === clusterName.toLowerCase(),
  );
  return found?.mapableCapability ?? "UNKNOWN";
}

/** Bridge interface for future edge / native Matter hosts. */
export type MatterBridge = {
  listEndpoints(): Promise<MatterEndpointDescriptor[]>;
  /** P0: always disabled. */
  commissionDevice(): Promise<{ supported: false; reason: string }>;
};
