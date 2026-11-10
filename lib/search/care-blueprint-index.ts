/**
 * Engineering/internal OpenSearch index for Care blueprint requirements retrieval.
 * Not a production participant search surface. Prisma remains SoT for domain data.
 */

export const CARE_BLUEPRINT_INDEX_V1 = "mapable-care-blueprint-v1";

export const CARE_BLUEPRINT_INDEX_BODY = {
  settings: {
    analysis: {
      analyzer: {
        blueprint_text: {
          type: "custom",
          tokenizer: "standard",
          filter: ["lowercase", "asciifolding"],
        },
      },
    },
  },
  mappings: {
    properties: {
      docId: { type: "keyword" },
      sectionId: { type: "keyword" },
      sectionTitle: {
        type: "text",
        analyzer: "blueprint_text",
        fields: { keyword: { type: "keyword" } },
      },
      category: { type: "keyword" },
      content: { type: "text", analyzer: "blueprint_text" },
      invariants: { type: "text", analyzer: "blueprint_text" },
      releaseGate: { type: "boolean" },
      version: { type: "keyword" },
      source: { type: "keyword" },
    },
  },
} as const;

export const CARE_BLUEPRINT_SEARCH_FIELDS = [
  "sectionTitle^3",
  "content^2",
  "invariants^4",
  "category",
];

/** Seed chunks derived from the Next-Generation Care Platform Blueprint (v1.0). */
export const CARE_BLUEPRINT_SEED_CHUNKS: Array<{
  docId: string;
  sectionId: string;
  sectionTitle: string;
  category: string;
  content: string;
  invariants: string;
  releaseGate: boolean;
  version: string;
  source: string;
}> = [
  {
    docId: "care-blueprint-v1",
    sectionId: "thesis",
    sectionTitle: "Product thesis",
    category: "thesis",
    content:
      "MapAble Care is a participant-governed support operating system. A person can find, compare, meet, select, brief, schedule, pay and safely change support without surrendering control. AI suggests, explains and prepares; never decides, consents, clinically directs or silently transacts.",
    invariants:
      "participant owns the decision; no auto-assignment; AI has no substitute authority",
    releaseGate: true,
    version: "1.0",
    source: "MapAble_Next_Generation_Care_Platform_Blueprint",
  },
  {
    docId: "care-blueprint-v1",
    sectionId: "control-contract",
    sectionTitle: "Participant control contract",
    category: "control_contract",
    content:
      "Support is portable. Housing never captures support. Delegation is scoped. Consent is purpose-bound. Safety does not erase dignity of risk. The person can change their mind. No adverse consequence for speaking up. Human help remains available.",
    invariants:
      "never auto-assigns a worker; replace best match with options that may fit preferences; never assigned worker language",
    releaseGate: true,
    version: "1.0",
    source: "MapAble_Next_Generation_Care_Platform_Blueprint",
  },
  {
    docId: "care-blueprint-v1",
    sectionId: "mvp-scope",
    sectionTitle: "Controlled pilot scope",
    category: "mvp_scope",
    content:
      "Greater Sydney pilot: support discovery, introductions, agreements, scheduling, communications, incident pathways and transparent invoicing. Basic transport link only — requirements, pickup notes, quote/request handoff and schedule buffer; no autonomous dispatch. Jobs deferred.",
    invariants:
      "no automatic worker assignment; no clinical decision support; no NDIA claim submit in pilot AI path",
    releaseGate: true,
    version: "1.0",
    source: "MapAble_Next_Generation_Care_Platform_Blueprint",
  },
  {
    docId: "care-blueprint-v1",
    sectionId: "domain-objects",
    sectionTitle: "Key domain objects",
    category: "domain_objects",
    content:
      "Support relationship: SupportRequest, EligibilityRequirement, Preference, CandidateOption, Introduction, ServiceAgreement, Booking. Agent governance: AgentSession, ToolGrant, ActionEnvelope, ApprovalEvidence, SafetyEvent, EvaluationResult.",
    invariants:
      "Introduction is a first-class governed object; ActionEnvelope required for consequential actions",
    releaseGate: false,
    version: "1.0",
    source: "MapAble_Next_Generation_Care_Platform_Blueprint",
  },
  {
    docId: "care-blueprint-v1",
    sectionId: "release-gates",
    sectionTitle: "Release-blocking acceptance gates",
    category: "release_gates",
    content:
      "Cross-tenant and cross-participant negative tests pass for UI, API, exports, notifications, search and support operations. Isolation/security tests; AT task completion; no auto-assignment. Flags default off until sign-off.",
    invariants:
      "production claims forbidden until gates met; kill switches required",
    releaseGate: true,
    version: "1.0",
    source: "MapAble_Next_Generation_Care_Platform_Blueprint",
  },
  {
    docId: "care-blueprint-v1",
    sectionId: "service-lanes",
    sectionTitle: "Hybrid service lanes",
    category: "service_model",
    content:
      "MapAble Assured (employed), MapAble Choice (independent), Partner Provider. Lanes must be structurally separated and fairly presented. No pay-to-rank.",
    invariants: "no pay-to-rank; no hidden self-preference; ranking criteria are participant-selected",
    releaseGate: true,
    version: "1.0",
    source: "MapAble_Next_Generation_Care_Platform_Blueprint",
  },
];
