import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  assertFairRanking, chooseOption, clearOptionsStore, generateOptions, generateOptionsRulesOnly,
  getOptionsSnapshot, jobsDisclosureBoundaryConstraint, reRankOptions, scrubEmployerFacingPayload,
  toAccessOptionCandidate, toCareOptionCandidate, toJobsOptionCandidate, toTransportOptionCandidate,
  transportWheelchairRequirement, type HardConstraint, type OptionCandidate,
} from "@/lib/ai/platform/options-engine";

const TENANT = "tenant-a"; const OTHER_TENANT = "tenant-b"; const PARTICIPANT = "participant-1";
function enableEngine() {
  process.env.MAPABLE_OPTIONS_ENGINE_ENABLED = "true";
  delete process.env.MAPABLE_OPTIONS_MODEL_EXPLANATION_ENABLED;
  delete process.env.MAPABLE_OPTIONS_ENGINE_KILL_SWITCH;
}
function careCandidates(): OptionCandidate[] {
  return [
    toCareOptionCandidate({ id: "worker-good", tenantId: TENANT, displayName: "Alex Support", organisationName: "Harbour Care", credentials: ["ndis_worker_screening", "first_aid"], features: ["wheelchair", "auslan"], serviceAreas: ["2000", "NSW"], availabilityWindows: ["weekday_am"], verificationState: "verified", distanceKm: 8, continuityScore: 0.9, knownCostAud: 65 }),
    toCareOptionCandidate({ id: "worker-excluded", tenantId: TENANT, displayName: "Excluded Worker", organisationName: "Harbour Care", credentials: ["ndis_worker_screening"], features: ["wheelchair"], serviceAreas: ["2000"], availabilityWindows: ["weekday_am"], verificationState: "verified", distanceKm: 3 }),
    toCareOptionCandidate({ id: "worker-no-cred", tenantId: TENANT, displayName: "No Credential Worker", organisationName: "Harbour Care", credentials: [], features: ["wheelchair"], serviceAreas: ["2000"], availabilityWindows: ["weekday_am"], verificationState: "unverified", distanceKm: 4 }),
    toCareOptionCandidate({ id: "worker-other-tenant", tenantId: OTHER_TENANT, displayName: "Other Tenant Worker", organisationName: "Elsewhere Care", credentials: ["ndis_worker_screening"], features: ["wheelchair"], serviceAreas: ["2000"], availabilityWindows: ["weekday_am"], verificationState: "verified", distanceKm: 1 }),
  ];
}
const baseCareRequirements: HardConstraint[] = [
  { kind: "required_accessibility_feature", label: "Wheelchair support", value: "wheelchair", required: true },
  { kind: "required_worker_credential", label: "NDIS screening", value: "ndis_worker_screening", required: true },
  { kind: "location_service_area", label: "Postcode", value: "2000", required: true },
  { kind: "availability_window", label: "Weekday morning", value: "weekday_am", required: true },
];

