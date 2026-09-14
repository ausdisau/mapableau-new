import { describe, expect, it } from "vitest";
import { buildFullLifeHarnessInput } from "@/lib/platform/full-life";
import {
  baselineAssurance,
  baselineCandidateOptions,
  baselineMission,
  baselinePriorities,
  baselineResourceEnvelope,
} from "./fixtures";

function build(mission = baselineMission) {
  return buildFullLifeHarnessInput({
    mission,
    actorId: "actor-synthetic-001",
    participantId: "participant-synthetic-001",
    participantPriorities: baselinePriorities,
    assurance: baselineAssurance,
    resourceEnvelope: baselineResourceEnvelope,
    commercialInfluence: [],
    candidateOptions: baselineCandidateOptions,
    evaluatedAt: "2026-09-14T01:00:00.000Z",
  });
}

describe("buildFullLifeHarnessInput", () => {
  it("binds to the exact mission and proposal identifiers", () => {
    const input = build();
    expect(input.missionId).toBe(baselineMission.missionId);
    expect(input.proposalIds).toEqual(
      baselineMission.actionProposals.map((proposal) => proposal.id),
    );
  });

  it("creates a sha256 mission-plan hash", () => {
    expect(build().missionPlanHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("changes the plan hash when the objective changes", () => {
    const changed = {
      ...baselineMission,
      objective: `${baselineMission.objective} changed`,
    };
    expect(build(changed).missionPlanHash).not.toBe(build().missionPlanHash);
  });

  it("changes the plan hash when action proposals change", () => {
    const changed = {
      ...baselineMission,
      actionProposals: baselineMission.actionProposals.map((proposal, index) =>
        index === 0
          ? { ...proposal, purpose: `${proposal.purpose} changed` }
          : proposal,
      ),
    };
    expect(build(changed).missionPlanHash).not.toBe(build().missionPlanHash);
  });

  it("deduplicates evidence references and does not synthesize verification", () => {
    const input = buildFullLifeHarnessInput({
      mission: baselineMission,
      actorId: "actor-synthetic-001",
      participantId: "participant-synthetic-001",
      participantPriorities: baselinePriorities,
      assurance: {
        ...baselineAssurance,
        authority: {
          ...baselineAssurance.authority,
          evidenceRefs: ["same-synthetic-ref", "same-synthetic-ref"],
        },
        consent: {
          ...baselineAssurance.consent,
          evidenceRefs: ["same-synthetic-ref"],
        },
      },
      resourceEnvelope: baselineResourceEnvelope,
      commercialInfluence: [],
      candidateOptions: baselineCandidateOptions,
      evaluatedAt: "2026-09-14T01:00:00.000Z",
    });

    expect(input.evidenceRefs.filter((ref) => ref === "same-synthetic-ref")).toHaveLength(1);
    expect(input.assurance.evidence.verificationInflationRefs).toEqual([]);
  });
});
