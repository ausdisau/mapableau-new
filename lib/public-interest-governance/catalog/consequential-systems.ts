import type { DecisionImpact, GovernedSystemType } from "@prisma/client";

export type ConsequentialSystemCatalogItem = {
  systemKey: string;
  displayName: string;
  systemType: GovernedSystemType;
  ownerTeam: string;
  businessPurpose: string;
  affectedPeopleSummary: string;
  decisionRole: string;
  actionRiskCeiling: DecisionImpact;
  prohibitedUses: string[];
  knownLimitations: string;
  incidentContact: string;
};

export const CONSEQUENTIAL_SYSTEM_CATALOG: ConsequentialSystemCatalogItem[] = [
  {
    systemKey: "matching.worker-participant",
    displayName: "Worker and participant matching",
    systemType: "matching",
    ownerTeam: "Marketplace Operations",
    businessPurpose:
      "Surface compatible support workers for participant-led choice.",
    affectedPeopleSummary:
      "Participants, nominees, support workers and providers.",
    decisionRole:
      "Shortlists options; humans and participants remain the decision-makers.",
    actionRiskCeiling: "rights_affecting",
    prohibitedUses: [
      "Sole automated exclusion",
      "Protected attribute filtering",
      "Unexplainable ranking",
    ],
    knownLimitations:
      "Availability and preference data may be incomplete or stale.",
    incidentContact: "governance@mapable.example",
  },
  {
    systemKey: "ai-matching.explainable-shortlist",
    displayName: "AI-assisted matching shortlist",
    systemType: "recommendation",
    ownerTeam: "AI Matching",
    businessPurpose:
      "Explain and order matching options using consented profile and service data.",
    affectedPeopleSummary:
      "Participants and workers whose opportunities may be ordered.",
    decisionRole:
      "Recommends; cannot approve, deny or remove access by itself.",
    actionRiskCeiling: "rights_affecting",
    prohibitedUses: [
      "Autonomous denial",
      "Inference of disability beyond supplied profile data",
    ],
    knownLimitations:
      "Explanations are constrained to recorded evidence and may omit unavailable context.",
    incidentContact: "ai-governance@mapable.example",
  },
  {
    systemKey: "aura.participant-agent",
    displayName: "AURA participant agent",
    systemType: "generative_model",
    ownerTeam: "AURA",
    businessPurpose:
      "Help participants plan bounded actions under explicit authority envelopes.",
    affectedPeopleSummary:
      "Participants, delegates, providers and support workers touched by proposed actions.",
    decisionRole:
      "Plans and drafts; high-risk execution requires participant or human approval.",
    actionRiskCeiling: "high",
    prohibitedUses: [
      "Legal advice",
      "Medical advice",
      "Autonomous payment approval",
      "Consent alteration",
    ],
    knownLimitations:
      "May misunderstand goals or tool outputs; high-risk actions are gated.",
    incidentContact: "aura-safety@mapable.example",
  },
  {
    systemKey: "accessops.civic-digital-twin",
    displayName: "AccessOps civic digital twin",
    systemType: "reporting",
    ownerTeam: "AccessOps",
    businessPurpose:
      "Publish operational accessibility status without overstating certainty.",
    affectedPeopleSummary:
      "Disabled people, carers, venue operators and transport partners.",
    decisionRole:
      "Reports status and reliability; does not actuate physical infrastructure.",
    actionRiskCeiling: "safety_relevant",
    prohibitedUses: [
      "Universal access scores",
      "Fabricated uptime",
      "Physical actuation",
    ],
    knownLimitations:
      "Unknown or stale data must not be represented as accessible.",
    incidentContact: "accessops@mapable.example",
  },
  {
    systemKey: "credentials.eligibility-and-status",
    displayName: "Credential eligibility and status",
    systemType: "identity_or_credential",
    ownerTeam: "Federation",
    businessPurpose:
      "Issue and verify portable claims under consent and trust-registry rules.",
    affectedPeopleSummary:
      "Participants, delegates, workers and relying parties.",
    decisionRole:
      "Supports credential issuance and verification workflows with human review where required.",
    actionRiskCeiling: "legally_significant",
    prohibitedUses: [
      "Secret credential revocation",
      "Unconsented disclosure",
      "Opaque eligibility denial",
    ],
    knownLimitations:
      "Dependent on issuer quality, status-list freshness and consent scope.",
    incidentContact: "credentials@mapable.example",
  },
  {
    systemKey: "continuity.service-recovery",
    displayName: "Service continuity recovery",
    systemType: "workflow_automation",
    ownerTeam: "Continuity",
    businessPurpose:
      "Coordinate recovery options when important services are disrupted.",
    affectedPeopleSummary:
      "Participants, carers, delegates, providers and workers in recovery workflows.",
    decisionRole:
      "Prioritises options for human confirmation; emergency boundaries remain explicit.",
    actionRiskCeiling: "safety_relevant",
    prohibitedUses: [
      "Emergency service substitution",
      "Unbounded rescheduling",
      "Consent bypass",
    ],
    knownLimitations:
      "Recovery options depend on partner capacity and timely signals.",
    incidentContact: "continuity@mapable.example",
  },
  {
    systemKey: "moderation.trust-safety",
    displayName: "Trust and safety moderation",
    systemType: "moderation",
    ownerTeam: "Trust and Safety",
    businessPurpose:
      "Triage reports, complaints and potentially harmful public content.",
    affectedPeopleSummary:
      "Participants, workers, providers, public contributors and venue owners.",
    decisionRole:
      "Queues and supports moderation decisions; sanctions require human accountability.",
    actionRiskCeiling: "rights_affecting",
    prohibitedUses: [
      "Unappealable account restriction",
      "Protected class suppression",
    ],
    knownLimitations:
      "Signals can be incomplete, malicious or context-dependent.",
    incidentContact: "trust-safety@mapable.example",
  },
  {
    systemKey: "partner-api.risk-and-access",
    displayName: "Partner API risk and access controls",
    systemType: "access_control",
    ownerTeam: "Partner Platform",
    businessPurpose: "Control partner data access and integration risk.",
    affectedPeopleSummary:
      "Participants whose data may be accessed and partner developers.",
    decisionRole:
      "Enforces configured scopes and risk holds; review is required for high-impact changes.",
    actionRiskCeiling: "financial",
    prohibitedUses: [
      "Silent scope expansion",
      "Unreviewed production activation",
      "Secret partner sanctions",
    ],
    knownLimitations:
      "Risk signals may lag external incidents or partner-side changes.",
    incidentContact: "partners@mapable.example",
  },
];