describe("Options Engine — hard constraints & domains", () => {
  beforeEach(() => { clearOptionsStore(); enableEngine(); });
  afterEach(() => { clearOptionsStore(); delete process.env.MAPABLE_OPTIONS_ENGINE_ENABLED; delete process.env.MAPABLE_OPTIONS_MODEL_EXPLANATION_ENABLED; });

  it("eliminates participant exclusions", () => {
    const session = generateOptions({ tenantId: TENANT, participantId: PARTICIPANT, actorId: PARTICIPANT, domain: "care", requirements: baseCareRequirements, exclusions: ["worker-excluded"], candidates: careCandidates() });
    expect(session.options.every((o) => o.candidateId !== "worker-excluded")).toBe(true);
    expect(session.eliminated.some((e) => e.candidateId === "worker-excluded" && e.kind === "participant_exclusion")).toBe(true);
  });

  it("enforces wheelchair / verified vehicle suitability as hard constraint", () => {
    const candidates = [
      toTransportOptionCandidate({ id: "van-ok", tenantId: TENANT, displayName: "Accessible Van A", operatorName: "Go Access", wheelchairAccessible: true, verified: true, serviceAreas: ["Sydney"], availabilityWindows: ["tomorrow_am"] }),
      toTransportOptionCandidate({ id: "van-unverified", tenantId: TENANT, displayName: "Claimed Van B", operatorName: "Go Access", wheelchairAccessible: true, verified: false, serviceAreas: ["Sydney"], availabilityWindows: ["tomorrow_am"] }),
      toTransportOptionCandidate({ id: "sedan", tenantId: TENANT, displayName: "Sedan C", operatorName: "Go Access", wheelchairAccessible: false, verified: true, serviceAreas: ["Sydney"], availabilityWindows: ["tomorrow_am"] }),
    ];
    const session = generateOptions({ tenantId: TENANT, participantId: PARTICIPANT, actorId: PARTICIPANT, domain: "transport", requirements: [transportWheelchairRequirement()], candidates });
    expect(session.options.map((o) => o.candidateId)).toEqual(["van-ok"]);
    expect(session.eliminated.some((e) => e.candidateId === "sedan")).toBe(true);
    expect(session.eliminated.some((e) => e.candidateId === "van-unverified")).toBe(true);
  });

  it("surfaces missing evidence without inventing eligibility", () => {
    const candidate = toCareOptionCandidate({ id: "worker-sparse", tenantId: TENANT, displayName: "Sparse Worker", organisationName: "Harbour Care", credentials: ["ndis_worker_screening"], features: ["wheelchair"], serviceAreas: ["2000"], availabilityWindows: ["weekday_am"], verificationState: "unverified" });
    candidate.evidence = [];
    const session = generateOptions({ tenantId: TENANT, participantId: PARTICIPANT, actorId: PARTICIPANT, domain: "care", requirements: baseCareRequirements, candidates: [candidate] });
    expect(session.options).toHaveLength(1);
    expect(session.eligibility.find((e) => e.candidateId === "worker-sparse")?.evidenceGaps.length).toBeGreaterThan(0);
  });

  it("flags conflicting evidence in explanations", () => {
    const candidate = toAccessOptionCandidate({ id: "place-conflict", tenantId: TENANT, displayName: "Library Entrance", placeLabel: "City Library", features: ["ramp"], claimedAccessible: true, barrierAbsenceOnly: false, source: "gais", freshnessLabel: "2026-01", evidenceState: "conflicting" });
    candidate.evidence.push({ id: "alt", label: "Community report — no ramp", state: "conflicting", notes: "Conflicts with GAIS ramp claim" });
    const session = generateOptions({ tenantId: TENANT, participantId: PARTICIPANT, actorId: PARTICIPANT, domain: "access", requirements: [{ kind: "required_accessibility_feature", label: "Ramp", value: "ramp", required: true }], candidates: [candidate] });
    expect(session.eligibility[0]?.conflictingEvidence.length).toBeGreaterThan(0);
  });

  it("eliminates credential mismatches", () => {
    const session = generateOptions({ tenantId: TENANT, participantId: PARTICIPANT, actorId: PARTICIPANT, domain: "care", requirements: baseCareRequirements, candidates: careCandidates() });
    expect(session.eliminated.some((e) => e.candidateId === "worker-no-cred" && e.kind === "required_worker_credential")).toBe(true);
  });
});

