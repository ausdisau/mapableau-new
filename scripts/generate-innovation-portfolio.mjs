#!/usr/bin/env node
/**
 * Generates docs/innovation/* from structured portfolio data.
 * Documentation only — does not create Azure DevOps work items or product code.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const OUT = path.join(ROOT, "docs/innovation");
const EPICS_DIR = path.join(OUT, "epics");

const CLAIM = {
  VERIFIED: "Verified live",
  IMPL: "Implemented, not independently verified",
  DEV: "In development",
  PROPOSED: "Proposed",
  EXPLORATORY: "Exploratory",
  HISTORICAL: "Historical",
};

const WAVES = {
  foundation: "Foundation Wave",
  experience: "Experience Wave",
  intelligence: "Controlled Intelligence Wave",
  participation: "Participation Wave",
  commercial: "Platform Commercialisation Wave",
  rd: "R&D Wave",
};

/** @typedef {"REUSE"|"EXTEND"|"REFACTOR"|"NEW"|"DEFER"} Disposition */

/**
 * @typedef {object} Feature
 * @property {string} key
 * @property {string} title
 * @property {string} summary
 * @property {Disposition} disposition
 * @property {string[]} reusePaths
 * @property {string[]} acceptance
 */

/**
 * @typedef {object} Epic
 * @property {string} key
 * @property {string} slug
 * @property {string} title
 * @property {string} priority
 * @property {string} horizon
 * @property {string} wave
 * @property {string} claimState
 * @property {string[]} dependencies
 * @property {string} strategicOutcome
 * @property {string} participantOutcome
 * @property {string} problem
 * @property {string[]} scope
 * @property {string[]} nonGoals
 * @property {string[]} userGroups
 * @property {string[]} journeys
 * @property {string[]} capabilities
 * @property {string[]} sharedCore
 * @property {string[]} dataEntities
 * @property {string[]} apisEvents
 * @property {string} permissionModel
 * @property {string[]} consent
 * @property {string[]} humanGates
 * @property {string[]} a11y
 * @property {string[]} privacy
 * @property {string[]} safeguarding
 * @property {string} aiUse
 * @property {string[]} aiProhibited
 * @property {string[]} aiEvals
 * @property {string[]} audit
 * @property {string[]} observability
 * @property {string} complaints
 * @property {string[]} featureFlags
 * @property {string} failureFallback
 * @property {string[]} security
 * @property {string[]} dor
 * @property {string[]} dod
 * @property {string[]} mvp
 * @property {string[]} pilot
 * @property {string[]} scale
 * @property {string[]} kpis
 * @property {{risk:string,mitigation:string}[]} risks
 * @property {string[]} deps
 * @property {string} owner
 * @property {string[]} evidencePromotion
 * @property {Feature[]} features
 * @property {Record<string,string>} gateCriteria
 */

/** Shared Core mapping (requested name → canonical) */
const CORE_MAP = [
  ["User", "User — REUSE `prisma` User + NextAuth"],
  ["Organisation", "Organisation / OrganisationMember — REUSE"],
  ["Role", "MapAbleUserRole + UserRoleAssignment — REUSE (no Role model)"],
  ["Membership", "OrganisationMember / TenantMembership — REUSE"],
  ["DelegateGrant", "ParticipantAuthorityGrant + DelegateInvitation — EXTEND (do not create DelegateGrant)"],
  ["ParticipantProfile", "ParticipantProfile — REUSE"],
  ["AccessibilityPreference", "AccessibilityProfile (presentation) vs AccessPassport (functional) — REUSE both; keep separation C-010"],
  ["CommunicationPreference", "JSON on AccessibilityProfile + types — EXTEND if G1 requires first-class record"],
  ["MobilityAid", "JSON / AccessRequirement domain equipment_at — EXTEND; optional AtEquipmentAsset for AT Continuity"],
  ["ConsentRecord", "ConsentRecord — REUSE lib/consent"],
  ["DataPurpose", "purpose string on consent/authority — EXTEND toward typed DataPurpose if needed"],
  ["DisclosureReceipt", "ConsentReceipt — EXTEND (tenant, field list, expiry/supersession gaps)"],
  ["Provider / Worker", "Provider / Worker / WorkerProfile — REUSE"],
  ["Credential", "WorkerTrustCredential + TrainingCompletionRecord — EXTEND network"],
  ["Place", "AccessPlace (C-011 sole place identity) — REUSE"],
  ["AccessFeature", "AccessPlaceFeature / AccessCapabilityRecord — REUSE/EXTEND"],
  ["AccessObservation", "AccessObservationRecord + AccessEvidenceEnvelopeRecord — REUSE/EXTEND"],
  ["Verification", "AccessProvenanceStatus + change review — REUSE/EXTEND"],
  ["AccreditationAssessment", "AccessAccreditation* + ProviderAccreditation* — REUSE"],
  ["ServiceOffering / Availability / Care*", "lib/care CareRequest/CareShift — REUSE"],
  ["Trip / Vehicle / Driver", "TransportTrip* + Vehicle/Driver — REUSE TransportTrip as SoT"],
  ["Employer / Job / Application", "Job / JobApplication — REUSE"],
  ["AdjustmentRequest", "InterviewAdjustmentRequest + AccessAdjustmentRecord — REUSE/EXTEND"],
  ["MessageThread / Notification", "Conversation/Message — REUSE; notifications often stubbed — EXTEND"],
  ["SupportTicket / Complaint / Incident", "Complaint / IncidentReport — REUSE"],
  ["Funding / Quote / Invoice / Payment", "BillingInvoice / AbilityPay / Stripe — REUSE; live NDIA submit OFF"],
  ["Document / EvidenceItem / AuditEvent / FeatureFlag", "existing evidence + AuditEvent + fail-closed flags — REUSE"],
];

const COMMON_A11Y = [
  "WCAG 2.2 AA as release criterion (designed toward; do not claim conformance without independent audit)",
  "Semantic HTML, keyboard navigation, visible focus, zoom/reflow, contrast",
  "Screen-reader labels and live regions for status changes",
  "Reduced motion; non-drag alternatives; touch targets ≥44px",
  "Switch access and voice-independent workflow",
  "Plain-language and Easy Read pathways where appropriate; AAC-compatible interaction",
  "Accessible authentication and accessible timeout/session behaviour",
  "Manual assistive-technology testing required — automated axe/Playwright alone is insufficient (see docs/accessibility/ACCESSIBILITY_MANUAL_EVIDENCE_MATRIX.md — currently NOT_RUN)",
];

const COMMON_AI_EVALS = [
  "normal success",
  "missing evidence",
  "conflicting evidence",
  "stale information",
  "user refuses recommendation",
  "user revokes consent",
  "delegate lacks authority",
  "required tool unavailable",
  "unsafe requested action",
  "disclosure attempt",
  "hallucinated accessibility fact",
  "incorrect funding claim",
  "escalation required",
  "accessibility fallback required",
];

const GATE_KEYS = ["G0", "G1", "G2", "G3", "G4", "G5", "G6"];

