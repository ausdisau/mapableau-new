import type { MissionMaturityState } from "./maturity";

export type MissionVerticalKey =
  | "at_continuity"
  | "health_navigator"
  | "home_living"
  | "foundational"
  | "transitions"
  | "events_tourism"
  | "emergency_ready"
  | "justice_advocacy"
  | "enterprise"
  | "age_at_home";

export type MissionVerticalDefinition = {
  key: MissionVerticalKey;
  title: string;
  owner: string;
  capabilityKey: string;
  masterFlag: string;
  canonicalDependencies: string[];
  maturity: MissionMaturityState;
  publicClaimAllowed: false;
  regulatoryBoundary: string;
};

export const MISSION_VERTICALS: MissionVerticalDefinition[] = [
  {
    key: "at_continuity",
    title: "AT Continuity",
    owner: "AT Continuity",
    capabilityKey: "vertical.at_continuity",
    masterFlag: "MAPABLE_AT_CONTINUITY_ENABLED",
    canonicalDependencies: [
      "equipment.scaffold",
      "continuity",
      "care",
      "transport",
      "billing",
    ],
    maturity: "concept",
    publicClaimAllowed: false,
    regulatoryBoundary:
      "No prescribe, clinical suitability, or funding approval",
  },
  {
    key: "health_navigator",
    title: "Health Navigator",
    owner: "Health Navigation",
    capabilityKey: "vertical.health_navigator",
    masterFlag: "MAPABLE_HEALTH_NAVIGATOR_ENABLED",
    canonicalDependencies: [
      "communication.passport",
      "transport",
      "accesscast",
      "companion.visit_pack",
    ],
    maturity: "concept",
    publicClaimAllowed: false,
    regulatoryBoundary: "No diagnosis, triage, treatment, or medication advice",
  },
  {
    key: "home_living",
    title: "Home and Living",
    owner: "Home Living",
    capabilityKey: "vertical.home_living",
    masterFlag: "MAPABLE_HOME_LIVING_ENABLED",
    canonicalDependencies: ["access.evidence", "continuity", "care", "transport"],
    maturity: "concept",
    publicClaimAllowed: false,
    regulatoryBoundary: "No eligibility determination or building certification",
  },
  {
    key: "foundational",
    title: "Foundational Supports",
    owner: "Foundational",
    capabilityKey: "vertical.foundational",
    masterFlag: "MAPABLE_FOUNDATIONAL_ENABLED",
    canonicalDependencies: ["community.information"],
    maturity: "concept",
    publicClaimAllowed: false,
    regulatoryBoundary: "No government endorsement or eligibility determination",
  },
  {
    key: "transitions",
    title: "Transitions",
    owner: "Transitions",
    capabilityKey: "vertical.transitions",
    masterFlag: "MAPABLE_TRANSITIONS_ENABLED",
    canonicalDependencies: ["handoff", "continuity", "care", "transport"],
    maturity: "concept",
    publicClaimAllowed: false,
    regulatoryBoundary: "Separate sent/received/ready/accepted/confirmed states",
  },
  {
    key: "events_tourism",
    title: "Events and Tourism",
    owner: "Event Access",
    capabilityKey: "vertical.events_tourism",
    masterFlag: "MAPABLE_EVENTS_TOURISM_ENABLED",
    canonicalDependencies: ["access.place", "accesscast", "transport"],
    maturity: "concept",
    publicClaimAllowed: false,
    regulatoryBoundary: "Sponsored destinations must not alter personal-fit",
  },
  {
    key: "emergency_ready",
    title: "Emergency Ready",
    owner: "Emergency Ready",
    capabilityKey: "vertical.emergency_ready",
    masterFlag: "MAPABLE_EMERGENCY_READY_ENABLED",
    canonicalDependencies: ["equipment", "transport", "continuity"],
    maturity: "concept",
    publicClaimAllowed: false,
    regulatoryBoundary: "No emergency-service replacement or auto-contact",
  },
  {
    key: "justice_advocacy",
    title: "Justice and Advocacy",
    owner: "Advocacy",
    capabilityKey: "vertical.justice_advocacy",
    masterFlag: "MAPABLE_JUSTICE_ADVOCACY_ENABLED",
    canonicalDependencies: ["handoff", "companion.visit_pack"],
    maturity: "concept",
    publicClaimAllowed: false,
    regulatoryBoundary: "No authoritative legal advice or auto-submission",
  },
  {
    key: "enterprise",
    title: "Enterprise",
    owner: "Enterprise",
    capabilityKey: "vertical.enterprise",
    masterFlag: "MAPABLE_ENTERPRISE_ENABLED",
    canonicalDependencies: ["jobs", "billing"],
    maturity: "concept",
    publicClaimAllowed: false,
    regulatoryBoundary: "No credit scoring or pay-to-rank procurement",
  },
  {
    key: "age_at_home",
    title: "Age at Home",
    owner: "Age at Home",
    capabilityKey: "vertical.age_at_home",
    masterFlag: "MAPABLE_AGE_AT_HOME_ENABLED",
    canonicalDependencies: ["care", "transport", "equipment"],
    maturity: "concept",
    publicClaimAllowed: false,
    regulatoryBoundary: "Never reuse NDIS price or claim logic for aged care",
  },
];

