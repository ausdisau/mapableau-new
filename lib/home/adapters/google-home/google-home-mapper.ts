import type { HomeCapabilityKind } from "../../contracts/capability";

/**
 * Google Home trait mapping fixtures.
 * Types stay inside this adapter. Native Home APIs are Android/iOS only.
 */
export type GoogleHomeTraitMapping = {
  trait: string;
  mapableCapability: HomeCapabilityKind | "UNKNOWN";
  notes: string;
};

export const GOOGLE_HOME_TRAIT_FIXTURES: GoogleHomeTraitMapping[] = [
  {
    trait: "OnOff",
    mapableCapability: "TURN_ON",
    notes: "OnOff trait maps to TURN_ON / TURN_OFF when unambiguous.",
  },
  {
    trait: "OpenClose",
    mapableCapability: "OPEN",
    notes: "OpenClose maps to OPEN / CLOSE when semantics match.",
  },
  {
    trait: "WindowCovering",
    mapableCapability: "SET_COVERING_POSITION",
    notes: "WindowCovering maps to SET_COVERING_POSITION when valid.",
  },
  {
    trait: "TemperatureControl",
    mapableCapability: "SET_TEMPERATURE",
    notes: "TemperatureControl maps within configured bounds.",
  },
  {
    trait: "LockUnlock",
    mapableCapability: "LOCK",
    notes: "LockUnlock maps to LOCK / UNLOCK — HIGH risk; never vendor-only.",
  },
  {
    trait: "UnsupportedCustomTrait",
    mapableCapability: "UNKNOWN",
    notes: "Unknown traits remain UNKNOWN — no guessing.",
  },
];

export function mapGoogleTraitToCapability(
  trait: string,
): HomeCapabilityKind | "UNKNOWN" {
  const found = GOOGLE_HOME_TRAIT_FIXTURES.find(
    (t) => t.trait.toLowerCase() === trait.toLowerCase(),
  );
  return found?.mapableCapability ?? "UNKNOWN";
}

/** Cross-platform bridge contract — simulated in P0. */
export type GoogleHomeBridge = {
  listStructures(): Promise<Array<{ id: string; name: string }>>;
  listDevices(): Promise<
    Array<{ id: string; name: string; traits: string[]; roomId?: string }>
  >;
  /** P0: always disabled. */
  commissionDevice(): Promise<{ supported: false; reason: string }>;
};