/** @type {Epic[]} */
const epics = [
  {
    key: "01",
    slug: "access-graph",
    title: "MapAble Access Graph",
    priority: "P0",
    horizon: "Foundation — Priority 0",
    wave: "foundation",
    claimState: CLAIM.DEV,
    dependencies: [],
    strategicOutcome:
      "Canonical evidence-backed accessibility data graph used across MapAble — the foundation of the Map → Access Graph → Passport → Navigate → Orchestration flywheel.",
    participantOutcome:
      "Participants can rely on feature-level accessibility evidence with honest confidence, freshness, and dispute status — not a single 'accessible' boolean.",
    problem:
      "Accessibility information is fragmented, stale, or presented without provenance. Participants cannot tell community report from assessor measurement, or AI inference from verified fact.",
    scope: [
      "Places, entrances, paths of travel, doorway widths, thresholds, ramps, gradients, surfaces, stairs, lifts",
      "Toilets and Changing Places, parking, drop-off, kerb ramps, crossings, public transport access",
      "Sensory characteristics, hearing augmentation, lighting, acoustics, service counters, seating",
      "Workplaces, vehicles, providers, accessibility services as AccessEntityType subjects",
      "Every assertion: source, timestamp, evidence type, verification state, confidence, expiry/freshness, dispute/correction history",
      "Source classes: community reported, organisation supplied, assessor measured, sensor observed, AI inferred, independently verified, unknown, expired",
    ],
    nonGoals: [
      "Universal accessibility score for consequential decisions (permanently denied)",
      "Equating Premises Standards / DSAPT / WCAG compliance with 'works for this person'",
      "Exposing Personal Access Passport attributes via public Access API",
      "AI-inferred observations presented as verified fact or accreditation",
      "Second place identity SoT (C-011: AccessPlace only)",
    ],
    userGroups: [
      "Participants and support persons",
      "Venue operators and property managers",
      "Accredited assessors",
      "Councils / transport operators (consumers of later API)",
      "MapAble access data stewards",
    ],
    journeys: [
      "Participant views destination access features with confidence and freshness labels before travel",
      "Community contributor submits observation → queued as community_reported, not auto-published as verified",
      "Assessor measurement supersedes prior observation with provenance chain and expiry",
      "Dispute raised → disputed status; correction history retained append-only",
    ],
    capabilities: [
      "Canonical accessibility taxonomy / ontology",
      "Place and feature schema on AccessPlace",
      "Evidence provenance envelopes",
      "Observation and verification workflows",
      "Freshness and expiry engine",
      "Correction / dispute workflow",
      "Internal Access Graph read APIs",
    ],
    sharedCore: [
      "AccessPlace (C-011)",
      "AccessObservationRecord / AccessEvidenceEnvelopeRecord",
      "AccessCapabilityRecord",
      "AuditEvent",
      "FeatureFlag fail-closed",
      "Consent only when linking participant-contributed identity (default contributor modes)",
    ],
    dataEntities: [
      "AccessPlace",
      "AccessPlaceFeature",
      "AccessPlaceSource",
      "AccessObservationRecord",
      "AccessEvidenceEnvelopeRecord",
      "AccessChangeReviewRecord",
      "AccessCapabilityRecord",
      "Ontology concepts (intelligence-next)",
    ],
    apisEvents: [
      "Internal: /api/access-infrastructure/* (contracts in docs/access-infrastructure/API_CONTRACTS.md) — flag-gated",
      "Events: access.observation.created, access.evidence.superseded, access.dispute.opened, access.verification.completed",
      "Must not auto-publish AI or community observations to AccessPlace without human change review where required",
    ],
    permissionModel:
      "Public read of published place summaries only when deliberately published. Write: contributor roles scoped; assessor verification elevated; admin audit. Participant passport data never stored as place facts.",
    consent: [
      "Contributor identity sharing optional; default private contributor mode where supported",
      "No passport attributes written into graph entities",
      "Organisation-supplied data requires organisation authority",
    ],
    humanGates: [
      "Change review before overwriting published place capabilities (autoOverwriteBlocked)",
      "Promotion from AI inferred → independently verified requires assessor or accredited workflow",
      "Accreditation publication to graph requires Epic 06 human decision",
    ],
    a11y: COMMON_A11Y,
    privacy: [
      "Minimum-necessary disclosure of contributor identity",
      "No diagnosis or passport requirements in graph records",
      "Retention/expiry policies on observations",
    ],
    safeguarding: [
      "Do not encode personal safety scores",
      "Hazard observations are environmental facts with provenance — not participant risk ratings",
      "Escalation to human moderators for malicious/false reports",
    ],
    aiUse:
      "Optional classification/extraction only when Epic 04 bridges in; outputs must remain AI INFERRED — UNVERIFIED. Prefer deterministic taxonomy mapping.",
    aiProhibited: [
      "Awarding verification or accreditation from model output alone",
      "Presenting inferred door widths / ramp presence as verified measurements",
      "Silent overwrite of AccessPlace from AI",
    ],
    aiEvals: COMMON_AI_EVALS,
    audit: [
      "Append-only envelopes and change reviews",
      "AuditEvent on verification decisions and dispute resolutions",
      "Assessor identity recorded on verified publications",
    ],
    observability: [
      "Evidence freshness metrics",
      "Verification backlog",
      "Dispute rate / false report rate",
      "Coverage % places with feature-level evidence",
    ],
    complaints:
      "Place report + AccessChangeReview + engagement Complaint path for systemic issues; corrections never silently delete history.",
    featureFlags: [
      "MAPABLE_ACCESS_INFRASTRUCTURE_* / indoor / intelligence-next flags (default false)",
      "No public Living Access Fabric claim (claim.living_access_fabric_live prohibited)",
    ],
    failureFallback:
      "If evidence missing/stale → show uncertain, not inaccessible/accessible. Non-AI list/filter UI always available. Rollback via feature flags.",
    security: [
      "Zod at API boundaries; no client-asserted verificationStatus",
      "IDOR-safe place writes; server-derived actor",
      "Rate-limit contribution endpoints; sanitize free-text notes (ingestion shield when implemented)",
      "Do not log exact contributor PII in analytics",
    ],
    dor: [
      "Problem evidence (G0) and disability-led co-design plan (G1)",
      "Taxonomy version agreed; AccessPlace ownership confirmed",
      "Freeze waiver or freeze lift for implementation",
      "Feature flags and rollback documented",
    ],
    dod: [
      "Observation supports full provenance fields",
      "AI inferred cannot equal verified",
      "Freshness/expiry enforced in read APIs",
      "Tests for dispute and supersession",
      "Manual a11y for any user-facing contributor UI",
      "No public claim promotion without registry gates",
    ],
    mvp: [
      "Taxonomy + AccessPlace feature schema with provenance on new observations",
      "Community vs assessor source distinction visible in UI",
      "Internal read API with confidence/freshness",
    ],
    pilot: [
      "Limited venue cohort; monitoring; rollback; dispute handling",
      "Assessor verification workflow exercised end-to-end",
    ],
    scale: [
      "Coverage and freshness KPIs met; false report rate within threshold",
      "Continuous assurance (G6) dashboards live",
    ],
    kpis: [
      "% places with feature-level evidence",
      "Evidence freshness distribution",
      "Verified vs inferred observation ratio",
      "Successful corrections / dispute resolution time",
      "False/inaccurate accessibility report rate",
    ],
    risks: [
      {
        risk: "Parallel place registries / second SoT",
        mitigation: "Enforce C-011 AccessPlace; CI domain ownership",
      },
      {
        risk: "AI inference presented as fact",
        mitigation: "Hard provenance enum; UI honesty labels; evals",
      },
      {
        risk: "Stale data causing unsafe journeys",
        mitigation: "Expiry engine; uncertain state; claim.route_personally_safe prohibited",
      },
    ],
    deps: ["Existing AccessPlace map stack", "Ontology seeds", "AuditEvent"],
    owner: "Access Infrastructure / Living Access Fabric owners (lib/access/**)",
    evidencePromotion: [
      "Independent verification sample of place features",
      "Manual AT evidence for contributor UI",
      "Freshness SLA evidence",
      "Public claim registry gate for any external 'live graph' language",
    ],
    features: [
      {
        key: "01-f1",
        title: "Canonical accessibility taxonomy",
        summary: "Versioned ontology for access domains and features.",
        disposition: "EXTEND",
        reusePaths: ["lib/access/intelligence-next/ontology/", "docs/access-infrastructure/ONTOLOGY.md"],
        acceptance: ["Versioned concepts", "No diagnosis concepts as matching keys"],
      },
      {
        key: "01-f2",
        title: "Place and feature schema",
        summary: "Feature-level capabilities on AccessPlace without second place SoT.",
        disposition: "REUSE",
        reusePaths: ["AccessPlace", "AccessPlaceFeature", "AccessCapabilityRecord"],
        acceptance: ["C-011 preserved", "Unknown ≠ inaccessible"],
      },
      {
        key: "01-f3",
        title: "Evidence provenance system",
        summary: "Append-only evidence envelopes with source classes.",
        disposition: "EXTEND",
        reusePaths: ["AccessEvidenceEnvelopeRecord", "lib/access/intelligence-next/evidence/"],
        acceptance: ["source/timestamp/evidence type/verification/confidence/expiry/dispute fields"],
      },
      {
        key: "01-f4",
        title: "Observation workflow",
        summary: "Create observations with honest default statuses.",
        disposition: "EXTEND",
        reusePaths: ["AccessObservationRecord"],
        acceptance: ["AI defaults to AI inferred unverified", "Community defaults to community_reported"],
      },
      {
        key: "01-f5",
        title: "Verification workflow",
        summary: "Human/assessor verification with identity and audit.",
        disposition: "EXTEND",
        reusePaths: ["AccessChangeReviewRecord", "AccessProvenanceStatus"],
        acceptance: ["No silent overwrite", "Assessor identity recorded"],
      },
      {
        key: "01-f6",
        title: "Freshness and expiry engine",
        summary: "Policies expire stale evidence into outdated/unknown.",
        disposition: "EXTEND",
        reusePaths: ["lib/access/intelligence-next/evidence/freshness-policy.ts"],
        acceptance: ["Expired evidence cannot present as current verified"],
      },
      {
        key: "01-f7",
        title: "Correction and dispute workflow",
        summary: "Disputes and corrections with history.",
        disposition: "EXTEND",
        reusePaths: ["AccessPlaceReport", "AccessChangeReviewRecord"],
        acceptance: ["History retained", "Complaint path linked"],
      },
      {
        key: "01-f8",
        title: "Access Graph internal API",
        summary: "Flag-gated internal contracts for graph reads.",
        disposition: "EXTEND",
        reusePaths: ["docs/access-infrastructure/API_CONTRACTS.md", "packages/contracts"],
        acceptance: ["Zod boundaries", "No passport leakage"],
      },
    ],
    gateCriteria: {
      G0: "PASS if disability community + ops evidence shows unreliable/missing access data harms journeys; FAIL if only vendor interest.",
      G1: "PASS if paid co-design with disabled people on taxonomy/labels/confidence UX; FAIL if internal-only design.",
      G2: "PASS if rights/privacy/safeguarding review clears provenance honesty and no universal score; FAIL if claim language overreaches.",
      G3: "PASS if end-to-end observation→provenance→read with freshness on one place type; FAIL if UI invents verified status.",
      G4: "PASS if flagged limited cohort, monitoring, rollback, dispute process; FAIL if public claim enabled.",
      G5: "PASS if freshness/accuracy/dispute KPIs support scale; FAIL if high false-report rate unresolved.",
      G6: "PASS if continuous monitoring of freshness, disputes, accessibility regressions; FAIL if unmonitored drift.",
    },
  },
  {
    key: "02",
    slug: "personal-access-passport",
    title: "Personal Access Passport",
    priority: "P0",
    horizon: "Foundation",
    wave: "foundation",
    claimState: CLAIM.DEV,
    dependencies: ["01"],
    strategicOutcome:
      "Participant-controlled reusable access-needs profile for matching — not a universal disability disclosure record.",
    participantOutcome:
      "People control what access requirements exist, who sees them, for what purpose, and for how long — with receipts and revocation.",
    problem:
      "Participants repeatedly restate access needs; sharing is all-or-nothing; diagnosis is often wrongly treated as matching input.",
    scope: [
      "Wheelchair dimensions, step-free, doorway, transfer, communication/AAC, sensory, support-person, toilet, assistance animal, vehicle, fatigue/rest needs",
      "Granular sharing: venues, workers, drivers, providers, employers, assessors, AI systems, emergency, analytics",
      "Consent purpose, disclosure receipt, expiry, revocation, access log, participant review",
    ],
    nonGoals: [
      "Clinical dossier or diagnosis-required matching",
      "Automatic disclosure to employers via Jobs",
      "Public Access API exposure of passport attributes",
      "Merging AccessibilityProfile (UI prefs) into functional passport SoT",
    ],
    userGroups: ["Participants", "Delegates with ParticipantAuthorityGrant", "Workers/drivers/providers receiving scoped disclosures", "Assessors (scoped)"],
    journeys: [
      "Participant builds functional requirements; default private",
      "Shares minimum doorway + step-free with a venue for one visit; expiry set; receipt issued",
      "Revokes employer share before interview; access log shows prior disclosure",
      "Delegate with grant helps edit AAC prefs; cannot broaden disclosure beyond grant",
    ],
    capabilities: [
      "Functional requirement editor",
      "Granular purpose-bound sharing",
      "Disclosure receipts and access log",
      "Expiry and revocation",
      "Participant review and Easy Read/AAC pathways",
      "Non-diagnosis matching contract",
    ],
    sharedCore: ["AccessPassport (C-010)", "AccessRequirementRecord", "ConsentRecord/ConsentReceipt", "ParticipantAuthorityGrant", "AuditEvent"],
    dataEntities: ["AccessPassport", "AccessRequirementRecord", "ConsentRecord", "ConsentReceipt", "AccessibilityProfile (presentation only)"],
    apisEvents: [
      "GET/PATCH /api/access-infrastructure/passport (flag-gated)",
      "Events: passport.requirement.updated, passport.disclosure.granted, passport.disclosure.revoked",
    ],
    permissionModel: "Owner participant full control. Delegates only within ParticipantAuthorityGrant. Recipients see only granted attributes for purpose/window.",
    consent: ["Purpose-bound consent before any disclosure", "Micro-consent for AI tool access to passport fields", "Emergency context still purpose-scoped and audited"],
    humanGates: ["Broadening disclosure scopes beyond prior consent requires fresh consent", "Delegate escalation when grant insufficient"],
    a11y: COMMON_A11Y,
    privacy: ["Minimum-necessary attribute disclosure", "No diagnosis in matching payloads", "Retention aligned to purpose expiry"],
    safeguarding: ["Emergency disclosure boundaries documented; not a backdoor to full profile", "Human review for contested delegate misuse"],
    aiUse: "May read only consented attributes for orchestration/search; never infer requirements from diagnosis.",
    aiProhibited: ["Infer requirements from diagnosis", "Disclose passport to tools without consent gate", "Silently expand disclosure scopes"],
    aiEvals: COMMON_AI_EVALS,
    audit: ["Disclosure grants/revocations", "Access log of recipient reads", "Delegate edits"],
    observability: ["Revocation success rate", "Consent comprehension proxies", "Unauthorised disclosure incidents (target zero)"],
    complaints: "Participant correction path for wrong requirements; Complaint for unauthorised disclosure.",
    featureFlags: ["Access infrastructure passport writers flag-gated", "MAPABLE_AI_* consent gates for AI reads"],
    failureFallback: "If sharing service fails, default deny disclosure. Non-AI form editor always available.",
    security: ["Server-side ownership checks", "No client-supplied disclosureScopes elevation", "Field-level redaction in logs"],
    dor: ["Co-design of sharing model (G1)", "Consent receipt field gaps identified for EXTEND", "Freeze waiver if implementing"],
    dod: ["Granular scopes enforced server-side", "Receipts include purpose/expiry", "Diagnosis excluded from matching", "Revocation immediate"],
    mvp: ["Passport CRUD + private default + basic share to provider with receipt"],
    pilot: ["Limited participants; revocation tested; delegate path tested"],
    scale: ["Unauthorised disclosure = 0; comprehension/Easy Read available"],
    kpis: ["Consent comprehension", "Disclosure revocation success", "Participant override rate", "Unauthorised disclosure incidents"],
    risks: [
      { risk: "Passport becomes universal disclosure record", mitigation: "Attribute-level scopes; employer default false; public API ban" },
      { risk: "ConsentReceipt missing expiry/supersession", mitigation: "EXTEND ConsentReceipt before scale claims" },
      { risk: "Second consent SoT", mitigation: "Reuse lib/consent only" },
    ],
    deps: ["Epic 01 taxonomy for ontologyConceptId", "Consent/authority services"],
    owner: "Access Infrastructure + Consent owners",
    evidencePromotion: ["Participant co-design sign-off", "Unauthorised disclosure tests", "Manual AT on passport editor"],
    features: [
      { key: "02-f1", title: "Functional requirement editor", summary: "Participant-owned AccessRequirement CRUD.", disposition: "EXTEND", reusePaths: ["AccessPassport", "AccessRequirementRecord"], acceptance: ["Criticality/context/timing/assistance fields", "userConfirmed"] },
      { key: "02-f2", title: "Granular sharing controls", summary: "Per-recipient-class attribute scopes.", disposition: "EXTEND", reusePaths: ["disclosureScopes", "ConsentRecord"], acceptance: ["Employer share default off", "AI scope explicit"] },
      { key: "02-f3", title: "Purpose-bound consent and receipts", summary: "Consent purpose + ConsentReceipt EXTEND.", disposition: "EXTEND", reusePaths: ["lib/consent/"], acceptance: ["Purpose, fields, expiry, revocation"] },
      { key: "02-f4", title: "Expiry revocation and access log", summary: "Time-boxed shares and read audit.", disposition: "EXTEND", reusePaths: ["AuditEvent", "ConsentReceipt"], acceptance: ["Immediate revoke", "Recipient read logged"] },
      { key: "02-f5", title: "Participant review experience", summary: "Who has what, for what purpose.", disposition: "NEW", reusePaths: ["dashboard consent patterns"], acceptance: ["Plain language", "Easy Read path"] },
      { key: "02-f6", title: "AAC and Easy Read pathways", summary: "Accessible communication of passport content.", disposition: "EXTEND", reusePaths: ["docs/co-design-protocol.md", "MAPABLE_AAC_COMMUNICATION_ENABLED"], acceptance: ["Voice-independent", "AAC-compatible"] },
      { key: "02-f7", title: "Non-diagnosis matching contract", summary: "Hard deny diagnosis as matching input.", disposition: "REUSE", reusePaths: ["ACCESS_FRAMEWORK.md", "containsDiagnosis flag"], acceptance: ["Matching payloads exclude diagnosis"] },
    ],
    gateCriteria: {
      G0: "PASS if participants evidence repeated disclosure burden and oversharing harm.",
      G1: "PASS if disability-led co-design of sharing labels and Easy Read; FAIL if designer-only.",
      G2: "PASS if privacy/consent/dignity-of-risk review clears; FAIL if diagnosis required.",
      G3: "PASS if create requirement → share scoped → revoke with receipt.",
      G4: "PASS if limited cohort; zero unauthorised disclosure in pilot.",
      G5: "PASS if revocation/comprehension KPIs met.",
      G6: "PASS if continuous consent-failure monitoring.",
    },
  },
  {
    key: "03",
    slug: "navigate",
    title: "MapAble Navigate",
    priority: "P1",
    horizon: "Experience",
    wave: "experience",
    claimState: CLAIM.DEV,
    dependencies: ["01", "02"],
    strategicOutcome: "Accessible routing that optimises suitability rather than shortest travel time.",
    participantOutcome: "Participants receive route options scored against their requirements with uncertainty and evidence freshness communicated honestly.",
    problem: "Shortest-path routing ignores gradients, stairs, lift outages, sensory load, and rest needs — and often presents guesses as facts.",
    scope: [
      "Gradients, surfaces, narrow paths, stairs, kerb ramps, accessible crossings, lift availability/outages",
      "Accessible toilets, rest, shade/shelter, lighting, sensory intensity, PT interchange, recharge, temporary barriers/construction",
      "Uncertainty and freshness communication; inferred ≠ verified",
    ],
    nonGoals: ["Guaranteed personally safe routes", "Emergency routing as 000 replacement", "Indoor AR navigation production claims"],
    userGroups: ["Participants", "Support persons", "Transport operators (status feeds)", "Venue operators (lift outages)"],
    journeys: [
      "Power wheelchair user gets step-free options with gradient confidence labels",
      "Lift outage demotes a route; system shows evidence age",
      "Missing kerb data → uncertain segment, not 'accessible'",
    ],
    capabilities: ["Suitability-first outdoor routing", "Indoor route reuse where published", "Uncertainty UX", "Disruption overlays", "Passport-aware fit"],
    sharedCore: ["Access Graph entities", "AccessPassport", "Transport routing adapters (advisory)", "Indoor route-planner"],
    dataEntities: ["AccessJourneyRecord", "AccessJourneySegmentRecord", "Indoor routes", "Transport route estimates (advisory)"],
    apisEvents: ["journeys/evaluate", "routing adapters advisory", "disruption events"],
    permissionModel: "Participant routes private by default; no identifiable journey publish to Observatory.",
    consent: ["Passport read requires consent/scopes", "Analytics aggregation separate and privacy-preserving (Epic 14)"],
    humanGates: ["Participant selects among options; system does not auto-book transport"],
    a11y: [...COMMON_A11Y, "Map + equivalent list/form interaction (transport rule)"],
    privacy: ["No identifiable journey histories in public analytics", "Exact addresses restricted per transport rules"],
    safeguarding: ["Not an emergency service; direct danger to 000", "No personal safety score"],
    aiUse: "Optional explanation of trade-offs; not inventing missing access facts.",
    aiProhibited: ["Hallucinated lift availability", "Claiming route personally safe", "Auto-booking"],
    aiEvals: COMMON_AI_EVALS,
    audit: ["Route option generation inputs/versions", "Participant selection"],
    observability: ["Accessible-route completion", "Uncertainty presentation rate", "Stale segment rate"],
    complaints: "Correction path into Access Graph when route evidence wrong.",
    featureFlags: ["Indoor flags", "Transport routing sandbox flags", "claim.route_personally_safe prohibited"],
    failureFallback: "If routing unavailable → manual list of known barriers + human escalation. Non-AI filters remain.",
    security: ["Do not leak exact pickup in pre-assignment contexts", "Sanitize location free-text"],
    dor: ["Graph coverage for pilot geography", "Passport fit engine available"],
    dod: ["Suitability objective documented", "Uncertainty UX", "Tests for stale/inferred handling"],
    mvp: ["Passport-aware suitability ranking on a limited corridor using verified+uncertain segments"],
    pilot: ["Controlled cohort; compare completion vs shortest-path baseline"],
    scale: ["Freshness SLAs; completion KPI"],
    kpis: ["Accessible-route completion", "Stale evidence encounters", "Participant override of recommended route"],
    risks: [
      { risk: "Presenting inferred accessibility as verified", mitigation: "Provenance labels mandatory in UI" },
      { risk: "Privacy leak of journeys", mitigation: "No identifiable export; aggregation Epic 14 only" },
    ],
    deps: ["Epic 01", "Epic 02", "Indoor/transport adapters"],
    owner: "Access + Transport routing owners",
    evidencePromotion: ["Pilot completion metrics", "Manual AT on map/list parity"],
    features: [
      { key: "03-f1", title: "Suitability routing engine", summary: "Optimise for passport fit not only ETA.", disposition: "EXTEND", reusePaths: ["lib/access/indoor/routing/", "lib/transport-routing/"], acceptance: ["Documented cost function", "Advisory labels"] },
      { key: "03-f2", title: "Disruption and lift outage overlays", summary: "Freshness-sensitive barriers.", disposition: "EXTEND", reusePaths: ["IndoorAccessibilityIncident", "evidence freshness"], acceptance: ["Outage demotes routes"] },
      { key: "03-f3", title: "Uncertainty and freshness UX", summary: "Honest labels for inferred/stale/unknown.", disposition: "NEW", reusePaths: ["compatibility four-state"], acceptance: ["Inferred ≠ verified"] },
      { key: "03-f4", title: "Passport-aware journey evaluate", summary: "End-to-end segment evaluation API.", disposition: "EXTEND", reusePaths: ["AccessJourney*", "API_CONTRACTS"], acceptance: ["participantDecisionRequired true"] },
      { key: "03-f5", title: "Map and list parity", summary: "Keyboard/SR equivalent to map.", disposition: "EXTEND", reusePaths: ["docs/transport/PRODUCT_REQUIREMENTS.md"], acceptance: ["No map-only critical info"] },
      { key: "03-f6", title: "Correction feedback loop", summary: "Wrong barrier → graph dispute.", disposition: "EXTEND", reusePaths: ["Epic 01 dispute"], acceptance: ["Linked correction ticket"] },
    ],
    gateCriteria: {
      G0: "PASS if journey failures from unsuitable routes evidenced.",
      G1: "PASS if co-design of uncertainty language.",
      G2: "PASS if no personal-safety claim; privacy review of journeys.",
      G3: "PASS if one corridor evaluates with uncertain segments.",
      G4: "PASS if flagged pilot; rollback; support escalation.",
      G5: "PASS if completion/ freshness KPIs justify scale.",
      G6: "PASS if continuous stale-data and a11y monitoring.",
    },
  },
  {
    key: "04",
    slug: "access-intelligence-vision",
    title: "Access Intelligence Vision",
    priority: "P3",
    horizon: "R&D",
    wave: "rd",
    claimState: CLAIM.EXPLORATORY,
    dependencies: ["01", "06"],
    strategicOutcome: "Human-supervised computer-vision accessibility evidence assistant.",
    participantOutcome: "Faster candidate observations that never silently become verified truth without humans.",
    problem: "Manual evidence capture is slow; ungoverned CV would invent accessibility facts and fake compliance.",
    scope: [
      "Propose entrances, door-width estimates, ramps, steps, kerb ramps, handrails, signage, accessible parking, toilet features, surfaces, hazards",
      "All AI outputs initially AI INFERRED — UNVERIFIED",
      "Verification via community, organisation correction, accredited assessor",
    ],
    nonGoals: ["CV-awarded accreditation or compliance", "Production camera inference without freeze waiver", "Biometric identification"],
    userGroups: ["Assessors", "Venue staff", "Community contributors", "MapAble evidence ops"],
    journeys: [
      "Assessor uploads photo → model proposes ramp candidate → status AI inferred → assessor confirms measurement",
      "Organisation disputes AI door-width estimate → correction workflow",
    ],
    capabilities: ["Synthetic/shadow lens contracts", "Proposal envelopes", "Human verification bridge to Epic 01/06"],
    sharedCore: ["AccessEvidenceEnvelopeRecord", "AccessChangeReviewRecord", "AI capability registry", "Kill switches"],
    dataEntities: ["Evidence envelopes with evidenceClasses including vision", "Change reviews"],
    apisEvents: ["vision.proposal.created", "vision.proposal.rejected", "bridge to Living Access Fabric"],
    permissionModel: "Only authorised assessors/venues upload; model cannot publish.",
    consent: ["Image capture consent; no bystander face processing as identity"],
    humanGates: ["Mandatory human verification before verified status", "Accreditation remains Epic 06 human decision"],
    a11y: COMMON_A11Y,
    privacy: ["Minimize EXIF/location leakage", "No face recognition for identity"],
    safeguarding: ["Hazard proposals are environmental candidates only"],
    aiUse: "Classification/extraction of accessibility candidates under shadow/synthetic until promoted.",
    aiProhibited: ["Accreditation", "Compliance certification", "Verified measurement from vision alone", "Reward-hacking confidence inflation"],
    aiEvals: [...COMMON_AI_EVALS, "overconfident door-width estimate", "missed step hazard"],
    audit: ["Model version, prompt/tool trace, human decision"],
    observability: ["Precision/recall on labelled sets", "Human reject rate", "Unsupported-claim rate"],
    complaints: "Organisation correction + assessor appeal paths.",
    featureFlags: ["W-VA-1 VisionAccess contracts; inference flags default false", "MAPABLE_AI_PUBLIC_CLAIM_ENABLED=false"],
    failureFallback: "Manual measurement forms always available; disable vision flag.",
    security: ["Upload malware scanning", "Prompt-injection resistant captions", "No autonomous publish"],
    dor: ["Freeze waiver W-VA-1 respected", "Eval harness cases defined", "Co-design on honesty labels"],
    dod: ["Default AI INFERRED", "Cannot set verified", "Evals gate"],
    mvp: ["Synthetic lens proposals into change review queue"],
    pilot: ["Assessor-only shadow mode; no public claim"],
    scale: ["Only after precision thresholds and G5 evidence"],
    kpis: ["Human confirm rate", "False proposal rate", "Time-to-verified evidence"],
    risks: [
      { risk: "CV treated as compliance", mitigation: "Hard block accreditation path" },
      { risk: "Privacy of bystanders", mitigation: "Capture policy; no face ID" },
    ],
    deps: ["Epic 01", "Epic 06", "AI platform registry"],
    owner: "Access Intelligence + AI platform",
    evidencePromotion: ["Eval report", "Assessor acceptance study", "No public claim until registry allows"],
    features: [
      { key: "04-f1", title: "Vision proposal contracts", summary: "Shared schemas for CV candidates.", disposition: "REUSE", reusePaths: ["VisionAccess contracts #383"], acceptance: ["AI inferred default"] },
      { key: "04-f2", title: "Shadow inference harness", summary: "Synthetic/shadow only until waiver.", disposition: "EXTEND", reusePaths: ["access-intelligence-next evidence"], acceptance: ["Flags off by default"] },
      { key: "04-f3", title: "Human verification bridge", summary: "Proposals enter change review.", disposition: "EXTEND", reusePaths: ["AccessChangeReviewRecord"], acceptance: ["No auto-publish"] },
      { key: "04-f4", title: "Community confirmation workflow", summary: "Community can corroborate not verify alone.", disposition: "NEW", reusePaths: ["community_reported status"], acceptance: ["Cannot reach independently verified alone"] },
      { key: "04-f5", title: "Organisation correction", summary: "Venue disputes AI candidates.", disposition: "EXTEND", reusePaths: ["venue response services"], acceptance: ["Audit trail"] },
      { key: "04-f6", title: "Assessor validation", summary: "Accredited measurement supersedes.", disposition: "EXTEND", reusePaths: ["Epic 06"], acceptance: ["Assessor identity required"] },
    ],
    gateCriteria: {
      G0: "PASS if evidence capture bottleneck evidenced.",
      G1: "PASS if disability-led review of CV honesty risks.",
      G2: "PASS if rights review bans compliance-from-CV.",
      G3: "PASS if synthetic proposal → human reject/confirm loop.",
      G4: "PASS if assessor-only pilot; kill switch tested.",
      G5: "PASS if precision thresholds met.",
      G6: "PASS if model-drift and unsupported-claim monitoring.",
    },
  },
  {
    key: "05",
    slug: "accessibility-digital-twins",
    title: "Accessibility Digital Twins",
    priority: "P3",
    horizon: "R&D",
    wave: "rd",
    claimState: CLAIM.EXPLORATORY,
    dependencies: ["01", "03"],
    strategicOutcome: "Structured spatial models for complex sites enabling future indoor navigation and passport fit — as R&D until evidence quality exists.",
    participantOutcome: "Eventual ability to preview accessible indoor paths with honest confidence — not a claim that twins are live or personally safe today.",
    problem: "Large venues lack machine-readable spatial access models; AR/VR previews without evidence would mislead.",
    scope: ["Venues, stations, workplaces, campuses, hospitals, shopping centres, precincts, event sites", "Later: indoor nav, route preview, evacuation support, AR/VR, passport checks"],
    nonGoals: ["Production AR/VR claims", "Evacuation system of record replacing building fire plans", "Personal safety guarantees"],
    userGroups: ["Venue authoring staff", "Assessors", "Participants (preview consumers later)", "Emergency planners (advisory only)"],
    journeys: ["Author publishes floor plan draft → review → restricted zones filtered for partners"],
    capabilities: ["Floor plan authoring", "Checkpoints", "Visit plans", "Fit engine", "Publication state machine"],
    sharedCore: ["AccessPlace", "Indoor* models", "Partner API DTO filtering"],
    dataEntities: ["AccessFloorPlan", "IndoorCheckpoint", "VisitPlan", "IndoorAccessibilityIncident"],
    apisEvents: ["Indoor publication workflow", "Partner floorplans:read"],
    permissionModel: "Authoring by venue roles; published public plans exclude restricted zones.",
    consent: ["Visit plans participant-owned"],
    humanGates: ["Publication approval", "No auto 'safe route'"],
    a11y: [...COMMON_A11Y, "3D/AR off by default per indoor plan"],
    privacy: ["docs/indoor-accessibility/privacy-and-threat-model.md"],
    safeguarding: ["Evacuation support advisory only"],
    aiUse: "Optional assist for authoring proposals; human publish.",
    aiProhibited: ["claim.route_personally_safe", "Auto-publish twins"],
    aiEvals: COMMON_AI_EVALS,
    audit: ["Publication state transitions"],
    observability: ["Draft vs published coverage"],
    complaints: "Correction proposals on floor plans.",
    featureFlags: ["lib/access/indoor/feature-flags.ts defaults false"],
    failureFallback: "2D list/checkpoint text alternatives; disable twin preview.",
    security: ["Partner DTO filtering", "No raw DB to clients"],
    dor: ["Spatial evidence quality bar defined", "Threat model reviewed"],
    dod: ["Publication workflow", "Restricted zone filter", "Honesty labels"],
    mvp: ["One venue twin draft with checkpoint validation"],
    pilot: ["Limited venues; partner read-only"],
    scale: ["Only after evidence density + G5"],
    kpis: ["Published twin coverage", "Correction rate", "Fit uncertain rate"],
    risks: [
      { risk: "Overclaiming indoor readiness", mitigation: "R&D horizon; public claims false" },
      { risk: "Security of restricted zones", mitigation: "DTO filter + auth scopes" },
    ],
    deps: ["Epic 01", "Indoor stack"],
    owner: "Indoor accessibility owners",
    evidencePromotion: ["Rollout-status honest", "Threat model sign-off"],
    features: [
      { key: "05-f1", title: "Floor plan authoring", summary: "Structured spatial authoring.", disposition: "REUSE", reusePaths: ["lib/access/indoor/authoring/"], acceptance: ["State machine"] },
      { key: "05-f2", title: "Checkpoint and route model", summary: "Indoor graph primitives.", disposition: "REUSE", reusePaths: ["IndoorCheckpoint", "route-planner"], acceptance: ["Text alternative"] },
      { key: "05-f3", title: "Publication workflow", summary: "Draft → review → publish.", disposition: "REUSE", reusePaths: ["publication/state-machine.ts"], acceptance: ["Restricted zones filtered"] },
      { key: "05-f4", title: "Passport indoor fit", summary: "Compatibility against twin capabilities.", disposition: "EXTEND", reusePaths: ["indoor-fit-engine"], acceptance: ["Four-state fit"] },
      { key: "05-f5", title: "Visit plan sharing", summary: "Participant visit plans.", disposition: "REUSE", reusePaths: ["visit-plan-service"], acceptance: ["Consented share"] },
      { key: "05-f6", title: "AR/VR preview research", summary: "Exploratory only.", disposition: "DEFER", reusePaths: [], acceptance: ["No production flag"] },
    ],
    gateCriteria: {
      G0: "PASS if venue complexity blocks participation evidenced.",
      G1: "PASS if co-design of preview honesty.",
      G2: "PASS if threat model and no personal-safety claim.",
      G3: "PASS if one twin draft→publish→fit evaluate.",
      G4: "PASS if limited venue pilot.",
      G5: "PASS if evidence density supports navigation claims.",
      G6: "PASS if incident/correction monitoring.",
    },
  },
  {
    key: "06",
    slug: "accreditation-os",
    title: "MapAble Accreditation OS",
    priority: "P0",
    horizon: "Foundation",
    wave: "foundation",
    claimState: CLAIM.IMPL,
    dependencies: ["01", "09"],
    strategicOutcome: "Operational assessment system for voluntary accessibility verification publishing approved facts to the Access Graph.",
    participantOutcome: "Trustworthy, time-bounded accessibility verification — never misrepresented as legal-compliance certification.",
    problem: "Accreditation methodology exists in fragments; auto-decision risk; unclear expiry and appeals.",
    scope: [
      "Venue selected → assessor assigned → assessment → measurements → photos/evidence → scoring → human review → remediation → decision → publish to graph → expiry → reassessment",
      "Versioning, provenance, assessor identity, scoring explanations, remediation, audit, appeals",
    ],
    nonGoals: ["Legal-compliance certification", "Automatic accreditation decisions", "Provider quality scores from participant incidents"],
    userGroups: ["Assessors", "Venue operators", "Provider accreditation applicants", "Participants consuming published facts"],
    journeys: [
      "Assessor completes Access Mark assessment; human decision; facts published with expiry",
      "Venue appeals score; history immutable",
    ],
    capabilities: ["Assessment versioning", "Evidence packs", "Human decision", "Remediation tracking", "Graph publication", "Appeals"],
    sharedCore: ["AccessAccreditation*", "ProviderAccreditation*", "QMS standards", "WorkerTrustCredential for assessors", "AuditEvent"],
    dataEntities: ["AccessibilityAccreditationCase", "AccessAccreditationAssessment/Score/Evidence", "ProviderAccreditationApplication/Decision/Appeal"],
    apisEvents: ["/api/accreditation/*", "accreditation.decision.recorded", "accreditation.facts.published"],
    permissionModel: "Assessor and admin queues; venues see own cases; automaticAccreditationDecisionEnabled hardcoded false.",
    consent: ["Evidence photos purpose-limited; no passport required for venue accreditation"],
    humanGates: ["Accreditation decision human-only", "Publication to graph after decision"],
    a11y: COMMON_A11Y,
    privacy: ["Assessor/venue data minimization", "No incident-derived provider scores"],
    safeguarding: ["Do not conflate accreditation with safeguarding clearance"],
    aiUse: "Evidence indexing/summaries only; no decision.",
    aiProhibited: ["Auto accreditation decision", "Incident-to-score"],
    aiEvals: COMMON_AI_EVALS,
    audit: ["Full case event history", "Decision actor identity"],
    observability: ["Time-to-decision", "Expiry backlog", "Appeal rate"],
    complaints: "Appeals + Complaint for process issues.",
    featureFlags: ["MAPABLE_PROVIDER_ACCREDITATION_ENABLED", "MAPABLE_QUALITY_QMS_ENABLED", "auto decision hardcoded false"],
    failureFallback: "Manual assessor paperwork path; flag off.",
    security: ["Assessor credential checks via Epic 09", "Tamper-evident evidence refs"],
    dor: ["Voluntary verification language locked", "Assessor credential policy"],
    dod: ["Human decision enforced", "Expiry + reassessment", "Graph publish with provenance", "Appeals"],
    mvp: ["End-to-end venue assessment → human decision → graph publish for one criterion set"],
    pilot: ["Limited assessors/venues; monitoring"],
    scale: ["Expiry SLA; appeal SLA"],
    kpis: ["Assessments completed", "Expiry exceptions", "Appeal resolution time", "Disputed evidence corrections"],
    risks: [
      { risk: "Marketed as legal compliance", mitigation: "Mandatory voluntary verification copy; legal review G2" },
      { risk: "Auto-decision creep", mitigation: "Hardcoded false + tests" },
    ],
    deps: ["Epic 01", "Epic 09", "existing quality modules"],
    owner: "Quality/Accreditation + Access Mark owners",
    evidencePromotion: ["Assessor audit sample", "No auto-decision tests green"],
    features: [
      { key: "06-f1", title: "Assessment case workflow", summary: "Case lifecycle with versioning.", disposition: "REUSE", reusePaths: ["lib/access/accreditation*", "lib/accreditation/"], acceptance: ["Event history"] },
      { key: "06-f2", title: "Measurement and evidence packs", summary: "Photos/measurements with provenance.", disposition: "EXTEND", reusePaths: ["AccessAccreditation* evidence"], acceptance: ["Assessor identity"] },
      { key: "06-f3", title: "Scoring explanations", summary: "Human-readable score rationale.", disposition: "EXTEND", reusePaths: ["AccessibilityAccreditationScore"], acceptance: ["Not sole access decision"] },
      { key: "06-f4", title: "Human review and decision", summary: "Hard block auto-decision.", disposition: "REUSE", reusePaths: ["compliance-boundaries.ts"], acceptance: ["automaticAccreditationDecisionEnabled false"] },
      { key: "06-f5", title: "Remediation tracking", summary: "Corrective actions.", disposition: "REUSE", reusePaths: ["QMS CorrectiveAction"], acceptance: ["Immutable history"] },
      { key: "06-f6", title: "Publish approved facts to Access Graph", summary: "Post-decision publication with expiry.", disposition: "EXTEND", reusePaths: ["Epic 01 envelopes"], acceptance: ["Assessor measured / independently verified statuses"] },
      { key: "06-f7", title: "Expiry reassessment and appeals", summary: "Time-bounded accreditation.", disposition: "EXTEND", reusePaths: ["Appeal records"], acceptance: ["Expired ≠ approved"] },
    ],
    gateCriteria: {
      G0: "PASS if venues/participants need trustworthy voluntary verification.",
      G1: "PASS if disability-led input on what 'verified' means publicly.",
      G2: "PASS if legal review clears non-certification language.",
      G3: "PASS if one case decision→publish→expire path.",
      G4: "PASS if limited pilot; no public overclaim.",
      G5: "PASS if quality KPIs met.",
      G6: "PASS if expiry and appeal monitoring continuous.",
    },
  },
  {
    key: "07",
    slug: "participant-orchestration-agent",
    title: "Participant Orchestration Agent",
    priority: "P1",
    horizon: "Controlled Intelligence",
    wave: "intelligence",
    claimState: CLAIM.DEV,
    dependencies: ["01", "02", "03", "08"],
    strategicOutcome: "Single participant-controlled conversational planning layer: MODEL PROPOSES → POLICY VALIDATES → PARTICIPANT DECIDES → AUTHORISED SYSTEM EXECUTES.",
    participantOutcome: "People can plan complex journeys (e.g. interview + transport + support) without surrendering decision ownership.",
    problem: "Cross-module planning is fragmented; ungoverned agents risk booking, disclosing, or spending without approval.",
    scope: [
      "Search, compare, explain, identify dependencies, draft plans, suggest options across Jobs/Access/Navigate/Transport/Care/Calendar",
      "One orchestrating agent first (Navigator)",
      "Typed tools, constrained schemas, explicit state, audit, approval gates, evals",
    ],
    nonGoals: [
      "Autonomous multi-agent swarm",
      "Independent worker assignment, consequential booking without approval, disability disclosure, spending, funding approval, clinical/abuse/restrictive-practice decisions",
    ],
    userGroups: ["Participants", "Delegates", "Human escalators / navigators"],
    journeys: [
      "“Interview in Parramatta Tuesday 10am, power wheelchair, need support and accessible transport” → draft plan → participant approves each consequential action",
    ],
    capabilities: ["Navigator orchestration", "Consent gates", "Tool schemas", "Approval envelopes", "Escalation", "Non-AI fallback"],
    sharedCore: ["lib/ai/navigator", "consent", "authority", "audit", "AI capability registry", "Care/Transport/Jobs read adapters"],
    dataEntities: ["Navigator envelopes", "AuditEvent", "ConsentRecord", "existing Care/Transport/Jobs entities (no second SoT)"],
    apisEvents: ["navigator.plan.proposed", "navigator.action.approved", "navigator.escalated"],
    permissionModel: "Participant (or grant) must approve consequential tools; server policy validates before execute.",
    consent: ["Micro-consent for passport/tool data", "Purpose-bound module reads"],
    humanGates: ["All consequential executions", "Escalation to person", "Co-design S0/S1 before participant-facing HITL"],
    a11y: [...COMMON_A11Y, "Non-chat alternative for all critical flows"],
    privacy: ["Minimum tool data", "No diagnosis in prompts unless explicitly consented and necessary — prefer functional requirements"],
    safeguarding: ["Safeguarding human-only; agent must escalate not decide"],
    aiUse: "Search, summarise, explain, draft, recommend, plan — not execute consequential actions alone.",
    aiProhibited: [
      "Assign workers",
      "Book without approval",
      "Disclose disability",
      "Spend money",
      "Approve funding",
      "Clinical decisions",
      "Abuse/reportability determination",
      "Restrictive practices",
      "claim.aura_decides / claim.auto_worker_assignment",
    ],
    aiEvals: COMMON_AI_EVALS,
    audit: ["Traces, tool calls, approvals, refusals"],
    observability: ["Task success", "Forbidden action attempts", "Escalation precision", "Fallback success", "Cohort disparity"],
    complaints: "Human handoff + Complaint; correction of bad plans.",
    featureFlags: ["Navigator pilot flags", "W-AA-1", "MAPABLE_AI_PUBLIC_CLAIM_ENABLED=false", "MAPABLE_AUTOMATIC_ASSIGNMENT_ENABLED=false"],
    failureFallback: "Non-AI journey planner forms; human escalation; kill switch disables model calls.",
    security: [
      "Typed tools only",
      "Policy services outside model",
      "Prompt-injection resistance on tool args",
      "Edge rate limits / UA controls when middleware hardened",
      "verifyPayloadSafe on free-text before persistence",
    ],
    dor: ["Co-design protocol S0/S1", "Eval suite green on forbidden actions", "Freeze waiver W-AA-1"],
    dod: ["Approval gates enforced in code", "Evals for disclosure/funding/assignment", "Accessible fallback", "Single agent only"],
    mvp: ["Draft plan for appointment journey using Access+Navigate+Transport reads; no auto-book"],
    pilot: ["Governed pilot phase; limited cohort; monitoring"],
    scale: ["Eval + incident KPIs; accessibility parity"],
    kpis: ["Task success", "Unsupported-claim rate", "Unsafe recommendation rate", "Forbidden action attempts", "Non-AI fallback success"],
    risks: [
      { risk: "Agent swarm / reward hacking", mitigation: "One agent; deterministic policy; evals; kill switches" },
      { risk: "Unauthorised disclosure", mitigation: "Consent gates; tool allowlists; target zero incidents" },
    ],
    deps: ["Epics 01–03", "thin 08", "AI platform"],
    owner: "AI platform / Navigator (W-AA-1)",
    evidencePromotion: ["Eval reports", "Pilot runbook adherence", "Co-design sign-off"],
    features: [
      { key: "07-f1", title: "Single Navigator orchestrator", summary: "One agent; no swarm.", disposition: "EXTEND", reusePaths: ["lib/ai/navigator/"], acceptance: ["Typed tools", "Explicit state"] },
      { key: "07-f2", title: "Consent and authority gates", summary: "Refuse without consent/grant.", disposition: "EXTEND", reusePaths: ["consent-gate.ts", "gates.ts"], acceptance: ["Delegate lack-of-authority eval"] },
      { key: "07-f3", title: "Approval envelopes", summary: "Participant approves consequential actions.", disposition: "EXTEND", reusePaths: ["envelopes/"], acceptance: ["No execute without approval"] },
      { key: "07-f4", title: "Cross-module typed tools", summary: "Jobs/Access/Navigate/Transport/Care/Calendar reads.", disposition: "EXTEND", reusePaths: ["matching/search-tool.ts"], acceptance: ["Constrained schemas"] },
      { key: "07-f5", title: "Human escalation", summary: "Accessible handoff.", disposition: "EXTEND", reusePaths: ["escalation/service.ts", "Epic 08"], acceptance: ["No phone-tree only"] },
      { key: "07-f6", title: "Eval and trace harness", summary: "Minimum eval set + traces.", disposition: "EXTEND", reusePaths: ["lib/ai/platform/evaluations"], acceptance: ["Forbidden action suite"] },
      { key: "07-f7", title: "Non-AI fallback journey UI", summary: "Forms/list planner.", disposition: "EXTEND", reusePaths: ["journey-planner routes"], acceptance: ["Critical path without chat"] },
    ],
    gateCriteria: {
      G0: "PASS if cross-module planning burden evidenced.",
      G1: "PASS if co-design protocol S0/S1 signed for participant-facing HITL.",
      G2: "PASS if AI governance/safeguarding/privacy review clears prohibited decisions.",
      G3: "PASS if propose→approve→execute(read-only or sandbox) proof.",
      G4: "PASS if governed pilot charter met; kill switch tested.",
      G5: "PASS if eval KPIs and zero critical disclosure incidents.",
      G6: "PASS if continuous AI error/drift/disparity monitoring.",
    },
  },
  {
    key: "08",
    slug: "accessible-communications-fabric",
    title: "Accessible Communications Fabric",
    priority: "P1",
    horizon: "Foundation thin slice → Experience full fabric",
    wave: "experience",
    claimState: CLAIM.IMPL,
    dependencies: ["02"],
    strategicOutcome: "Shared communication layer with preferences, no-voice paths, and human handoff across MapAble.",
    participantOutcome: "Status and support without inaccessible telephone trees; AAC-friendly and plain-language options.",
    problem: "Status questions (e.g. where is my driver) force inaccessible channels; clinical/payment data risks leaking into chat agents.",
    scope: [
      "In-app messaging, SMS, voice, accessible web chat, WhatsApp/RCS where appropriate, email, AAC-friendly text",
      "Preferences, preferred channel, no-voice option, plain-language, escalation, emergency boundaries, service-status messages",
    ],
    nonGoals: ["High-risk clinical data in general agent context", "Payment-card data in chat", "Emergency dispatch replacement"],
    userGroups: ["Participants", "Drivers/workers", "Support staff", "Ops"],
    journeys: ["Where is my driver? → explain current info → next steps → escalate to person"],
    capabilities: ["Thread messaging", "Preference-aware routing", "Status explainers", "Human handoff", "Channel adapters"],
    sharedCore: ["Conversation/Message", "Communication preferences", "Notifications", "AuditEvent"],
    dataEntities: ["Conversation", "Message", "MessageReadReceipt", "notification stubs"],
    apisEvents: ["message.created", "escalation.opened", "status.explained"],
    permissionModel: "Thread ACLs via message-access-policy; no ambient admin.",
    consent: ["Channel consent; marketing vs transactional separation"],
    humanGates: ["Escalation to human", "Emergency boundary messaging"],
    a11y: [...COMMON_A11Y, "No-voice-required option mandatory for status"],
    privacy: ["Keep clinical/PAN out of general agent contexts"],
    safeguarding: ["Emergency escalation boundaries; 000 for immediate danger"],
    aiUse: "Explain status / draft replies; not clinical advice.",
    aiProhibited: ["Clinical advice", "Payment card handling", "Safeguarding determinations"],
    aiEvals: COMMON_AI_EVALS,
    audit: ["Escalations", "Preference changes"],
    observability: ["Channel success", "Escalation time", "a11y parity"],
    complaints: "In-thread escalate + Complaint module.",
    featureFlags: ["Push often stubbed — honest labels", "MAPABLE_AAC_COMMUNICATION_ENABLED"],
    failureFallback: "In-app thread + human queue if SMS/voice fail.",
    security: ["IDOR tests on threads", "Sanitize message bodies", "Rate-limit"],
    dor: ["Preference model agreed", "Emergency copy legal review"],
    dod: ["No-voice status path", "Handoff SLA", "No clinical/PAN in general agent"],
    mvp: ["In-app status + human handoff for transport trip"],
    pilot: ["Limited cohort multi-channel"],
    scale: ["Channel SLAs; a11y parity"],
    kpis: ["Status question resolution", "Escalation precision", "Voice-independent completion"],
    risks: [
      { risk: "Inaccessible escalation", mitigation: "No-voice path; handoff required" },
      { risk: "Data leakage into agents", mitigation: "Context allowlists" },
    ],
    deps: ["Messaging SoT", "Transport status evidence"],
    owner: "Messaging + Mobile communication owners",
    evidencePromotion: ["Manual AT on messaging", "IDOR suite"],
    features: [
      { key: "08-f1", title: "In-app messaging core", summary: "Existing threads.", disposition: "REUSE", reusePaths: ["lib/messages/"], acceptance: ["Access policy enforced"] },
      { key: "08-f2", title: "Communication preferences", summary: "Preferred channel + no-voice.", disposition: "EXTEND", reusePaths: ["AccessibilityProfile communicationPreferences"], acceptance: ["Honoured in status flows"] },
      { key: "08-f3", title: "Service status explainer", summary: "Where is my driver honest status.", disposition: "EXTEND", reusePaths: ["transport status"], acceptance: ["Estimate ≠ arrival"] },
      { key: "08-f4", title: "Human handoff", summary: "Accessible escalation.", disposition: "EXTEND", reusePaths: ["escalation patterns"], acceptance: ["Not phone-tree only"] },
      { key: "08-f5", title: "SMS email voice adapters", summary: "Channel adapters.", disposition: "EXTEND", reusePaths: ["Twilio etc"], acceptance: ["Flags; honest failure"] },
      { key: "08-f6", title: "AAC-friendly interfaces", summary: "Symbol/plain pathways.", disposition: "EXTEND", reusePaths: ["AAC flags"], acceptance: ["Default off until co-designed"] },
      { key: "08-f7", title: "WhatsApp/RCS exploratory", summary: "Where appropriate.", disposition: "DEFER", reusePaths: [], acceptance: ["Privacy review first"] },
    ],
    gateCriteria: {
      G0: "PASS if inaccessible status channels evidenced.",
      G1: "PASS if AAC/Easy Read co-design for messaging.",
      G2: "PASS if clinical/PAN boundary review.",
      G3: "PASS if status→handoff on one vertical.",
      G4: "PASS if pilot monitoring.",
      G5: "PASS if resolution KPIs.",
      G6: "PASS if continuous a11y/incident monitoring.",
    },
  },
  {
    key: "09",
    slug: "trust-credential-network",
    title: "Trust & Credential Network",
    priority: "P0",
    horizon: "Foundation",
    wave: "foundation",
    claimState: CLAIM.IMPL,
    dependencies: [],
    strategicOutcome: "Shared credential infrastructure so expiry never silently becomes approval.",
    participantOutcome: "Participants encounter workers/drivers/assessors with current, verifiable credentials — not silent expired approvals.",
    problem: "Credentials fragmented; expiry and suspension handling inconsistent; risk of silent approval.",
    scope: [
      "Workers, providers, drivers, vehicles, assessors, employers, organisations, training records",
      "Source, issuer, evidence, issue/expiry, verification, suspension, supersession, review, renewal reminders, exception workflow",
    ],
    nonGoals: ["Silent expiry→approval", "Academy completion as competency (Epic 15)", "Auto worker assignment from credentials"],
    userGroups: ["Workers", "Drivers", "Assessors", "Providers", "Compliance ops", "Participants (assurance consumers)"],
    journeys: ["Driver credential nearing expiry → reminder → suspension blocks assignment"],
    capabilities: ["Credential registry", "Verification", "Expiry enforcement", "Exception workflow", "Renewal reminders"],
    sharedCore: ["WorkerTrustCredential", "TrainingCompletionRecord", "Transport driver verification", "AuditEvent"],
    dataEntities: ["WorkerTrustCredential", "WorkerCredentialEvidence", "TrainingCompletionRecord", "TransportDriverVerification"],
    apisEvents: ["credential.expiring", "credential.suspended", "credential.verified"],
    permissionModel: "Org-scoped credential admin; participants see verification status not raw documents by default.",
    consent: ["Worker consent for verification checks"],
    humanGates: ["Exception workflow human-reviewed", "Suspension decisions"],
    a11y: COMMON_A11Y,
    privacy: ["Minimize credential document exposure", "Purpose-bound verifier access"],
    safeguarding: ["Expired WWCC-like credentials must block — never silent approve"],
    aiUse: "Renewal reminders / doc extraction drafts only.",
    aiProhibited: ["Auto-approve credentials", "Treat training as competency"],
    aiEvals: COMMON_AI_EVALS,
    audit: ["Status transitions", "Exception approvals"],
    observability: ["Expiry exceptions", "Suspension lag"],
    complaints: "Worker/provider appeal of suspension.",
    featureFlags: ["Transport verification claims gated per feature-status.ts"],
    failureFallback: "Fail closed on assignment when credential status unknown/expired.",
    security: ["Issuer verification", "Tamper-evident evidence refs", "No client-set verified status"],
    dor: ["Credential types inventory", "Fail-closed assignment matrix"],
    dod: ["Expiry blocks consequential actions", "Reminders", "Audit"],
    mvp: ["Worker + driver expiry enforcement on assignment paths"],
    pilot: ["One org cohort"],
    scale: ["Cross-role network; exception SLAs"],
    kpis: ["Credential-expiry exceptions", "Suspension enforcement rate"],
    risks: [
      { risk: "Silent expiry approval", mitigation: "Fail closed; tests" },
      { risk: "Duplicate credential systems in verticals", mitigation: "Shared network EXTEND only" },
    ],
    deps: ["Workforce readiness", "Transport eligibility"],
    owner: "Workforce / Trust fabric owners",
    evidencePromotion: ["Fail-closed assignment tests", "Pilot exception metrics"],
    features: [
      { key: "09-f1", title: "Shared credential model", summary: "Extend beyond worker-only.", disposition: "EXTEND", reusePaths: ["WorkerTrustCredential"], acceptance: ["Drivers/assessors/vehicles modelled"] },
      { key: "09-f2", title: "Verification and issuer evidence", summary: "Source/issuer/evidence.", disposition: "EXTEND", reusePaths: ["WorkerCredentialEvidence"], acceptance: ["verificationMethod honest"] },
      { key: "09-f3", title: "Expiry suspension supersession", summary: "Lifecycle.", disposition: "EXTEND", reusePaths: ["credential status enums"], acceptance: ["Expired blocks"] },
      { key: "09-f4", title: "Renewal reminders", summary: "Notify before expiry.", disposition: "NEW", reusePaths: ["notifications"], acceptance: ["Human-approved notifications"] },
      { key: "09-f5", title: "Exception workflow", summary: "Human-reviewed exceptions.", disposition: "NEW", reusePaths: ["AuditEvent"], acceptance: ["Never silent"] },
      { key: "09-f6", title: "Assignment eligibility bridge", summary: "Care/Transport check credentials.", disposition: "EXTEND", reusePaths: ["workforce readiness", "transport eligibility"], acceptance: ["Fail closed"] },
    ],
    gateCriteria: {
      G0: "PASS if expiry/silent-approval incidents or near-misses evidenced.",
      G1: "PASS if worker/participant input on transparency of checks.",
      G2: "PASS if safeguarding/privacy review of credential data.",
      G3: "PASS if expired credential blocks one assignment path.",
      G4: "PASS if org pilot; monitoring.",
      G5: "PASS if exception KPIs acceptable.",
      G6: "PASS if continuous expiry monitoring.",
    },
  },
  {
    key: "10",
    slug: "funding-payment-integrity",
    title: "Funding & Payment Integrity Engine",
    priority: "P2",
    horizon: "Controlled Intelligence",
    wave: "intelligence",
    claimState: CLAIM.DEV,
    dependencies: ["09"],
    strategicOutcome: "Advisory financial evidence and integrity layer — human review for high-impact funding decisions.",
    participantOutcome: "Clearer quotes/invoices with anomaly flags — never false certainty of NDIS claimability.",
    problem: "Participants face opaque pricing and risky AI claim language; live NDIA submit must stay off.",
    scope: [
      "Pricing explanations, quote comparison, service evidence, invoice anomalies, duplicates, rate comparison, participant review, draft funding questions, reconciliation assistance",
    ],
    nonGoals: [
      "“Definitely NDIS claimable” without authoritative deterministic rule + current source",
      "Live NDIA submission",
      "Auto payment/invoice approval",
      "claim.billing_xero_live / claim.ndia_live_submission",
    ],
    userGroups: ["Participants", "Plan managers", "Providers", "Billing ops"],
    journeys: ["Invoice anomaly flagged → participant reviews → human approves"],
    capabilities: ["Anomaly detection", "Explanations", "Reconciliation assist", "Advisory wording"],
    sharedCore: ["BillingInvoice", "AbilityPay", "Stripe adapters", "billing copilots", "AuditEvent"],
    dataEntities: ["BillingInvoice", "BillingInvoiceLineItem", "BillingSafeguardAlert", "quotes"],
    apisEvents: ["invoice.anomaly.flagged", "funding.advice.drafted"],
    permissionModel: "Participant/PM/provider scoped; no ambient financial AI authority.",
    consent: ["Financial data purpose limits"],
    humanGates: ["High-impact funding decisions", "Payment approval"],
    a11y: COMMON_A11Y,
    privacy: ["Minimize financial PII in AI prompts", "Redaction in logs"],
    safeguarding: ["Financial exploitation signals escalate to humans — AI does not determine"],
    aiUse: "Explain, compare, draft questions, low-risk anomaly detection.",
    aiProhibited: ["Definitive claimability without deterministic rule", "Auto-approve payment", "Live NDIA submit"],
    aiEvals: [...COMMON_AI_EVALS, "incorrect funding claim"],
    audit: ["Advice drafts", "Approvals", "Anomaly resolutions"],
    observability: ["Anomaly precision", "Unsupported-claim rate"],
    complaints: "Billing disputes via Complaint + invoice flows.",
    featureFlags: ["MAPABLE_NDIS_CLAIM_SUBMISSION_ENABLED=false", "billing AI flags default false"],
    failureFallback: "Deterministic invoice UI without AI; human billing support.",
    security: ["PCI scope isolation", "verifyPayloadSafe on free-text invoice notes", "Idempotent payments"],
    dor: ["Wording standards", "Deterministic rule registry design"],
    dod: ["Advisory wording enforced", "Human approval for high-impact", "Evals for funding claims"],
    mvp: ["Anomaly flags + advisory explanation on BillingInvoice"],
    pilot: ["PM cohort; no live NDIA"],
    scale: ["After G5 integrity metrics"],
    kpis: ["Unsupported-claim rate", "Participant review rate", "Duplicate detection precision"],
    risks: [
      { risk: "False claimability language", mitigation: "Copy + evals + deterministic gate" },
      { risk: "Auto-approval creep", mitigation: "Hard flags; financial boundaries docs" },
    ],
    deps: ["Billing Centre", "Epic 09 for provider trust signals"],
    owner: "Billing / AbilityPay owners",
    evidencePromotion: ["Eval suite", "No live submit proof"],
    features: [
      { key: "10-f1", title: "Invoice evidence and anomaly rules", summary: "Deterministic checks first.", disposition: "EXTEND", reusePaths: ["BillingSafeguardAlert", "lib/billing"], acceptance: ["Rules versioned"] },
      { key: "10-f2", title: "Advisory explanation layer", summary: "Potential pathway wording.", disposition: "EXTEND", reusePaths: ["billing copilots"], acceptance: ["No definitive claimability"] },
      { key: "10-f3", title: "Quote comparison", summary: "Participant-facing compare.", disposition: "EXTEND", reusePaths: ["transport quotes", "billing"], acceptance: ["Estimate labels"] },
      { key: "10-f4", title: "Participant review workflow", summary: "Human review queue.", disposition: "EXTEND", reusePaths: ["BillingInvoiceApproval"], acceptance: ["Pending default"] },
      { key: "10-f5", title: "Reconciliation assistance", summary: "Draft reconciliations.", disposition: "EXTEND", reusePaths: ["AbilityPay"], acceptance: ["Human finalize"] },
      { key: "10-f6", title: "Funding question drafts", summary: "Draft questions for humans.", disposition: "NEW", reusePaths: ["AI platform"], acceptance: ["Not determinations"] },
    ],
    gateCriteria: {
      G0: "PASS if billing opacity/anomaly harm evidenced.",
      G1: "PASS if participant co-design of advisory language.",
      G2: "PASS if financial/regulatory boundary review.",
      G3: "PASS if anomaly→review on sandbox invoices.",
      G4: "PASS if pilot; NDIA submit remains off.",
      G5: "PASS if unsupported-claim rate below threshold.",
      G6: "PASS if continuous financial AI monitoring.",
    },
  },
  {
    key: "11",
    slug: "employment-accessibility-graph",
    title: "Employment Accessibility Graph",
    priority: "P2",
    horizon: "Participation",
    wave: "participation",
    claimState: CLAIM.DEV,
    dependencies: ["01", "02", "03"],
    strategicOutcome: "Jobs beyond matching: job ↔ skills ↔ workplace access ↔ adjustments ↔ transport ↔ optional support — with candidate-controlled disclosure.",
    participantOutcome: "Use Jobs without automatically revealing disability, diagnosis, or support needs to employers.",
    problem: "Employment barriers are access and transport as much as skills; disclosure is often forced.",
    scope: [
      "Workplace accessibility profiles, adjustment requests, interview accessibility, commute accessibility, support coordination, employer access improvements, placement sustainability",
    ],
    nonGoals: ["Forced disability disclosure", "Auto-share Access Passport with employers", "Worthiness scores"],
    userGroups: ["Candidates", "Employers", "Support coordinators", "Ambassadors"],
    journeys: [
      "Apply with skills only; separately request interview adjustments without diagnosis",
      "Commute accessibility check using Navigate + Passport before accepting interview",
    ],
    capabilities: ["Workplace access profiles", "Disclosure preview", "Adjustment requests", "Commute fit", "Retention follow-up"],
    sharedCore: ["Job/JobApplication", "InterviewAdjustmentRequest", "AccessPlace workplaces", "AccessPassport", "Transport"],
    dataEntities: ["Job", "JobApplication", "ApplicationDisclosurePreview", "InterviewAdjustmentRequest", "EmploymentProfile"],
    apisEvents: ["/api/jobs/*", "adjustment.requested", "disclosure.previewed"],
    permissionModel: "shareAdjustments default false; employer sees only consented fields.",
    consent: ["Candidate-controlled disclosure", "Purpose: recruitment vs workplace adjustment separate"],
    humanGates: ["Employer access improvement programmes", "Support coordination"],
    a11y: COMMON_A11Y,
    privacy: ["No diagnosis required", "Minimum disclosure"],
    safeguarding: ["No participant worthiness/risk scores"],
    aiUse: "Match explanations; commute options — not disclosure.",
    aiProhibited: ["Auto-disclose disability", "Worthiness ranking"],
    aiEvals: COMMON_AI_EVALS,
    audit: ["Disclosure previews", "Adjustment fulfilment"],
    observability: ["Interview accessibility", "Adjustment fulfilment", "13/26/52 retention"],
    complaints: "Discrimination/adjustment complaints path.",
    featureFlags: ["Starting Work pilot synthetic — claim.starting_work_live prohibited"],
    failureFallback: "Standard job apply forms without AI matching overlay.",
    security: ["Employer IDOR", "Disclosure field allowlists"],
    dor: ["Disclosure UX co-design", "Workplace AccessPlace linkage design"],
    dod: ["Jobs usable without disability reveal", "Commute fit optional", "Adjustment workflow"],
    mvp: ["Disclosure preview + interview adjustment + workplace access evidence link"],
    pilot: ["Starting Work style controlled pilot honesty"],
    scale: ["Retention KPIs"],
    kpis: ["Interview accessibility", "Placement rate", "Adjustment fulfilment", "Transport sustainability", "13/26/52-week retention"],
    risks: [
      { risk: "Accidental disclosure", mitigation: "Default false shares; previews; tests" },
      { risk: "Employer pressure UX", mitigation: "Dignity-of-risk + rights review G2" },
    ],
    deps: ["Epics 01–03", "Jobs module"],
    owner: "Jobs / employment owners",
    evidencePromotion: ["Disclosure IDOR tests", "Pilot retention"],
    features: [
      { key: "11-f1", title: "Workplace accessibility profiles", summary: "Workplaces as Access entities.", disposition: "EXTEND", reusePaths: ["AccessPlace", "AccessCapabilityRecord"], acceptance: ["Linked to jobs"] },
      { key: "11-f2", title: "Candidate-controlled disclosure", summary: "shareAdjustments default false.", disposition: "REUSE", reusePaths: ["JobApplication", "ApplicationDisclosurePreview"], acceptance: ["Preview before share"] },
      { key: "11-f3", title: "Interview adjustment requests", summary: "InterviewAdjustmentRequest flow.", disposition: "REUSE", reusePaths: ["InterviewAdjustmentRequest"], acceptance: ["No diagnosis required"] },
      { key: "11-f4", title: "Commute accessibility", summary: "Navigate + passport for interview.", disposition: "EXTEND", reusePaths: ["Epic 03", "transportSupportNeeded"], acceptance: ["Optional"] },
      { key: "11-f5", title: "Optional support coordination", summary: "Care/support links.", disposition: "EXTEND", reusePaths: ["careSupportNeeded"], acceptance: ["Participant approval"] },
      { key: "11-f6", title: "Placement sustainability", summary: "13/26/52 follow-up.", disposition: "EXTEND", reusePaths: ["employment outcomes"], acceptance: ["No worthiness score"] },
      { key: "11-f7", title: "Employer access improvements", summary: "Remediation suggestions to employers.", disposition: "NEW", reusePaths: ["Epic 01 corrections"], acceptance: ["Voluntary"] },
    ],
    gateCriteria: {
      G0: "PASS if employment access barriers evidenced.",
      G1: "PASS if disability-led disclosure co-design.",
      G2: "PASS if anti-discrimination/privacy review.",
      G3: "PASS if apply without disclosure + adjustment request.",
      G4: "PASS if controlled pilot honest labels.",
      G5: "PASS if placement/adjustment KPIs.",
      G6: "PASS if continuous disclosure-incident monitoring (target zero).",
    },
  },
  {
    key: "12",
    slug: "circular-assistive-technology",
    title: "Circular Assistive Technology Network",
    priority: "P3",
    horizon: "R&D",
    wave: "rd",
    claimState: CLAIM.EXPLORATORY,
    dependencies: ["02", "09"],
    strategicOutcome: "Trusted network for AT purchase/rental/reuse/service — without clinical or funding inference from listings.",
    participantOutcome: "Continuity of essential equipment first; marketplace circularity only when safe and honest.",
    problem: "AT disruption harms participation; marketplaces imply clinical suitability/funding incorrectly.",
    scope: [
      "Purchase, rental, reuse, refurbishment, trials, delivery, collection, servicing, recall tracking",
      "Equipment Passport concept: model, serial, ownership, condition, service history, warranty, recalls, compatibility, accessories",
    ],
    nonGoals: [
      "Clinical suitability SoT",
      "Infer listing = prescribed/safe/fundable",
      "Emergency dispatch",
      "Second consent/audit SoT",
    ],
    userGroups: ["Participants", "Repair partners", "Suppliers", "Funders (advisory)"],
    journeys: ["Register power wheelchair → outage → backup plan → authorised repair partner"],
    capabilities: ["AT Continuity Wave 1", "Equipment passport (later)", "Recall tracking (later)", "Marketplace hints only"],
    sharedCore: ["lib/platform/at-continuity", "Organisation", "Consent", "AuditEvent", "Care/Transport dependency links"],
    dataEntities: ["AtEquipmentAsset", "AtEquipmentOutage", "AtBackupPlan", "AtRepairPartnerRef", "AtDependencyLink"],
    apisEvents: ["at.outage.recorded", "at.backup.shown"],
    permissionModel: "Participant-owned assets; partner refs to Organisation.",
    consent: ["Share equipment details with repair partners purpose-bound"],
    humanGates: ["Notifications human-approved", "Clinical advice out of scope"],
    a11y: COMMON_A11Y,
    privacy: ["Serial/ownership minimization"],
    safeguarding: ["Recalls escalate; no clinical prescription"],
    aiUse: "Optional matching of repair partners — not suitability.",
    aiProhibited: ["Clinical suitability", "Funding certainty", "Prescription"],
    aiEvals: COMMON_AI_EVALS,
    audit: ["Asset and outage writes"],
    observability: ["Outage resolution time", "Backup plan coverage"],
    complaints: "Unsafe listing complaints when marketplace exists.",
    featureFlags: ["MAPABLE_AT_CONTINUITY_ENABLED=false", "W-AT-1"],
    failureFallback: "Manual contact cards for repair; flag off.",
    security: ["Ownership checks", "No second marketplace as clinical register"],
    dor: ["Freeze waiver W-AT-1", "Non-clinical language"],
    dod: ["Continuity journey works flag-on", "No clinical claims", "Audit"],
    mvp: ["AT Continuity acceptance journey (register→outage→backup→partner→deps)"],
    pilot: ["Limited participants; human-approved notifications"],
    scale: ["Circular marketplace only after separate G0–G5"],
    kpis: ["Outage recovery", "Dependency break rate"],
    risks: [
      { risk: "Marketplace implies clinical suitability", mitigation: "Explicit non-goals; UI disclaimers" },
      { risk: "Scope expands under freeze", mitigation: "W-AT-1 narrow waiver only" },
    ],
    deps: ["AT Continuity scaffold", "Epic 02/09"],
    owner: "AT Continuity / programmes owners",
    evidencePromotion: ["Wave 1 acceptance journey", "Flag default false preserved"],
    features: [
      { key: "12-f1", title: "AT Continuity register", summary: "Participant equipment assets.", disposition: "REUSE", reusePaths: ["lib/platform/at-continuity"], acceptance: ["Flag gated"] },
      { key: "12-f2", title: "Outage and backup plans", summary: "Continuity under failure.", disposition: "REUSE", reusePaths: ["AtEquipmentOutage", "AtBackupPlan"], acceptance: ["Audited writes"] },
      { key: "12-f3", title: "Repair partner links", summary: "Organisation refs.", disposition: "REUSE", reusePaths: ["AtRepairPartnerRef"], acceptance: ["No second directory"] },
      { key: "12-f4", title: "Operational dependency links", summary: "Care/Transport/Work deps.", disposition: "REUSE", reusePaths: ["AtDependencyLink"], acceptance: ["Typed targets"] },
      { key: "12-f5", title: "Equipment Passport", summary: "Service/warranty/recall fields.", disposition: "DEFER", reusePaths: [], acceptance: ["Not clinical"] },
      { key: "12-f6", title: "Circular marketplace", summary: "Reuse/rental network.", disposition: "DEFER", reusePaths: ["marketplace hints only"], acceptance: ["Listing ≠ suitable/fundable"] },
    ],
    gateCriteria: {
      G0: "PASS if AT disruption harms evidenced.",
      G1: "PASS if co-design with AT users.",
      G2: "PASS if clinical boundary review.",
      G3: "PASS if continuity journey proof flag-on in non-prod.",
      G4: "PASS if limited pilot; notifications human-approved.",
      G5: "PASS if continuity KPIs; marketplace still separate gate.",
      G6: "PASS if recall/outage monitoring.",
    },
  },
  {
    key: "13",
    slug: "access-api",
    title: "MapAble Access API",
    priority: "P2",
    horizon: "Platform Commercialisation",
    wave: "commercial",
    claimState: CLAIM.PROPOSED,
    dependencies: ["01", "06"],
    strategicOutcome: "Productise verified accessibility information as a partner API — never Access Passport data.",
    participantOutcome: "Better venue/transport/employer environments via partners consuming verified graph facts — without exposing personal passports.",
    problem: "Partners lack governed access to provenance-rich accessibility data; risk of leaking participant data via APIs.",
    scope: [
      "/places /access-features /access-observations /verifications /routes /venue-access /workplace-access /transport-access",
      "Provenance, timestamps, confidence, rate limiting, access controls, licensing, privacy boundaries, versioning, change history",
    ],
    nonGoals: ["Expose Access Passport", "Live personal accessibility truth without evidence gates", "Unversioned breaking changes"],
    userGroups: ["Councils", "Transport operators", "Employers", "Tourism", "Venue operators", "Developers", "Mapping providers"],
    journeys: ["Partner reads published venue features with confidence; cannot call passport endpoints"],
    capabilities: ["Partner API keys", "Scoped resources", "DTO filtering", "Licensing", "Versioning"],
    sharedCore: ["PartnerApiClient", "indoor partner DTO", "Access Graph", "Developer platform"],
    dataEntities: ["PartnerApiClient", "PartnerApiProgramEnrollment", "published AccessPlace projections"],
    apisEvents: ["/api/partners/v1/*", "future /access/* Lane 4 aliases"],
    permissionModel: "API keys hashed; scopes venues:read etc; no passport scopes.",
    consent: ["N/A for public place facts; contractual licensing for partners"],
    humanGates: ["Developer Platform + Access Infrastructure Council sign-off before production"],
    a11y: ["Partner docs accessible; embed viewer a11y"],
    privacy: ["No passport; no identifiable journeys", "Restricted zones filtered"],
    safeguarding: ["Do not expose sensitive restricted spatial zones"],
    aiUse: "None required for API productisation." ,
    aiProhibited: ["AI-invented features in API responses"],
    aiEvals: ["hallucinated accessibility fact must not appear in API payloads"],
    audit: ["API access logs", "key issuance"],
    observability: ["Rate limit hits", "Error rates", "Freshness of served evidence"],
    complaints: "Partner correction → graph dispute.",
    featureFlags: ["Partner APIs flag-gated", "public claims false until registry"],
    failureFallback: "Unavailable honest errors; no fake data.",
    security: [
      "Rate limiting",
      "Hashed keys",
      "DTO allowlists",
      "Edge UA/rate controls for scraping",
      "No prompt-injection via query to mutate graph",
    ],
    dor: ["Licensing model", "Scope matrix excludes passport"],
    dod: ["Provenance fields in responses", "Versioning", "Rate limits", "No passport routes"],
    mvp: ["Extend partners/v1 venues + features with provenance"],
    pilot: ["Limited partners; monitoring"],
    scale: ["SLA + licensing"],
    kpis: ["Partner adoption", "Stale payload rate", "Abuse/rate-limit events"],
    risks: [
      { risk: "Passport leakage", mitigation: "Hard route ban; contract tests" },
      { risk: "Scraping / AI harvesting", mitigation: "robots/ai.txt; edge rate limits; ToS" },
    ],
    deps: ["Epic 01", "Epic 06", "Developer platform"],
    owner: "Developer platform + Access Infrastructure",
    evidencePromotion: ["Penetration/IDOR review", "Council sign-off"],
    features: [
      { key: "13-f1", title: "Partner auth and scopes", summary: "API keys + scopes.", disposition: "REUSE", reusePaths: ["PartnerApiClient", "partner-api.md"], acceptance: ["Hashed keys"] },
      { key: "13-f2", title: "Places and features resources", summary: "Provenance-rich DTOs.", disposition: "EXTEND", reusePaths: ["partner-dto.ts", "API_CONTRACTS"], acceptance: ["confidence/timestamps"] },
      { key: "13-f3", title: "Observations and verifications", summary: "Read verified evidence.", disposition: "EXTEND", reusePaths: ["Epic 01"], acceptance: ["Status honesty"] },
      { key: "13-f4", title: "Routes and venue-access", summary: "Non-personal route summaries.", disposition: "NEW", reusePaths: ["Epic 03"], acceptance: ["No passport"] },
      { key: "13-f5", title: "Licensing versioning change history", summary: "Commercial controls.", disposition: "NEW", reusePaths: ["developer platform"], acceptance: ["Version header"] },
      { key: "13-f6", title: "Rate limiting and abuse controls", summary: "Edge + API limits.", disposition: "EXTEND", reusePaths: ["middleware rate limit plans"], acceptance: ["429 behaviour"] },
    ],
    gateCriteria: {
      G0: "PASS if partner demand evidenced without passport need.",
      G1: "PASS if disability-led review of what is published publicly.",
      G2: "PASS if privacy/licensing review; passport ban verified.",
      G3: "PASS if scoped partner read with provenance.",
      G4: "PASS if limited partners; monitoring.",
      G5: "PASS if abuse and freshness KPIs.",
      G6: "PASS if continuous API assurance.",
    },
  },
  {
    key: "14",
    slug: "access-observatory",
    title: "MapAble Access Observatory",
    priority: "P2",
    horizon: "Platform Commercialisation",
    wave: "commercial",
    claimState: CLAIM.PROPOSED,
    dependencies: ["01", "11"],
    strategicOutcome: "Aggregate accessibility intelligence for planners — privacy-preserving, no identifiable journeys.",
    participantOutcome: "Systemic barriers fixed upstream without surveilling individual travel.",
    problem: "Policy lacks aggregate access intelligence; naive analytics re-identify participants.",
    scope: [
      "Gaps, route barriers, inaccessible precincts, infrastructure opportunities, employment clusters, transport-access gaps, thin markets, data coverage",
      "Privacy-preserving aggregation",
    ],
    nonGoals: ["Identifiable participant journeys", "Worthiness/risk scores", "Claiming anonymous without basis"],
    userGroups: ["Councils", "Planners", "Policy", "Community orgs", "Researchers", "Transport operators", "Economic development"],
    journeys: ["Council views precinct gap heatmap with small-cell suppression"],
    capabilities: ["Metric registry", "Snapshots", "Exports with approval", "Research governance"],
    sharedCore: ["Analytics cloud", "deidentification", "research consent", "Access Graph aggregates"],
    dataEntities: ["MetricDefinition", "MetricSnapshot", "AnalyticsExport", "ResearchProject"],
    apisEvents: ["analytics.snapshot.created", "research.export.approved"],
    permissionModel: "Partner workspaces; export approvals; no raw journey access.",
    consent: ["Research uses ParticipantResearchConsent; operational aggregates separate"],
    humanGates: ["Export approval", "Ethics where research"],
    a11y: COMMON_A11Y,
    privacy: ["Small-cell suppression", "Pseudonymisation", "Never claim anonymous without documented basis"],
    safeguarding: ["No risk scores on people"],
    aiUse: "Optional cluster narratives — not person scoring.",
    aiProhibited: ["Participant worthiness/risk scores (hardcoded off)", "Re-identification assists"],
    aiEvals: COMMON_AI_EVALS,
    audit: ["Export approvals", "Query templates"],
    observability: ["Suppression rates", "Coverage metrics"],
    complaints: "Community challenge of misleading aggregates.",
    featureFlags: ["MAPABLE_ANALYTICS_CLOUD_ENABLED", "MAPABLE_RESEARCH_GOVERNANCE_ENABLED"],
    failureFallback: "Publish coverage docs only; disable exports.",
    security: ["Query allowlists", "Export encryption", "Access logging"],
    dor: ["Threat model for re-id", "Metric dictionary"],
    dod: ["Small-cell controls", "No identifiable journeys", "Worthiness scores remain false"],
    mvp: ["Coverage + gap snapshot for one LGA synthetic/pilot"],
    pilot: ["One council partner; export approval exercised"],
    scale: ["Multi-region with continuous privacy tests"],
    kpis: ["Data coverage", "Successful corrections fed back to graph", "Export rejection of unsafe queries"],
    risks: [
      { risk: "Re-identification", mitigation: "Small-cell; ethics; export gates" },
      { risk: "Policy misuse against communities", mitigation: "G1 co-design; CARE principles for First Nations data" },
    ],
    deps: ["Epic 01", "Analytics/research cloud", "optional Epic 11 aggregates"],
    owner: "Analytics / research governance owners",
    evidencePromotion: ["Privacy review", "Small-cell test evidence"],
    features: [
      { key: "14-f1", title: "Metric registry for access gaps", summary: "Governed metrics.", disposition: "EXTEND", reusePaths: ["lib/platform/analytics/"], acceptance: ["Registered definitions"] },
      { key: "14-f2", title: "Privacy-preserving snapshots", summary: "Aggregates with suppression.", disposition: "EXTEND", reusePaths: ["deidentification"], acceptance: ["Small-cell"] },
      { key: "14-f3", title: "Infrastructure opportunity views", summary: "Planner dashboards.", disposition: "NEW", reusePaths: ["admin analytics"], acceptance: ["No person drill-down"] },
      { key: "14-f4", title: "Employment cluster aggregates", summary: "From Epic 11 without identity.", disposition: "EXTEND", reusePaths: ["Jobs aggregates"], acceptance: ["K-anonymity thresholds"] },
      { key: "14-f5", title: "Research export governance", summary: "Ethics + DUA + consent.", disposition: "REUSE", reusePaths: ["lib/research/"], acceptance: ["Approval required"] },
      { key: "14-f6", title: "Feedback to Access Graph", summary: "Gap reports create investigation tasks.", disposition: "NEW", reusePaths: ["Epic 01"], acceptance: ["Not auto-facts"] },
    ],
    gateCriteria: {
      G0: "PASS if planners lack aggregate access intelligence.",
      G1: "PASS if community co-design including First Nations data governance where relevant.",
      G2: "PASS if privacy/re-id review.",
      G3: "PASS if suppressed snapshot for one region.",
      G4: "PASS if partner pilot; export gates.",
      G5: "PASS if privacy tests hold under load.",
      G6: "PASS if continuous re-id and disparity monitoring.",
    },
  },
  {
    key: "15",
    slug: "academy-capability-passport",
    title: "MapAble Academy + Capability Passport",
    priority: "P2",
    horizon: "Participation",
    wave: "participation",
    claimState: CLAIM.IMPL,
    dependencies: ["09"],
    strategicOutcome: "Shared learning layer where completion creates pending evidence — never automatic demonstrated competence.",
    participantOutcome: "Workers/drivers/assessors upskill with honest capability signals integrated to credentials.",
    problem: "Training completion is often misread as competence; credentials and academy stores diverge.",
    scope: [
      "Courses, competency assessment, evidence, expiry, refresher, role requirements, capability passport, credential integration",
    ],
    nonGoals: [
      "Course completion = demonstrated professional competence where supervised practice/registration required",
      "claim.academy_equals_competency",
      "Auto-verify passport evidence",
    ],
    userGroups: ["Support workers", "Drivers", "Assessors", "Providers", "Employers", "Venue staff", "MapAble personnel"],
    journeys: ["Complete course → pending competency proposal → human verifies → credential link"],
    capabilities: ["Enroll", "Completions", "Pending proposals", "Human verify", "Expiry/refresher"],
    sharedCore: ["TrainingCompletionRecord", "AcademyCompetencyProposal", "WorkerTrustCredential", "provider academy"],
    dataEntities: ["TrainingRequirement", "TrainingCompletionRecord", "AcademyCompetencyProposal", "provider academy enrollments"],
    apisEvents: ["/api/academy/enroll", "academy.completion.recorded", "competency.proposed", "competency.verified"],
    permissionModel: "Org enroll; human verifiers; participants don't see fake competence badges.",
    consent: ["Learner records purpose-limited to employment/compliance"],
    humanGates: ["Competency verification human-only"],
    a11y: COMMON_A11Y,
    privacy: ["Minimize learner PII in analytics"],
    safeguarding: ["Training ≠ safeguarding clearance alone"],
    aiUse: "Optional tutoring drafts — not competency grant.",
    aiProhibited: ["Auto competency verification", "Academy equals competence claims"],
    aiEvals: COMMON_AI_EVALS,
    audit: ["Proposal and verification"],
    observability: ["Pending→verified lag", "Expiry of training"],
    complaints: "Appeal failed verification." ,
    featureFlags: ["Provider academy permissions exist; public competence claims prohibited"],
    failureFallback: "Manual training registers; flag off AI tutoring.",
    security: ["No client-set verified competency", "Org scoping"],
    dor: ["Competence vs completion language locked", "Role requirement matrix"],
    dod: ["Completion→pending only", "Human verify", "Credential integration", "Honesty in UI"],
    mvp: ["Enroll→complete→pending proposal→human verify for one role"],
    pilot: ["One provider org"],
    scale: ["Cross-role passport; refresher SLAs"],
    kpis: ["Pending verification lag", "Expired training rate", "False competence claim incidents (target zero)"],
    risks: [
      { risk: "UI implies competence from completion", mitigation: "Copy + claim registry + tests" },
      { risk: "Duplicate training SoTs", mitigation: "Adapter pattern O8; no auto-verify" },
    ],
    deps: ["Epic 09", "provider academy"],
    owner: "Provider academy / workforce passport owners",
    evidencePromotion: ["O8 adapter tests", "UI honesty review"],
    features: [
      { key: "15-f1", title: "Course catalogue and enroll", summary: "Existing academy enroll.", disposition: "REUSE", reusePaths: ["/academy", "provider_academy:enroll"], acceptance: ["Permissioned"] },
      { key: "15-f2", title: "Completion records with expiry", summary: "TrainingCompletionRecord.", disposition: "REUSE", reusePaths: ["TrainingCompletionRecord"], acceptance: ["Expiry fields"] },
      { key: "15-f3", title: "Pending competency proposals", summary: "Completion → pending evidence.", disposition: "REUSE", reusePaths: ["AcademyCompetencyProposal"], acceptance: ["Never auto-verified"] },
      { key: "15-f4", title: "Human competency verification", summary: "Verifier workflow.", disposition: "EXTEND", reusePaths: ["workforce passport adapter"], acceptance: ["Human only"] },
      { key: "15-f5", title: "Capability passport view", summary: "Role requirements vs evidence.", disposition: "EXTEND", reusePaths: ["workforce readiness"], acceptance: ["Reason codes"] },
      { key: "15-f6", title: "Credential network integration", summary: "Link to Epic 09.", disposition: "EXTEND", reusePaths: ["WorkerTrustCredential"], acceptance: ["Supersession"] },
      { key: "15-f7", title: "Refresher and role requirements", summary: "Renewal cadences.", disposition: "EXTEND", reusePaths: ["TrainingRequirement"], acceptance: ["Reminders"] },
    ],
    gateCriteria: {
      G0: "PASS if competence/completion confusion harms trust.",
      G1: "PASS if worker/participant input on honest badges.",
      G2: "PASS if regulatory review of competence claims.",
      G3: "PASS if pending proposal path proven.",
      G4: "PASS if org pilot.",
      G5: "PASS if false-competence incidents zero.",
      G6: "PASS if continuous expiry/competence monitoring.",
    },
  },
];

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function bullets(items) {
  return items.map((i) => `- ${i}`).join("\n");
}

