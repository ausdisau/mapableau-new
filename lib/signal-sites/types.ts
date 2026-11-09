import type { EvidenceState, SignalRating } from "@/lib/signal-sites/core";

export type ChallengeStatus =
  | "draft"
  | "published-local"
  | "paused"
  | "closed";

export type ChallengeTemplateId =
  | "street"
  | "journey"
  | "venue"
  | "crossing"
  | "sensory"
  | "temporary";

export type Challenge = {
  id: string;
  title: string;
  template: ChallengeTemplateId | string;
  boundary: string;
  focus: string;
  instruction: string;
  status: ChallengeStatus;
  createdAt: string;
  isSeed?: boolean;
};

export type ObservationKind = "place" | "journey";

export type Observation = {
  id: string;
  challengeId: string;
  title: string;
  kind: ObservationKind;
  claimBasis: string;
  feature: string;
  requirement: string;
  finding: string;
  measurement: string;
  method: string;
  source: string;
  observedAt: string;
  reviewBy: string;
  proposed: SignalRating;
  evidenceState: EvidenceState | string;
  moderation: string;
  reviewNote: string;
  notApplicable?: boolean;
  urgentHazard?: boolean;
  alternative?: string;
  alternativeVerified?: boolean;
  noVerifiedAlternative?: boolean;
  x?: number;
  y?: number;
  x2?: number;
  y2?: number;
  latitude?: string | number;
  longitude?: string | number;
  latitude2?: string | number;
  longitude2?: string | number;
  evidenceIds: string[];
  isSeed?: boolean;
};

export type AuditEvent = {
  id: string;
  action: string;
  detail: string;
  at: string;
  actor: string;
};

export type WorkspacePrefs = {
  highContrast: boolean;
  largeText: boolean;
  easyRead: boolean;
};

export type WorkspaceConsents = {
  localStore: boolean;
  includeLocation: boolean;
  includeEvidence: boolean;
};

export type SignalWorkspace = {
  version: 1;
  challenges: Challenge[];
  observations: Observation[];
  audit: AuditEvent[];
  prefs: WorkspacePrefs;
  consents: WorkspaceConsents;
};

export type SignalView =
  | "overview"
  | "challenges"
  | "challenge-detail"
  | "observe"
  | "review"
  | "observation-detail"
  | "compare"
  | "reports"
  | "privacy"
  | "audit";

export type ChallengeTemplate = {
  id: ChallengeTemplateId;
  name: string;
  icon: string;
  focus: string;
  instruction: string;
};

export const STORAGE_KEY = "mapable-signal-sites-workspace-v1";
export const EVIDENCE_DB = "mapable-signal-local-evidence-v1";

export const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  {
    id: "street",
    name: "Street & footpath access",
    icon: "01",
    focus: "Continuous paths, pinch points, surfaces and kerb ramps",
    instruction:
      "Document the exact segment, measurement method, alternative route and change conditions.",
  },
  {
    id: "journey",
    name: "Connected journey",
    icon: "02",
    focus: "From origin to destination, including every relevant connection",
    instruction:
      "Record each route segment separately. Unknown critical links must remain Unknown.",
  },
  {
    id: "venue",
    name: "Community venue access",
    icon: "03",
    focus: "Entry, circulation, toilets, information and staff communication",
    instruction:
      "Record feature-level details and only the area actually observed.",
  },
  {
    id: "crossing",
    name: "Crossing safety & information",
    icon: "04",
    focus: "Crossing controls, kerbs, timing, audible/tactile information",
    instruction:
      "Record observed conditions. Escalate urgent hazards for human attention.",
  },
  {
    id: "sensory",
    name: "Communication & sensory inclusion",
    icon: "05",
    focus: "AAC, easy-read wayfinding, acoustics, quiet spaces and signage",
    instruction:
      "Record practical communication and sensory features without requesting diagnoses.",
  },
  {
    id: "temporary",
    name: "Temporary access change",
    icon: "06",
    focus: "Lift outage, works, obstruction or other changing condition",
    instruction:
      "Add an observed time, review due date, and the current alternative.",
  },
];

export const ACCESS_FEATURES = [
  "Path / surface",
  "Crossing / kerb ramp",
  "Entrance / door",
  "Lift / ramp",
  "Accessible toilet",
  "Public transport / drop-off",
  "Wayfinding / signage",
  "Sensory environment",
  "Communication / AAC",
  "Seating / rest",
  "Temporary works / outage",
  "Other",
] as const;

export const EVIDENCE_METHODS = [
  "direct observation",
  "measurement",
  "community report",
  "operator report",
  "document review",
] as const;