export type SharedMissionFeatureKey =
  | "framework"
  | "service_standard"
  | "service_diff"
  | "handoff_protocol"
  | "accessible_queue"
  | "human_navigators"
  | "funding_navigator"
  | "outcome_reporting"
  | "access_wallet"
  | "reliability_statements";

export type SharedMissionFeatureDefinition = {
  key: SharedMissionFeatureKey;
  title: string;
  capabilityKey: string;
  masterFlag: string;
  maturity: MissionMaturityState;
  publicClaimAllowed: false;
};

export const SHARED_MISSION_FEATURES: SharedMissionFeatureDefinition[] = [
  {
    key: "framework",
    title: "Shared Mission Framework",
    capabilityKey: "mission.framework",
    masterFlag: "MAPABLE_MISSION_FRAMEWORK_ENABLED",
    maturity: "scaffold",
    publicClaimAllowed: false,
  },
  {
    key: "service_standard",
    title: "Participant-defined Service Standard",
    capabilityKey: "mission.service_standard",
    masterFlag: "MAPABLE_SERVICE_STANDARD_ENABLED",
    maturity: "scaffold",
    publicClaimAllowed: false,
  },
  {
    key: "service_diff",
    title: "What Changed service diff",
    capabilityKey: "mission.service_diff",
    masterFlag: "MAPABLE_SERVICE_DIFF_ENABLED",
    maturity: "scaffold",
    publicClaimAllowed: false,
  },
  {
    key: "handoff_protocol",
    title: "Cross-provider Handoff Protocol",
    capabilityKey: "mission.handoff_protocol",
    masterFlag: "MAPABLE_HANDOFF_PROTOCOL_ENABLED",
    maturity: "concept",
    publicClaimAllowed: false,
  },
  {
    key: "accessible_queue",
    title: "Accessible Queue and Wait-Time Layer",
    capabilityKey: "mission.accessible_queue",
    masterFlag: "MAPABLE_ACCESSIBLE_QUEUE_ENABLED",
    maturity: "concept",
    publicClaimAllowed: false,
  },
  {
    key: "human_navigators",
    title: "Human Navigator Network",
    capabilityKey: "mission.human_navigators",
    masterFlag: "MAPABLE_HUMAN_NAVIGATORS_ENABLED",
    maturity: "concept",
    publicClaimAllowed: false,
  },
  {
    key: "funding_navigator",
    title: "Plan and Funding Period Navigator",
    capabilityKey: "mission.funding_navigator",
    masterFlag: "MAPABLE_FUNDING_NAVIGATOR_ENABLED",
    maturity: "concept",
    publicClaimAllowed: false,
  },
  {
    key: "outcome_reporting",
    title: "Outcome Reporting Studio",
    capabilityKey: "mission.outcome_reporting",
    masterFlag: "MAPABLE_OUTCOME_REPORTING_ENABLED",
    maturity: "concept",
    publicClaimAllowed: false,
  },
  {
    key: "access_wallet",
    title: "Personal Access Data Wallet",
    capabilityKey: "mission.access_wallet",
    masterFlag: "MAPABLE_ACCESS_WALLET_ENABLED",
    maturity: "concept",
    publicClaimAllowed: false,
  },
  {
    key: "reliability_statements",
    title: "Service Reliability Statement",
    capabilityKey: "mission.reliability_statements",
    masterFlag: "MAPABLE_RELIABILITY_STATEMENTS_ENABLED",
    maturity: "concept",
    publicClaimAllowed: false,
  },
];
