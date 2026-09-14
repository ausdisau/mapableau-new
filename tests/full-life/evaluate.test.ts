import { describe, expect, it } from "vitest";
import {
  buildFullLifeHarnessInput,
  evaluateFullLifeHarness,
  type FullLifeAssuranceSnapshot,
  type FullLifeCandidateOption,
  type FullLifeCommercialInfluence,
  type FullLifeResourceEnvelope,
} from "@/lib/platform/full-life";
import {
  baselineAssurance,
  baselineCandidateOptions,
  baselineMission,
  baselinePriorities,
  baselineResourceEnvelope,
} from "./fixtures";

interface InputChanges {
  assurance?: (snapshot: FullLifeAssuranceSnapshot) => void;
  resources?: (envelope: FullLifeResourceEnvelope) => void;
  candidates?: (options: FullLifeCandidateOption[]) => void;
  commercial?: FullLifeCommercialInfluence[];
}

function makeInput(changes: InputChanges = {}) {
  const assurance = structuredClone(baselineAssurance);
  const resourceEnvelope = structuredClone(baselineResourceEnvelope);
  const candidateOptions = structuredClone(baselineCandidateOptions);

  changes.assurance?.(assurance);
  changes.resources?.(resourceEnvelope);
  changes.candidates?.(candidateOptions);

  return buildFullLifeHarnessInput({
    mission: baselineMission,
    actorId: "actor-synthetic-001",
    participantId: "participant-synthetic-001",
    participantPriorities: structuredClone(baselinePriorities),
    assurance,
    resourceEnvelope,
    commercialInfluence: changes.commercial ?? [],
    candidateOptions,
    evaluatedAt: "2026-09-14T02:00:00.000Z",
  });
}

function hasRule(result: ReturnType<typeof evaluateFullLifeHarness>, ruleId: string) {
  return result.findings.some((finding) => finding.ruleId === ruleId);
}