function numbered(items) {
  return items.map((i, idx) => `${idx + 1}. ${i}`).join("\n");
}

function writeEpic(epic) {
  const featuresMd = epic.features
    .map(
      (f) => `### ${f.key} — ${f.title}
**Disposition:** ${f.disposition}  
**Summary:** ${f.summary}  
**Reuse paths:** ${f.reusePaths.length ? f.reusePaths.map((p) => `\`${p}\``).join(", ") : "_none_"}  
**Acceptance:**
${bullets(f.acceptance)}
`,
    )
    .join("\n");

  const gatesMd = GATE_KEYS.map((g) => `- **${g}:** ${epic.gateCriteria[g]}`).join("\n");

  const risksMd = epic.risks.map((r) => `| ${r.risk} | ${r.mitigation} |`).join("\n");

  const md = `# EPIC ${epic.key} — ${epic.title}

| Field | Value |
| --- | --- |
| Epic ID / slug | \`EPIC-${epic.key}\` / \`${epic.slug}\` |
| Priority | ${epic.priority} |
| Delivery horizon | ${epic.horizon} |
| Wave | ${WAVES[epic.wave]} |
| Current claim state | **${epic.claimState}** |
| Dependencies | ${epic.dependencies.length ? epic.dependencies.map((d) => `EPIC-${d}`).join(", ") : "None (foundation)"} |
| Recommended owner | ${epic.owner} |

> **Honesty:** Documentation and work items are not production evidence. Feature flags are not assurance. Public claims remain governed by \`docs/convergence-os/PUBLIC_CLAIM_REGISTRY.md\`. Implementation requires freeze waiver or freeze lift per \`docs/remediation/FEATURE_FREEZE.md\`.

## 1. Epic title
${epic.title}

## 2. Epic ID / proposed slug
\`EPIC-${epic.key}\` · \`${epic.slug}\`

## 3. Strategic outcome
${epic.strategicOutcome}

## 4. Participant outcome
${epic.participantOutcome}

## 5. Problem statement
${epic.problem}

## 6. Scope
${bullets(epic.scope)}

## 7. Explicit non-goals
${bullets(epic.nonGoals)}

## 8. User groups
${bullets(epic.userGroups)}

## 9. Example user journeys
${bullets(epic.journeys)}

## 10. Functional capabilities
${bullets(epic.capabilities)}

## 11. Shared Core dependencies
${bullets(epic.sharedCore)}

## 12. Cross-Epic dependencies
${epic.dependencies.length ? bullets(epic.dependencies.map((d) => `EPIC-${d}`)) : "- None"}

## 13. Data entities
${bullets(epic.dataEntities)}

## 14. APIs / events required
${bullets(epic.apisEvents)}

## 15. Permission model
${epic.permissionModel}

## 16. Consent requirements
${bullets(epic.consent)}

## 17. Human approval gates
${bullets(epic.humanGates)}

## 18. Accessibility acceptance criteria
${bullets(epic.a11y)}

## 19. Privacy requirements
${bullets(epic.privacy)}

## 20. Safeguarding requirements
${bullets(epic.safeguarding)}

## 21. AI use, if any
${epic.aiUse}

## 22. AI prohibited decisions
${bullets(epic.aiProhibited)}

## 23. AI eval requirements
${bullets(epic.aiEvals)}

## 24. Audit requirements
${bullets(epic.audit)}

## 25. Observability requirements
${bullets(epic.observability)}

## 26. Complaints / correction path
${epic.complaints}

## 27. Feature flags
${bullets(epic.featureFlags)}

## 28. Failure and fallback behaviour
${epic.failureFallback}

## 29. Security requirements
${bullets(epic.security)}

## 30. Definition of Ready
${bullets(epic.dor)}

## 31. Definition of Done
${bullets(epic.dod)}

## 32. MVP acceptance criteria
${bullets(epic.mvp)}

## 33. Pilot acceptance criteria
${bullets(epic.pilot)}

## 34. Scale acceptance criteria
${bullets(epic.scale)}

## 35. KPIs
${bullets(epic.kpis)}

## 36. Risks
${bullets(epic.risks.map((r) => r.risk))}

## 37. Mitigations
${bullets(epic.risks.map((r) => `${r.risk} → ${r.mitigation}`))}

| Risk | Mitigation |
| --- | --- |
${risksMd}

## 38. Dependencies
${bullets(epic.deps)}

## 39. Recommended owner / team
${epic.owner}

## 40. Delivery horizon
${epic.horizon} (${WAVES[epic.wave]})

## 41. Current claim state
**${epic.claimState}** — grounded in repository inspection (Prisma/services/docs), not strategy documents.

## 42. Evidence required before claim-state promotion
${bullets(epic.evidencePromotion)}

---

## Features (4–8)

${featuresMd}

## Stage-gate pass/fail (Epic-specific)

${gatesMd}

See also: [PORTFOLIO_STAGE_GATES.md](../PORTFOLIO_STAGE_GATES.md).

## Minimum stage-gate Features (programme-linked)

Link rather than rebuild: G0 Problem Evidence · G1 Disability-Led Co-design · G2 Rights/Accessibility/Risk Review · G3 Technical Proof · G4 Controlled Pilot · G5 Evidence to Scale · G6 Continuous Assurance.
`;

  fs.writeFileSync(path.join(EPICS_DIR, `${epic.key}-${epic.slug}.md`), md);
}