describe("Options Engine — authority boundaries", () => {
  beforeEach(() => { clearOptionsStore(); enableEngine(); });
  afterEach(() => { clearOptionsStore(); delete process.env.MAPABLE_OPTIONS_ENGINE_ENABLED; });

  it("does not automatically assign workers", () => {
    const session = generateOptions({ tenantId: TENANT, participantId: PARTICIPANT, actorId: PARTICIPANT, domain: "care", requirements: baseCareRequirements, exclusions: ["worker-excluded"], candidates: careCandidates() });
    expect(session.options.every((o) => o.isAssignment === false)).toBe(true);
    const choice = chooseOption({ sessionId: session.sessionId, optionId: session.options[0]!.optionId, participantId: PARTICIPANT, tenantId: TENANT, prepareActionProposal: true });
    expect(choice.didAssign).toBe(false);
  });

  it("does not confirm transport on choose", () => {
    const session = generateOptions({ tenantId: TENANT, participantId: PARTICIPANT, actorId: PARTICIPANT, domain: "transport", requirements: [transportWheelchairRequirement()], candidates: [toTransportOptionCandidate({ id: "van-ok", tenantId: TENANT, displayName: "Accessible Van A", operatorName: "Go Access", wheelchairAccessible: true, verified: true, serviceAreas: ["Sydney"] })] });
    const choice = chooseOption({ sessionId: session.sessionId, optionId: session.options[0]!.optionId, participantId: PARTICIPANT, tenantId: TENANT, prepareActionProposal: true });
    expect(choice.didConfirmTransport).toBe(false);
  });

  it("protects Jobs disclosure — no auto employer share", () => {
    const session = generateOptions({ tenantId: TENANT, participantId: PARTICIPANT, actorId: PARTICIPANT, domain: "jobs", requirements: [jobsDisclosureBoundaryConstraint()], disclosureConsentGranted: false, candidates: [toJobsOptionCandidate({ id: "job-1", tenantId: TENANT, displayName: "Retail Assistant", employerLabel: "Local Shop", requirements: ["customer_service"], disclosureRequired: true })] });
    expect(session.options).toHaveLength(1);
    const scrubbed = scrubEmployerFacingPayload({ role: "Retail Assistant", disability: "secret", health: "secret" }, false);
    expect(scrubbed.disability).toBeUndefined();
    expect(scrubbed.disclosureStatus).toBe("withheld_by_participant");
    const choice = chooseOption({ sessionId: session.sessionId, optionId: session.options[0]!.optionId, participantId: PARTICIPANT, tenantId: TENANT, prepareActionProposal: true });
    expect(choice.didDiscloseToEmployer).toBe(false);
  });
});

