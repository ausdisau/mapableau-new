import { describe, expect, it } from "vitest";

import { theoryMapperAgent, theoryMapperAgentInstructions, theoryMapperOutputSchema } from "@/intelligence/research/maco/agents/theory-mapper";
import { evidenceCriticAgent, evidenceCriticAgentInstructions, evidenceCriticOutputSchema } from "@/intelligence/research/maco/agents/evidence-critic";
import { counterEvidenceAgent, counterEvidenceAgentInstructions, counterEvidenceOutputSchema } from "@/intelligence/research/maco/agents/counter-evidence-agent";
import { systemIndicatorAssessorAgent, systemIndicatorAssessorInstructions, systemIndicatorAssessmentOutputSchema } from "@/intelligence/research/maco/agents/system-indicator-assessor";
import { MACO_SPECIALIST_IDS, macoResearchAgent, macoResearchAgentInstructions } from "@/intelligence/research/maco/agent";

describe("MACO bounded research agent network", () => {
  it("keeps scientific uncertainty and R1 authority explicit in every agent", () => {
    for (const [agent, instructionText] of [
      [theoryMapperAgent, theoryMapperAgentInstructions],
      [evidenceCriticAgent, evidenceCriticAgentInstructions],
      [counterEvidenceAgent, counterEvidenceAgentInstructions],
      [systemIndicatorAssessorAgent, systemIndicatorAssessorInstructions],
      [macoResearchAgent, macoResearchAgentInstructions],
    ] as const) {
      const instructions = instructionText.toLowerCase();
      expect(instructions).toContain("consciousness remains unresolved");
      expect(instructions).toContain("r1");
      expect(instructions).toContain("must not declare consciousness");
      expect(agent).toBeTruthy();
    }
  });

  it("always includes the Counter-Evidence Agent in the manager specialist set", () => {
    expect(MACO_SPECIALIST_IDS).toContain("counter_evidence");
  });

  it("forbids the system assessor from inferring internal properties from fluent language or self-report alone", () => {
    const instructions = systemIndicatorAssessorInstructions.toLowerCase();
    expect(instructions).toContain("fluent language");
    expect(instructions).toContain("self-report");
    expect(instructions).toContain("must not infer internal properties");
  });

  it("uses structured schemas for all specialist outputs", () => {
    expect(theoryMapperOutputSchema.safeParse({ mappedTheoryIds: ["gwt"], candidateIndicatorIds: ["broadcast"], uncertainty: ["Architecture evidence incomplete"] }).success).toBe(true);
    expect(evidenceCriticOutputSchema.safeParse({ evidenceIds: ["e1"], concerns: ["Replication unknown"], alternativeExplanations: ["Task inference"], recommendedDirection: "uncertain" }).success).toBe(true);
    expect(counterEvidenceOutputSchema.safeParse({ counterEvidenceIds: ["e2"], unresolvedConfounds: ["Prompt dependence"], missingEvidence: ["Independent replication"] }).success).toBe(true);
    expect(systemIndicatorAssessmentOutputSchema.safeParse({ systemId: "mapable-companion", systemVersion: "research", indicatorId: "broadcast", architectureEvidenceIds: ["arch-1"], experimentEvidenceIds: [], observedStatus: "partial", mimicryRisk: "high", confidence: "low", limitations: ["No privileged-state-access experiment"] }).success).toBe(true);
  });
});