function writeProgrammeDocs() {
  const summaryRows = epics
    .map(
      (e) =>
        `| ${e.key} | ${e.title} | ${e.priority} | ${WAVES[e.wave]} | ${e.claimState} | ${(e.dependencies.map((d) => d).join(", ") || "—")} |`,
    )
    .join("\n");

  const coreRows = CORE_MAP.map(([a, b]) => `| ${a} | ${b} |`).join("\n");

  const portfolio = `# MapAble Innovation Portfolio

**Programme:** MapAble — Australian Disability Ltd  
**Artefact type:** Delivery-ready portfolio documentation (not production readiness)  
**Branch intent:** \`docs/innovation/\` only  
**Azure DevOps:** Import-ready representation only — **no live work items created** in this pass  
**Feature freeze:** Active — see \`docs/remediation/FEATURE_FREEZE.md\`. Implementation of Epics requires waiver or freeze lift.

## Operating principles

Design every Epic around:

- participant choice, autonomy and decision ownership;
- dignity of risk rather than paternalistic risk elimination;
- supported decision-making;
- purpose-bound consent;
- privacy and minimum-necessary disclosure;
- accessible communication, including AAC;
- WCAG 2.2 AA as a release criterion (manual AT required; axe alone insufficient);
- human escalation for consequential decisions;
- auditable provenance;
- feature flags and safe rollback;
- non-AI fallback paths;
- evidence before prediction.

Claim states used: Verified live · Implemented, not independently verified · In development · Proposed · Exploratory · Historical.

Honesty sources: \`docs/convergence-os/PUBLIC_CLAIM_REGISTRY.md\`, \`docs/productisation/CAPABILITY_REGISTRY.md\`, \`docs/ai-platform/CURRENT_STATE.md\`, \`lib/transport/feature-status.ts\`.

## Architectural north star

**Accessibility infrastructure + participant-controlled service orchestration.**

Flywheel: Map → Access Graph → Personal Access Passport → Accessible Navigation → Service Orchestration → Care / Transport / Jobs → Outcomes and evidence → Improved Access Graph.

Shared Core — extend existing SoT; do not duplicate identity, consent, messaging, audit, complaints, credential, billing, or accessibility systems inside verticals.

## Repository state inspected (summary)

| Area | Finding |
| --- | --- |
| Stack | pnpm 10, Next.js 15 App Router, Prisma 6, PostgreSQL, NextAuth |
| Apps | \`app/\` web, \`apps/companion\` Expo scaffold, \`apps/realtime-server\` |
| Schema | \`prisma/schema.prisma\` (~721 models); AccessPlace, AccessPassport, evidence envelopes present |
| Verticals | Care, Transport (\`TransportTrip\` SoT), Jobs, Billing, Access, Accreditation, Messaging, Incidents |
| AI | Capability registry; Navigator under W-AA-1; public AI claims false |
| CI | GitHub Actions (no Azure Pipelines); production-claims + accessibility workflows |
| Deploy | Vercel + Neon; Azure AD OAuth only (not Azure DevOps) |
| Freeze | Active; documentation permitted |

## Shared Core reuse map

| Requested concept | Repository mapping / disposition |
| --- | --- |
${coreRows}

## 15-Epic summary

| ID | Title | Priority | Wave | Claim state | Depends on |
| --- | --- | --- | --- | --- | --- |
${summaryRows}

## Delivery sequence

1. **Foundation:** 01 Access Graph (P0), 02 Passport, 06 Accreditation OS, 09 Credentials, thin 08 messaging/prefs  
2. **Experience:** 03 Navigate, remaining 08 channels  
3. **Controlled intelligence:** 07 Orchestration Agent, 10 Funding integrity  
4. **Participation:** 11 Employment graph, 15 Academy  
5. **Commercialisation:** 13 Access API, 14 Observatory  
6. **R&D:** 04 Vision, 05 Digital Twins, 12 Circular AT  

**Tweak vs default:** Epic 08 thin slice can start in Foundation because the first vertical slice needs accessible status/escalation. Epic 05 has more indoor code than Epic 04 but both stay R&D — schema ≠ live personal safety truth.

## First vertical slice — Accessible Appointment / Employment Journey

Smallest cross-Epic set: **01 + 02 + 03 + 07 + thin 08**, plus existing Care and Transport — **not** full 11/04/05/12/13/14.

Behaviour: understand requirements → destination evidence + confidence → accessible routes → compatible transport/optional support → draft plan → participant approval → execute approved actions only → status updates → cancel/change → human escalate → outcomes/corrections.

Rule: **MODEL PROPOSES → POLICY SERVICES VALIDATE → PARTICIPANT DECIDES → AUTHORISED SYSTEM EXECUTES.**

## Security programme note (agent orchestration risks)

When Epics that accept free-text or expose APIs are implemented, enforce layered controls consistent with platform hardening:

- Edge middleware interception for \`/api\`, \`/admin\`, \`/dashboard\` (rate limit, AI scraper UA drop, prompt-injection query sanitization);
- \`verifyPayloadSafe\` isolation filter before Prisma mutations on free-text;
- \`public/ai.txt\` and \`public/robots.txt\` data boundary maps for transactional endpoints.

These are **implementation controls for later code PRs**, not claimed complete by this documentation portfolio.

## Recommended next implementation Epic

**EPIC 01 — MapAble Access Graph** (after freeze waiver + G0/G1).

## Exact next Codex action

1. Human validate this portfolio (duplication, ownership, sequence).  
2. Do **not** create Azure DevOps work items until validated (\`AZURE_DEVOPS_IMPORT.md\`).  
3. Next implementation PR: narrow Access Graph provenance/freshness/verification slice on existing \`AccessPlace\` / evidence envelope writers — not a new graph DB, not Vision, not API commercialisation.  
4. Run \`pnpm setup:cloud-agent\`, \`pnpm type-check\`, \`pnpm build\` before any code PR merge.

## Epic files

${epics.map((e) => `- [EPIC ${e.key} — ${e.title}](./epics/${e.key}-${e.slug}.md)`).join("\n")}

## Related programme files

- [PORTFOLIO_DEPENDENCY_MAP.md](./PORTFOLIO_DEPENDENCY_MAP.md)
- [PORTFOLIO_STAGE_GATES.md](./PORTFOLIO_STAGE_GATES.md)
- [PORTFOLIO_KPIS.md](./PORTFOLIO_KPIS.md)
- [PORTFOLIO_RISK_REGISTER.md](./PORTFOLIO_RISK_REGISTER.md)
- [PORTFOLIO_ROADMAP.md](./PORTFOLIO_ROADMAP.md)
- [AZURE_DEVOPS_IMPORT.md](./AZURE_DEVOPS_IMPORT.md)
- [azure-devops-portfolio.json](./azure-devops-portfolio.json)
`;

  fs.writeFileSync(path.join(OUT, "MAPABLE_INNOVATION_PORTFOLIO.md"), portfolio);

  const depMd = `# Portfolio Dependency Map

## Epic dependency graph

\`\`\`mermaid
flowchart TB
  e01[01 Access Graph]
  e02[02 Passport]
  e06[06 Accreditation OS]
  e09[09 Credentials]
  e08[08 Communications]
  e03[03 Navigate]
  e07[07 Orchestration]
  e10[10 Funding Integrity]
  e11[11 Employment Graph]
  e15[15 Academy]
  e13[13 Access API]
  e14[14 Observatory]
  e04[04 Vision]
  e05[05 Digital Twins]
  e12[12 Circular AT]
  e01 --> e02
  e01 --> e03
  e02 --> e03
  e01 --> e06
  e09 --> e06
  e02 --> e08
  e01 --> e07
  e02 --> e07
  e03 --> e07
  e08 --> e07
  e09 --> e10
  e01 --> e11
  e02 --> e11
  e03 --> e11
  e09 --> e15
  e01 --> e13
  e06 --> e13
  e01 --> e14
  e11 --> e14
  e01 --> e04
  e06 --> e04
  e01 --> e05
  e03 --> e05
  e02 --> e12
  e09 --> e12
\`\`\`

## Shared Core links (do not rebuild)

${bullets([
  "Identity/auth — lib/auth",
  "Consent/receipts — lib/consent",
  "Authority/delegates — lib/authority + DelegateInvitation",
  "Audit — lib/audit",
  "Messaging — lib/messages",
  "Complaints/incidents — Complaint / IncidentReport",
  "Credentials — WorkerTrustCredential",
  "Feature flags — fail-closed env flags",
  "Access place identity — AccessPlace C-011",
  "Access passport — AccessPassport C-010",
])}

## Feature-level predecessor notes

| Epic | Must precede Features in |
| --- | --- |
| 01 | 02 taxonomy refs, 03 journey evaluate, 06 graph publish, 11 workplace profiles, 13/14 aggregates, 04/05 evidence |
| 02 | 03 fit, 07 tools, 08 prefs, 11 disclosure, 12 AT share |
| 09 | 06 assessor identity, 10 trust signals, 15 credential link, 12 partner trust |
| 03 + thin 08 | 07 first vertical slice |
| 06 | 04 assessor validation, 13 verified payloads |
`;

  fs.writeFileSync(path.join(OUT, "PORTFOLIO_DEPENDENCY_MAP.md"), depMd);

  const gates = `# Portfolio Stage Gates

Every Epic moves through G0–G6. Epic-specific pass/fail criteria live in each epic file. This document defines the **programme standard**.

## Gate definitions

### G0 — Problem Evidence
**Pass:** Documented evidence the problem is real for disabled people / operators; links to incidents, research, or co-design discovery.  
**Fail:** Only commercial speculation or vendor push.

### G1 — Disability-Led Co-design
**Pass:** Paid, meaningful co-design with disabled people affected; DRO engagement per \`docs/co-design-protocol.md\` where HITL AI applies (S0/S1).  
**Fail:** Internal-only design; unpaid token consultation.

### G2 — Rights, Accessibility & Risk Review
Review checklist must clear: participant autonomy; consent; privacy; accessibility; safeguarding; bias; data use; regulatory exposure; dignity of risk; complaints; non-AI fallback.  
**Pass:** Written review with named owners; residual risks accepted.  
**Fail:** Unresolved forced disclosure, AI-prohibited decisions, or WCAG claim without path to manual AT.

### G3 — Technical Proof
**Pass:** Smallest end-to-end proof on canonical SoT; flags default false; tests.  
**Fail:** Demo that invents verified facts, second SoT, or ungoverned agent execute.

### G4 — Controlled Pilot
**Pass:** Feature flag; limited cohort; monitoring; rollback; support process; human escalation; incident handling; honesty labels.  
**Fail:** Public claim enabled; open enrollment; no kill switch.

### G5 — Evidence to Scale
**Pass:** Pilot KPIs support rollout; accessibility/privacy incidents within threshold; claim registry evidence attached.  
**Fail:** Scale by anecdote; unresolved critical incidents.

### G6 — Continuous Assurance
Monitor: accessibility regressions; complaints; incidents; consent failures; data-quality degradation; credential expiry; AI errors; model drift; cohort disparities; operational failures.  
**Pass:** Dashboards + on-call ownership + review cadence.  
**Fail:** Ship-and-forget.

## Minimum stage-gate Features (link from every Epic)

1. G0 Problem Evidence pack  
2. G1 Co-design record  
3. G2 Rights & risk review  
4. G3 Technical proof spike  
5. G4 Controlled pilot charter  
6. G5 Scale evidence pack  
7. G6 Continuous assurance hooks  

Do not duplicate product Features for these; reference this file.

## Accessibility release gate (all user-facing Features)

${bullets(COMMON_A11Y)}

## AI governance gate (AI-enabled Epics)

Use AI for: search, summarisation, explanation, drafting, recommendation, planning, classification, extraction, low-risk anomaly detection.  
Deterministic controls outside the model. Explicit approval before consequential actions. Prefer **one agent** first.

Minimum eval set:
${bullets(COMMON_AI_EVALS)}
`;

  fs.writeFileSync(path.join(OUT, "PORTFOLIO_STAGE_GATES.md"), gates);

  const kpis = `# Portfolio KPIs

## Access intelligence
- % places with feature-level evidence
- Evidence freshness distribution
- Verified vs inferred observations
- Successful corrections
- False/inaccurate accessibility report rate
- Accessible-route completion

## Participant control
- Consent comprehension proxies
- Disclosure revocation success
- Participant override rate
- Recommendation accept/reject rate
- Unauthorised disclosure incidents — **target zero**

## Care / Transport
- Coordinated journey completion
- Vehicle mismatch rate
- Missed support rate
- Participant-requested change success

## Jobs
- Interview accessibility
- Placement rate
- Adjustment fulfilment
- Transport sustainability
- 13/26/52-week retention

## Trust
- Credential-expiry exceptions
- Incident response time
- Complaints resolution
- Disputed evidence corrections

## AI
- Task success
- Unsupported-claim rate
- Unsafe recommendation rate
- Escalation precision
- Tool misuse / forbidden action attempts
- Non-AI fallback success
- Accessibility parity
- Cohort disparity

## Mapping to existing harnesses
- Analytics/metric registry: \`lib/platform/analytics/\` (flag-gated)
- AI evals: \`lib/ai/platform/evaluations/**\`, \`pnpm ai:evals\`
- Transport honesty: \`lib/transport/feature-status.ts\`
- Public claims: ConvergenceOS public claim registry (all currently disallowed)
`;

  fs.writeFileSync(path.join(OUT, "PORTFOLIO_KPIS.md"), kpis);

  const risks = `# Portfolio Risk Register

| ID | Risk | Severity | Epics | Mitigation |
| --- | --- | --- | --- | --- |
| R1 | Duplicate SoTs (consent, place, billing, transport) | Critical | All | DOMAIN_OWNERSHIP + C-010/C-011; REUSE/EXTEND only |
| R2 | Feature freeze conflict / speculative verticals | High | All | Docs-only until waiver; narrow PRs |
| R3 | WCAG claimed without manual AT | High | User-facing | Manual matrix; no conformance claim |
| R4 | ConsentReceipt gaps (expiry/field lists) | High | 02,07,08,11 | EXTEND receipts before scale |
| R5 | Safeguarding AI decisions | Critical | 07,10 | Human-only; prohibited uses; evals |
| R6 | Hallucinated accessibility facts | Critical | 01,03,04,07,13 | Provenance enums; inferred≠verified |
| R7 | NDIS claimability false certainty | Critical | 10 | Advisory wording; NDIA submit off |
| R8 | Academy = competence | High | 15,09 | Pending proposals; claim ban |
| R9 | Observatory re-identification | Critical | 14 | Small-cell; export gates; CARE principles |
| R10 | Vision → accreditation | Critical | 04,06 | Hard block; human assessor only |
| R11 | Agent swarm / reward hacking | High | 07 | One agent; policy outside model; kill switches |
| R12 | Passport on public Access API | Critical | 02,13 | Route ban; contract tests |
| R13 | Silent credential expiry approval | Critical | 09 | Fail closed assignment |
| R14 | AT listing as clinical/fundable | High | 12 | Explicit non-goals; W-AT-1 scope |
| R15 | AI scraper / prompt-injection harvesting | High | 07,13,08 | Edge UA drop, rate limit, query sanitize, verifyPayloadSafe, ai.txt/robots.txt |
`;

  fs.writeFileSync(path.join(OUT, "PORTFOLIO_RISK_REGISTER.md"), risks);

  const roadmap = `# Portfolio Roadmap

## Waves

| Wave | Epics | Intent |
| --- | --- | --- |
| Foundation | 01, 02, 06, 09, thin 08 | Access evidence + participant control + trust |
| Experience | 03, full 08 | Accessible journeys and communications |
| Controlled intelligence | 07, 10 | One agent + advisory funding integrity |
| Participation | 11, 15 | Employment access + honest capability |
| Commercialisation | 13, 14 | Partner API + privacy-preserving Observatory |
| R&D | 04, 05, 12 | Vision, twins, circular AT |

## First demonstrator

**Accessible Appointment / Employment Journey** using Epics 01, 02, 03, 07, thin 08 + existing Care/Transport.

## Recommended next implementation

1. Validate portfolio  
2. Freeze waiver for Epic 01 narrow slice  
3. Implement provenance/freshness/verification on Access Graph  
4. Then Passport granular sharing (02)  
5. Then Navigate suitability corridor (03)  
6. Then Navigator governed pilot (07) under W-AA-1 + co-design gates  

## Explicitly not next

Vision production inference, Digital Twin AR, Access API GA, Observatory identifiable analytics, Circular AT marketplace, multi-agent swarms, live NDIA submit.
`;

  fs.writeFileSync(path.join(OUT, "PORTFOLIO_ROADMAP.md"), roadmap);

  const ado = `# Azure DevOps Import Strategy

## Status of this pass

**Items deliberately not created** in Azure DevOps (or any work-item system):

- No Epics
- No Features
- No PBIs/Tasks

Reason: mission requires reviewable portfolio first; validate duplication, dependencies, scope, ownership, sequence. This repository has **no Azure DevOps pipelines or Boards config** (GitHub + Vercel). Azure AD OAuth ≠ Azure DevOps.

## Hierarchy

\`\`\`
Epic
  → Feature
      → User Story / Product Backlog Item
          → Task
              → Test / Evidence
\`\`\`

For initial import create **Epics + Features only** (4–8 Features each). Do not explode Tasks.

## Idempotent create rules

1. Search existing work items by tag \`mapable-innovation\` and field \`ExternalKey\` / title prefix \`EPIC-NN\` / \`EPIC-NN-F#\`.  
2. If found, update description from markdown; do not duplicate.  
3. Keys:
   - Epic: \`mapable.epic.${"${NN}"}\`
   - Feature: \`mapable.feature.${"${NN}"}.${"${featureKey}"}\`
4. Tags: \`mapable\`, \`innovation\`, \`disability-led\`, \`epic-NN\`, wave tag, claim-state tag.  
5. Links: Predecessor/Successor from \`PORTFOLIO_DEPENDENCY_MAP.md\` and \`azure-devops-portfolio.json\`.  
6. Custom field (recommended): \`ClaimState\`, \`Disposition\` on Features (REUSE/EXTEND/…).  
7. Area Path / Iteration: set by programme after validation — do not invent org structure here.

## Import sources

- Human-readable: \`docs/innovation/epics/*.md\`
- Machine: \`docs/innovation/azure-devops-portfolio.json\`
- Process: CSV or Azure DevOps REST + idempotent script (to be written only after validation)

## After validation (authorised write)

Record for each created item: work item ID, URL, parent, dependencies, state.  
Commit an \`AZURE_DEVOPS_CREATED.md\` evidence ledger — still not a production claim.

## Security note for future automation

Any import bot credentials must be least-privilege; do not embed PATs in the repo; do not allow agents to create work items without human validation flag.
`;

  fs.writeFileSync(path.join(OUT, "AZURE_DEVOPS_IMPORT.md"), ado);
}