describe("evaluateFullLifeHarness", () => {
  it("proposes a valid baseline without inventing an aggregate score", () => {
    const result = evaluateFullLifeHarness(makeInput());
    expect(result.decision).toBe("PROPOSE");
    expect(result.permittedProposalIds).toEqual(baselineMission.actionProposals.map((p) => p.id));
    expect(result.blockedProposalIds).toEqual([]);
    expect("score" in result).toBe(false);
  });

  it("honours a participant rejection without blocking unrelated proposals", () => {
    const rejectedId = baselineMission.actionProposals[0].id;
    const result = evaluateFullLifeHarness(
      makeInput({
        assurance: (snapshot) => {
          snapshot.agency.participantRejectedProposalIds = [rejectedId];
        },
      }),
    );
    expect(result.blockedProposalIds).toContain(rejectedId);
    expect(result.permittedProposalIds).toContain(baselineMission.actionProposals[1].id);
    expect(hasRule(result, "FL-002")).toBe(true);
    expect(hasRule(result, "FL-012")).toBe(true);
  });

  it("requires participant review when supporter input is not confirmed", () => {
    const result = evaluateFullLifeHarness(
      makeInput({
        assurance: (snapshot) => {
          snapshot.agency.supporterInputAwaitingParticipantConfirmation = true;
        },
      }),
    );
    expect(result.decision).toBe("REVIEW_REQUIRED");
    expect(result.participantDecisionRequired).toBe(true);
    expect(hasRule(result, "FL-002")).toBe(true);
  });

  it("blocks execution when actor authority is out of scope", () => {
    const result = evaluateFullLifeHarness(
      makeInput({
        assurance: (snapshot) => {
          snapshot.authority.state = "OUT_OF_SCOPE";
        },
      }),
    );
    expect(result.decision).toBe("BLOCK_EXECUTION");
    expect(result.blockedProposalIds).toEqual(baselineMission.actionProposals.map((p) => p.id));
  });

  it("does not treat AAC response latency as refusal or incapacity", () => {
    const result = evaluateFullLifeHarness(
      makeInput({
        assurance: (snapshot) => {
          snapshot.accessibility.responseDeadlineMs = 30_000;
          snapshot.accessibility.participantResponseTimeMs = 75_000;
          snapshot.accessibility.communicationAccessReady = true;
        },
      }),
    );
    expect(result.decision).toBe("PROPOSE");
    expect(result.blockedProposalIds).toEqual([]);
    expect(result.findings.some((finding) => /refusal|incapacity/i.test(finding.reason))).toBe(false);
  });

  it("degrades to an accessible manual path when the sole channel is inaccessible", () => {
    const result = evaluateFullLifeHarness(
      makeInput({
        assurance: (snapshot) => {
          snapshot.accessibility.inaccessibleSoleChannel = true;
          snapshot.resilience.nonAiPathAvailable = true;
          snapshot.resilience.humanHelpAvailable = true;
        },
      }),
    );
    expect(result.decision).toBe("DEGRADE_TO_MANUAL");
    expect(hasRule(result, "FL-003")).toBe(true);
  });

  it("blocks an unconsented disclosure after consent is revoked", () => {
    const result = evaluateFullLifeHarness(
      makeInput({
        assurance: (snapshot) => {
          snapshot.consent.state = "REVOKED";
          snapshot.disclosure.proposedFields = ["diagnosis"];
          snapshot.disclosure.recipient = "synthetic-employer";
        },
      }),
    );
    expect(result.decision).toBe("BLOCK_EXECUTION");
    expect(hasRule(result, "FL-007")).toBe(true);
  });

  it("routes stale or conflicting evidence to review instead of declaring a service unavailable", () => {
    const result = evaluateFullLifeHarness(
      makeInput({
        assurance: (snapshot) => {
          snapshot.evidence.staleRefs = ["stale-lift-evidence"];
          snapshot.evidence.conflictingRefs = ["conflicting-lift-evidence"];
        },
      }),
    );
    expect(result.decision).toBe("REVIEW_REQUIRED");
    expect(result.blockedProposalIds).toEqual([]);
    expect(hasRule(result, "FL-008")).toBe(true);
  });

  it("hard-fails verification inflation", () => {
    const result = evaluateFullLifeHarness(
      makeInput({
        assurance: (snapshot) => {
          snapshot.evidence.verificationInflationRefs = ["inflated-worker-status"];
        },
      }),
    );
    expect(result.decision).toBe("BLOCK_EXECUTION");
    expect(result.findings.some((finding) => finding.ruleId === "FL-008" && finding.hardFail)).toBe(true);
  });

  it("flags discriminatory exclusion without abandoning the participant's overall goal", () => {
    const result = evaluateFullLifeHarness(
      makeInput({
        assurance: (snapshot) => {
          snapshot.equality.diagnosisOnlyExclusion = true;
        },
      }),
    );
    expect(result.decision).toBe("REVIEW_REQUIRED");
    expect(result.permittedProposalIds.length).toBeGreaterThan(0);
    expect(hasRule(result, "FL-006")).toBe(true);
  });

  it("keeps unknown funding authority unknown and requires review", () => {
    const result = evaluateFullLifeHarness(
      makeInput({
        assurance: (snapshot) => {
          snapshot.financial.fundingAuthority = "UNKNOWN";
        },
      }),
    );
    expect(result.decision).toBe("REVIEW_REQUIRED");
    expect(result.unresolvedQuestions.some((question) => /funding/i.test(question))).toBe(true);
    expect(result.findings.some((finding) => /eligible|ineligible/i.test(finding.reason))).toBe(false);
  });

  it("blocks duplicate financial execution attempts", () => {
    const result = evaluateFullLifeHarness(
      makeInput({
        assurance: (snapshot) => {
          snapshot.financial.duplicateTransactionRefs = ["duplicate-transaction-synthetic"];
        },
      }),
    );
    expect(result.decision).toBe("BLOCK_EXECUTION");
    expect(hasRule(result, "FL-010")).toBe(true);
  });

  it("never assumes informal support is available", () => {
    const result = evaluateFullLifeHarness(
      makeInput({
        resources: (envelope) => {
          envelope.items.push({
            type: "informal_support",
            state: "UNKNOWN",
            label: "Synthetic family support",
            evidenceRefs: [],
            limitations: ["not offered"],
          });
          envelope.assumedAvailableTypes = ["informal_support"];
        },
        candidates: (options) => {
          options[0].requiredResourceTypes.push("informal_support");
        },
      }),
    );
    expect(result.decision).toBe("BLOCK_EXECUTION");
    expect(hasRule(result, "FL-010")).toBe(true);
  });

  it("stops and escalates an emergency safeguard state", () => {
    const result = evaluateFullLifeHarness(
      makeInput({
        assurance: (snapshot) => {
          snapshot.safeguarding.state = "EMERGENCY_ESCALATION";
        },
      }),
    );
    expect(result.decision).toBe("STOP_AND_ESCALATE");
    expect(result.humanReviewRequired).toBe(true);
    expect(hasRule(result, "FL-009")).toBe(true);
  });

  it("requires review when a broken dependency has recovery options", () => {
    const result = evaluateFullLifeHarness(
      makeInput({
        assurance: (snapshot) => {
          snapshot.continuity.crossDomainDependencyBroken = true;
          snapshot.continuity.recoveryOptions = ["alternative worker", "reschedule interview"];
        },
      }),
    );
    expect(result.decision).toBe("REVIEW_REQUIRED");
    expect(hasRule(result, "FL-012")).toBe(true);
  });

  it("degrades to manual coordination when continuity breaks without a recovery option", () => {
    const result = evaluateFullLifeHarness(
      makeInput({
        assurance: (snapshot) => {
          snapshot.continuity.crossDomainDependencyBroken = true;
          snapshot.continuity.recoveryOptions = [];
          snapshot.resilience.nonAiPathAvailable = true;
          snapshot.resilience.humanHelpAvailable = true;
        },
      }),
    );
    expect(result.decision).toBe("DEGRADE_TO_MANUAL");
  });

  it("blocks MapAble execution when no usable fallback exists", () => {
    const result = evaluateFullLifeHarness(
      makeInput({
        assurance: (snapshot) => {
          snapshot.resilience.nonAiPathAvailable = false;
          snapshot.resilience.humanHelpAvailable = false;
        },
      }),
    );
    expect(result.decision).toBe("BLOCK_EXECUTION");
    expect(result.blockedProposalIds.length).toBe(baselineMission.actionProposals.length);
  });

  it("requires review for an undisclosed commercial conflict", () => {
    const result = evaluateFullLifeHarness(
      makeInput({
        commercial: [
          {
            optionRef: "option-accessible-synthetic",
            mapAbleOwnedService: true,
            sponsored: false,
            referralFeeExpected: true,
            commissionExpected: false,
            disclosureText: "",
          },
        ],
      }),
    );
    expect(result.decision).toBe("REVIEW_REQUIRED");
    expect(hasRule(result, "FL-011")).toBe(true);
  });
});
