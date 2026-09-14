import type { MapAbleMissionPlan } from "@/lib/ai/platform/missions/types";
import type {
  FullLifeAssuranceSnapshot,
  FullLifeCandidateOption,
  FullLifeParticipantPriority,
  FullLifeResourceEnvelope,
} from "@/lib/platform/full-life";

export const baselineMission: MapAbleMissionPlan = {
  missionId: "mission-synthetic-001",
  objective: "Attend a synthetic job interview with accessible support",
  status: "needs_participant_decision",
  summary: "Synthetic cross-domain mission used only for Full Life tests.",
  activeAgents: [],
  domains: ["core", "jobs", "care", "transport", "access"],
  missionGraph: {
    nodes: [
      {
        id: "goal-synthetic",
        type: "goal",
        label: "Attend interview",
        status: "confirmed",
        sourceDomain: "core",
        recordId: null,
        details: "Synthetic participant-confirmed goal",
        evidenceRefs: ["participant-goal-synthetic"],
        confidence: null,
        limitations: [],
      },
    ],
    edges: [],
  },
  evidenceSummary: {
    verified: [],
    participantSupplied: [
      {
        id: "participant-goal-synthetic",
        origin: "participant_input",
        label: "Participant goal",
        detail: "Synthetic participant-confirmed goal",
        verified: false,
        observationDate: "2026-09-14T00:00:00.000Z",
        verificationState: "participant_confirmed",
        limitations: ["synthetic"],
        stale: false,
      },
    ],
    systemSupplied: [],
    inferred: [],
    conflicting: [],
    stale: [],
    missing: [],
  },
  uncertainties: [],
  continuityAlerts: [],
  recommendations: [],
  actionProposals: [
    {
      id: "proposal-transport-synthetic",
      action: "prepare_transport_request",
      payload: { wheelchairCompatible: true },
      informationToShare: ["wheelchair_access"],
      purpose: "Prepare accessible transport request",
      estimatedCost: null,
      unknownCosts: true,
      cancellationTerms: null,
      requiredConsent: ["transport_coordination"],
      requiredApprovals: ["participant"],
      payloadHash: "payload-transport-synthetic",
      expiryIso: "2026-09-15T00:00:00.000Z",
      status: "proposed",
    },
    {
      id: "proposal-care-synthetic",
      action: "prepare_care_request",
      payload: { support: "personal_assistance" },
      informationToShare: [],
      purpose: "Prepare personal assistance request",
      estimatedCost: null,
      unknownCosts: true,
      cancellationTerms: null,
      requiredConsent: ["care_coordination"],
      requiredApprovals: ["participant"],
      payloadHash: "payload-care-synthetic",
      expiryIso: "2026-09-15T00:00:00.000Z",
      status: "proposed",
    },
  ],
  humanReviewItems: [],
  approvalRequirements: ["participant"],
  nonAiPath: {
    label: "Talk to a person",
    href: "/support",
    description: "Synthetic non-AI fallback",
  },
  authorityCeiling: "SUGGEST_WITH_PARTICIPANT_APPROVAL",
  approvalBindings: [],
  activeAgentIds: [],
  traceId: "trace-synthetic-001",
  createdAt: "2026-09-14T00:00:00.000Z",
  updatedAt: "2026-09-14T00:00:00.000Z",
  planVersion: 1,
  basedOnVersion: null,
  changeReason: null,
};

export const baselinePriorities: FullLifeParticipantPriority[] = [
  {
    id: "power-wheelchair-compatible-vehicle",
    kind: "HARD_CONSTRAINT",
    statement: "Transport must fit my power wheelchair",
    source: "PARTICIPANT_CONFIRMED",
    confirmedAt: "2026-09-14T00:00:00.000Z",
  },
];

export const baselineResourceEnvelope: FullLifeResourceEnvelope = {
  missionId: baselineMission.missionId,
  items: [
    {
      type: "transport_capacity",
      state: "VERIFIED_AVAILABLE",
      label: "Synthetic accessible vehicle capacity",
      evidenceRefs: ["transport-capacity-synthetic"],
      limitations: ["synthetic"],
    },
    {
      type: "funding_authority",
      state: "VERIFIED_AVAILABLE",
      label: "Synthetic funding authority",
      evidenceRefs: ["funding-authority-synthetic"],
      limitations: ["synthetic"],
    },
  ],
  assumptions: [],
  unknowns: [],
  assumedAvailableTypes: [],
};

export const baselineCandidateOptions: FullLifeCandidateOption[] = [
  {
    optionRef: "option-accessible-synthetic",
    proposalIds: [
      "proposal-transport-synthetic",
      "proposal-care-synthetic",
    ],
    satisfiesPriorityIds: ["power-wheelchair-compatible-vehicle"],
    conflictsWithPriorityIds: [],
    requiredResourceTypes: ["transport_capacity", "funding_authority"],
    evidenceRefs: ["transport-capacity-synthetic"],
    commercialInfluenceRefs: [],
  },
];

export const baselineAssurance: FullLifeAssuranceSnapshot = {
  agency: {
    participantGoalActive: true,
    participantRejectedProposalIds: [],
    supporterInputAwaitingParticipantConfirmation: false,
  },
  authority: {
    state: "CONFIRMED",
    requiredScope: null,
    actorScope: [],
    evidenceRefs: ["authority-synthetic"],
  },
  consent: {
    state: "ACTIVE",
    purpose: "mission_coordination",
    recipient: null,
    approvedFields: [],
    evidenceRefs: ["consent-synthetic"],
  },
  accessibility: {
    hardConstraintIds: ["power-wheelchair-compatible-vehicle"],
    unmetHardConstraintIds: [],
    communicationAccessReady: true,
    inaccessibleSoleChannel: false,
    responseDeadlineMs: null,
    participantResponseTimeMs: null,
    evidenceRefs: ["access-synthetic"],
  },
  equality: {
    diagnosisOnlyExclusion: false,
    accessBarrierMisclassifiedAsParticipantUnsuitability: false,
  },
  evidence: {
    unknownRefs: [],
    staleRefs: [],
    conflictingRefs: [],
    inferredRefs: [],
    verificationInflationRefs: [],
  },
  continuity: {
    criticalAlertIds: [],
    crossDomainDependencyBroken: false,
    recoveryOptions: [],
  },
  disclosure: {
    proposedFields: [],
    approvedFields: [],
    recipient: null,
    purpose: null,
    minimumNecessary: true,
  },
  financial: {
    fundingAuthority: "CONFIRMED",
    duplicateTransactionRefs: [],
    priceMismatchRefs: [],
  },
  safeguarding: {
    state: "NONE",
    restrictiveDefaultProposed: false,
    evidenceRefs: [],
  },
  resilience: {
    nonAiPathAvailable: true,
    humanHelpAvailable: true,
    draftStatePreserved: true,
  },
};