function writeJson() {
  const payload = {
    meta: {
      programme: "MapAble Innovation Portfolio",
      organisation: "Australian Disability Ltd",
      generatedAt: new Date().toISOString(),
      azureDevOpsItemsCreated: false,
      publicClaimsAllowed: false,
      featureFreezeActive: true,
      firstVerticalSlice: ["01", "02", "03", "07", "08-thin"],
      recommendedNextEpic: "01",
    },
    sharedCoreMapping: CORE_MAP.map(([requested, mapping]) => ({ requested, mapping })),
    waves: WAVES,
    epics: epics.map((e) => ({
      key: e.key,
      externalKey: `mapable.epic.${e.key}`,
      title: e.title,
      slug: e.slug,
      priority: e.priority,
      horizon: e.horizon,
      wave: e.wave,
      claimState: e.claimState,
      dependencies: e.dependencies,
      owner: e.owner,
      features: e.features.map((f) => ({
        key: f.key,
        externalKey: `mapable.feature.${f.key}`,
        title: f.title,
        disposition: f.disposition,
        reusePaths: f.reusePaths,
        acceptance: f.acceptance,
      })),
    })),
  };
  fs.writeFileSync(path.join(OUT, "azure-devops-portfolio.json"), JSON.stringify(payload, null, 2));
}

ensureDir(EPICS_DIR);
for (const epic of epics) writeEpic(epic);
writeProgrammeDocs();
writeJson();

// Validation
const files = fs.readdirSync(EPICS_DIR).filter((f) => f.endsWith(".md"));
if (files.length !== 15) throw new Error(`Expected 15 epics, got ${files.length}`);
for (const e of epics) {
  if (e.features.length < 4 || e.features.length > 8) {
    throw new Error(`Epic ${e.key} feature count ${e.features.length} out of 4–8`);
  }
  for (const g of GATE_KEYS) {
    if (!e.gateCriteria[g]) throw new Error(`Epic ${e.key} missing ${g}`);
  }
}
JSON.parse(fs.readFileSync(path.join(OUT, "azure-devops-portfolio.json"), "utf8"));
console.log(`Generated ${files.length} epics + programme docs into ${OUT}`);
