import {
  CONNECTED_CAPABILITY_SOURCE_VERSION,
  type PartnerCapability,
} from "@/lib/connected-capability";

export const DEVELOPER_CAPABILITY_CATALOGUE: PartnerCapability[] = [
  {
    id: "cap-access-place",
    key: "access_place.public",
    title: "Public AccessPlace API",
    scopes: ["access_place.read"],
    allowsParticipantRecords: false,
    sandboxOnlyDefault: false,
  },
  {
    id: "cap-communication-render",
    key: "communication.render",
    title: "Communication rendering API",
    scopes: ["communication.render.synthetic"],
    allowsParticipantRecords: false,
    sandboxOnlyDefault: true,
  },
  {
    id: "cap-worker-credential-status",
    key: "workforce.credential_status",
    title: "Worker credential status (purpose-bound)",
    scopes: ["workforce.credential_status.purpose_bound"],
    allowsParticipantRecords: false,
    sandboxOnlyDefault: true,
  },
  {
    id: "cap-academy-completion-ref",
    key: "academy.completion_reference",
    title: "Academy completion reference API",
    scopes: ["academy.completion.read_ref"],
    allowsParticipantRecords: false,
    sandboxOnlyDefault: true,
  },
  {
    id: "cap-equipment-compat",
    key: "equipment.compatibility_questions",
    title: "Equipment compatibility questions",
    scopes: ["equipment.compat.read"],
    allowsParticipantRecords: false,
    sandboxOnlyDefault: true,
  },
  {
    id: "cap-regional-capacity",
    key: "regional.capacity",
    title: "Regional capacity API",
    scopes: ["regional.capacity.synthetic"],
    allowsParticipantRecords: false,
    sandboxOnlyDefault: true,
  },
  {
    id: "cap-outcome-aggregate",
    key: "outcomes.aggregate",
    title: "Outcome aggregation API",
    scopes: ["outcomes.aggregate.read"],
    allowsParticipantRecords: false,
    sandboxOnlyDefault: true,
  },
];

/** Capabilities that must never be exposed. */
export const DEVELOPER_FORBIDDEN_CAPABILITIES = [
  "participant.records.unrestricted",
  "access_passport.full",
  "communication_passport.full",
  "worker.screening.raw",
  "journeys.private",
  "home.exact_location",
  "complaints.raw",
  "ai.execution.unrestricted",
] as const;

export function getDeveloperPlatformShell() {
  return {
    portalPath: "/developers",
    sandbox: true,
    capabilities: DEVELOPER_CAPABILITY_CATALOGUE,
    forbidden: [...DEVELOPER_FORBIDDEN_CAPABILITIES],
    contractTestsRequired: true,
    partnerWritesDefault: false,
    unrestrictedParticipantData: false,
    sourceVersion: CONNECTED_CAPABILITY_SOURCE_VERSION,
    productionClaimState: "scaffold",
  };
}

export function sandboxTaylorWorkflowProjection() {
  return {
    workflow: "taylor_harbour_induction",
    synthetic: true,
    steps: [
      "communication_passport",
      "worker_readiness_blocked",
      "academy_completion_not_competency",
      "equipment_passport_shadow",
      "offline_visit_pack",
      "outcome_receipt",
      "ops_attention_queue",
      "regional_candidates",
    ],
    forbiddenFields: [
      "full_access_passport",
      "exact_home",
      "raw_screening",
      "raw_complaints",
    ],
  };
}