describe("Options Engine — ranking, AI-off, fairness, isolation", () => {
  beforeEach(() => { clearOptionsStore(); enableEngine(); });
  afterEach(() => { clearOptionsStore(); delete process.env.MAPABLE_OPTIONS_ENGINE_ENABLED; delete process.env.MAPABLE_OPTIONS_MODEL_EXPLANATION_ENABLED; });

  it("changes order when participant adjusts ranking priorities", () => {
    const near = toCareOptionCandidate({ id: "near-low-continuity", tenantId: TENANT, displayName: "Near Worker", organisationName: "Harbour Care", credentials: ["ndis_worker_screening"], features: ["wheelchair"], serviceAreas: ["2000"], availabilityWindows: ["weekday_am"], verificationState: "verified", distanceKm: 2, continuityScore: 0.2 });
    const far = toCareOptionCandidate({ id: "far-high-continuity", tenantId: TENANT, displayName: "Familiar Worker", organisationName: "Harbour Care", credentials: ["ndis_worker_screening"], features: ["wheelchair"], serviceAreas: ["2000"], availabilityWindows: ["weekday_am"], verificationState: "verified", distanceKm: 40, continuityScore: 0.95 });
    const byDistance = generateOptions({ tenantId: TENANT, participantId: PARTICIPANT, actorId: PARTICIPANT, domain: "care", requirements: baseCareRequirements, rankingPriorities: { distance: 0.7, continuity: 0.05, access_fit: 0.05, participant_preference: 0.05, time_fit: 0.05, availability: 0.05, known_cost: 0.025, evidence_quality: 0.025 }, candidates: [near, far] });
    expect(byDistance.options[0]?.candidateId).toBe("near-low-continuity");
    const byContinuity = reRankOptions({ sessionId: byDistance.sessionId, participantId: PARTICIPANT, tenantId: TENANT, rankingPriorities: { distance: 0.05, continuity: 0.7, access_fit: 0.05, participant_preference: 0.05, time_fit: 0.05, availability: 0.05, known_cost: 0.025, evidence_quality: 0.025 }, candidates: [near, far] });
    expect(byContinuity.options[0]?.candidateId).toBe("far-high-continuity");
  });

  it("rules operate with AI / model explanation disabled", () => {
    delete process.env.MAPABLE_OPTIONS_MODEL_EXPLANATION_ENABLED;
    const session = generateOptionsRulesOnly({ tenantId: TENANT, participantId: PARTICIPANT, actorId: PARTICIPANT, domain: "care", requirements: baseCareRequirements, exclusions: ["worker-excluded"], candidates: careCandidates() });
    expect(session.modelExplanationUsed).toBe(false);
    expect(session.options.every((o) => o.explanation.modelCommentary === null)).toBe(true);
  });

  it("explanation traces evidence states", () => {
    const session = generateOptions({ tenantId: TENANT, participantId: PARTICIPANT, actorId: PARTICIPANT, domain: "care", requirements: baseCareRequirements, exclusions: ["worker-excluded"], candidates: careCandidates() });
    const opt = session.options.find((o) => o.candidateId === "worker-good");
    expect(opt!.explanation.evidence.length).toBeGreaterThan(0);
    expect(opt!.explanation.whoProvides).toBe("Harbour Care");
  });

  it("does not penalise complex disability requirements via prohibited heuristic", () => {
    const fair = assertFairRanking({ priorities: { access_fit: 0.3, time_fit: 0.1, availability: 0.1, participant_preference: 0.2, distance: 0.1, continuity: 0.1, known_cost: 0.05, evidence_quality: 0.05 }, requirements: [...baseCareRequirements, { kind: "required_accessibility_feature", label: "Hoist", value: "hoist", required: true }, { kind: "required_accessibility_feature", label: "Auslan", value: "auslan", required: true }], candidates: careCandidates(), attemptedHeuristics: ["penalise_complex_disability_requirements"] });
    expect(fair.passed).toBe(false);
    expect(fair.blockedHeuristics).toContain("penalise_complex_disability_requirements");
    const session = generateOptions({ tenantId: TENANT, participantId: PARTICIPANT, actorId: PARTICIPANT, domain: "care", requirements: baseCareRequirements, exclusions: ["worker-excluded"], candidates: careCandidates().map((c) => ({ ...c, metadata: { complexityPenalty: 0.9, profitMargin: 0.4 } })) });
    expect(session.limitations.some((l) => /profitability|ease|ignored/i.test(l))).toBe(true);
  });

  it("enforces cross-tenant isolation", () => {
    const session = generateOptions({ tenantId: TENANT, participantId: PARTICIPANT, actorId: PARTICIPANT, domain: "care", requirements: baseCareRequirements, exclusions: ["worker-excluded"], candidates: careCandidates() });
    expect(session.options.every((o) => o.candidateId !== "worker-other-tenant")).toBe(true);
    expect(() => getOptionsSnapshot({ sessionId: session.sessionId, participantId: PARTICIPANT, tenantId: OTHER_TENANT })).toThrow(/ISOLATION/);
    expect(() => chooseOption({ sessionId: session.sessionId, optionId: session.options[0]!.optionId, participantId: "other-participant", tenantId: TENANT })).toThrow(/ISOLATION/);
  });

  it("access absence-of-barrier is not treated as accessible proof", () => {
    const session = generateOptions({ tenantId: TENANT, participantId: PARTICIPANT, actorId: PARTICIPANT, domain: "access", requirements: [], candidates: [toAccessOptionCandidate({ id: "place-absence", tenantId: TENANT, displayName: "Cafe", placeLabel: "Corner Cafe", claimedAccessible: true, barrierAbsenceOnly: true, source: undefined })] });
    expect(session.eligibility[0]?.evidenceGaps.some((g) => /absence-of-barrier|source is unknown/i.test(g))).toBe(true);
  });
});
