import type {
  HomeAutonomyLevel,
  HomeCapability,
  HomeCapabilityKind,
  HomeRiskClass,
} from "../contracts/capability";

type Def = {
  kind: HomeCapabilityKind;
  displayName: string;
  description: string;
  riskClass: HomeRiskClass;
  minimumAuthorityLevel: HomeAutonomyLevel;
  requiresConfirmation: boolean;
  delegatable: boolean;
  explanationRequired: boolean;
  executableInP0: boolean;
};

const DEFINITIONS: Def[] = [
  { kind: "READ_STATE", displayName: "Read state", description: "Observe state without changing the environment.", riskClass: "LOW", minimumAuthorityLevel: "H0_OBSERVE", requiresConfirmation: false, delegatable: true, explanationRequired: false, executableInP0: true },
  { kind: "TURN_ON", displayName: "Turn on", description: "Turn on a light or similar low-risk endpoint.", riskClass: "LOW", minimumAuthorityLevel: "H3_CONFIRM", requiresConfirmation: true, delegatable: true, explanationRequired: true, executableInP0: true },
  { kind: "TURN_OFF", displayName: "Turn off", description: "Turn off a light or similar low-risk endpoint.", riskClass: "LOW", minimumAuthorityLevel: "H3_CONFIRM", requiresConfirmation: true, delegatable: true, explanationRequired: true, executableInP0: true },
  { kind: "OPEN", displayName: "Open", description: "Open an internal door or covering.", riskClass: "MODERATE", minimumAuthorityLevel: "H3_CONFIRM", requiresConfirmation: true, delegatable: true, explanationRequired: true, executableInP0: true },
  { kind: "CLOSE", displayName: "Close", description: "Close an internal door or covering.", riskClass: "MODERATE", minimumAuthorityLevel: "H3_CONFIRM", requiresConfirmation: true, delegatable: true, explanationRequired: true, executableInP0: true },
  { kind: "LOCK", displayName: "Lock", description: "Engage a lock. External locks are HIGH risk.", riskClass: "HIGH", minimumAuthorityLevel: "H3_CONFIRM", requiresConfirmation: true, delegatable: false, explanationRequired: true, executableInP0: true },
  { kind: "UNLOCK", displayName: "Unlock", description: "Disengage a lock. External unlocks are HIGH risk.", riskClass: "HIGH", minimumAuthorityLevel: "H3_CONFIRM", requiresConfirmation: true, delegatable: false, explanationRequired: true, executableInP0: true },
  { kind: "SET_POSITION", displayName: "Set position", description: "Set a positional actuator within declared bounds.", riskClass: "MODERATE", minimumAuthorityLevel: "H3_CONFIRM", requiresConfirmation: true, delegatable: true, explanationRequired: true, executableInP0: true },
  { kind: "SET_LEVEL", displayName: "Set level", description: "Set brightness or similar continuous level.", riskClass: "LOW", minimumAuthorityLevel: "H3_CONFIRM", requiresConfirmation: true, delegatable: true, explanationRequired: true, executableInP0: true },
  { kind: "SET_TEMPERATURE", displayName: "Set temperature", description: "Adjust thermostat within configured bounds.", riskClass: "MODERATE", minimumAuthorityLevel: "H3_CONFIRM", requiresConfirmation: true, delegatable: true, explanationRequired: true, executableInP0: true },
  { kind: "SET_COVERING_POSITION", displayName: "Set covering position", description: "Set blinds or window covering position.", riskClass: "LOW", minimumAuthorityLevel: "H3_CONFIRM", requiresConfirmation: true, delegatable: true, explanationRequired: true, executableInP0: true },
  { kind: "CALL", displayName: "Call", description: "Place an intercom or assistance call.", riskClass: "MODERATE", minimumAuthorityLevel: "H3_CONFIRM", requiresConfirmation: true, delegatable: true, explanationRequired: true, executableInP0: true },
  { kind: "NOTIFY", displayName: "Notify", description: "Send a notification to an authorised channel.", riskClass: "LOW", minimumAuthorityLevel: "H1_SUGGEST", requiresConfirmation: false, delegatable: true, explanationRequired: true, executableInP0: true },
  { kind: "SPEAK", displayName: "Speak", description: "Speak a short accessible message.", riskClass: "LOW", minimumAuthorityLevel: "H3_CONFIRM", requiresConfirmation: true, delegatable: true, explanationRequired: true, executableInP0: true },
  { kind: "REQUEST_ASSISTANCE", displayName: "Request assistance", description: "Request human assistance through MapAble channels.", riskClass: "MODERATE", minimumAuthorityLevel: "H3_CONFIRM", requiresConfirmation: true, delegatable: false, explanationRequired: true, executableInP0: true },
  { kind: "REPORT_AVAILABILITY", displayName: "Report availability", description: "Report availability without inventing missing data.", riskClass: "LOW", minimumAuthorityLevel: "H0_OBSERVE", requiresConfirmation: false, delegatable: true, explanationRequired: false, executableInP0: true },
  { kind: "REPORT_BATTERY", displayName: "Report battery", description: "Report battery level; UNKNOWN stays UNKNOWN.", riskClass: "LOW", minimumAuthorityLevel: "H0_OBSERVE", requiresConfirmation: false, delegatable: true, explanationRequired: false, executableInP0: true },
  { kind: "REPORT_CHARGING", displayName: "Report charging", description: "Report charging state; UNKNOWN stays UNKNOWN.", riskClass: "LOW", minimumAuthorityLevel: "H0_OBSERVE", requiresConfirmation: false, delegatable: true, explanationRequired: false, executableInP0: true },
  { kind: "REPORT_FAULT", displayName: "Report fault", description: "Report a fault or outage condition.", riskClass: "LOW", minimumAuthorityLevel: "H0_OBSERVE", requiresConfirmation: false, delegatable: true, explanationRequired: false, executableInP0: true },
  { kind: "COMMISSION_DEVICE", displayName: "Commission device", description: "Commission a device onto a fabric. Disabled in P0.", riskClass: "HIGH", minimumAuthorityLevel: "H3_CONFIRM", requiresConfirmation: true, delegatable: false, explanationRequired: true, executableInP0: false },
  { kind: "SHARE_DEVICE", displayName: "Share device", description: "Share device access. Disabled in P0.", riskClass: "HIGH", minimumAuthorityLevel: "H3_CONFIRM", requiresConfirmation: true, delegatable: false, explanationRequired: true, executableInP0: false },
  { kind: "START_ROUTINE", displayName: "Start routine", description: "Start a pre-declared home routine.", riskClass: "MODERATE", minimumAuthorityLevel: "H5_ROUTINE_ORCHESTRATION", requiresConfirmation: true, delegatable: false, explanationRequired: true, executableInP0: true },
  { kind: "UNKNOWN", displayName: "Unknown capability", description: "Unmapped capability — never auto-executed.", riskClass: "HIGH", minimumAuthorityLevel: "H3_CONFIRM", requiresConfirmation: true, delegatable: false, explanationRequired: true, executableInP0: false },
];

const byKind = new Map<HomeCapabilityKind, HomeCapability>(
  DEFINITIONS.map((d) => [d.kind, { id: `cap:${d.kind}`, ...d }]),
);

export const SAFETY_CRITICAL_KIND_ALIASES = [
  "WHEELCHAIR_PROPULSION",
  "HOIST_CONTROL",
  "VENTILATOR_CONTROL",
  "MEDICATION_DISPENSE",
  "ROBOTIC_TRANSFER",
] as const;

export function listHomeCapabilities(): HomeCapability[] {
  return Array.from(byKind.values());
}

export function getHomeCapability(kind: string): HomeCapability | undefined {
  return byKind.get(kind as HomeCapabilityKind);
}

export function requireHomeCapability(kind: HomeCapabilityKind): HomeCapability {
  const cap = byKind.get(kind);
  if (!cap) throw new Error(`Unknown home capability: ${kind}`);
  return cap;
}

export function isSafetyCriticalKind(kind: string): boolean {
  if ((SAFETY_CRITICAL_KIND_ALIASES as readonly string[]).includes(kind)) return true;
  return getHomeCapability(kind)?.riskClass === "SAFETY_CRITICAL";
}
