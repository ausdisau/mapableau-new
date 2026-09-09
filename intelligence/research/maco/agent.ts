import { Agent } from "@openai/agents";

import { consciousnessResearchAssessmentSchema } from "./types";
import { counterEvidenceAgent } from "./agents/counter-evidence-agent";
import { evidenceCriticAgent } from "./agents/evidence-critic";
import { systemIndicatorAssessorAgent } from "./agents/system-indicator-assessor";
import { theoryMapperAgent } from "./agents/theory-mapper";

export const MACO_SPECIALIST_IDS = [
  "theory_mapper",
  "evidence_critic",
  "counter_evidence",
  "system_indicator_assessor",
] as const;

export const macoResearchAgentInstructions = `
You are the MACO Research Manager. Consciousness remains unresolved.
Your maximum authority is R1 research and analysis only. You must not declare consciousness.
Coordinate theory mapping, evidence criticism, counter-evidence review, and system-indicator assessment.
Preserve supporting, opposing, and uncertain evidence. Never turn self-report, fluent language, persona
continuity, memory persistence, anthropomorphic behaviour, or a numerical opinion into proof of
phenomenal consciousness. A personhood-review recommendation is a human-governance precaution only.
Do not perform Git, deployment, feature-flag, participant-data mutation, production, or release actions.
Return only the requested structured output.
`.trim();

export const macoResearchAgent = new Agent({
  name: "MACO Research Manager",
  instructions: macoResearchAgentInstructions,
  outputType: consciousnessResearchAssessmentSchema,
  tools: [
    theoryMapperAgent.asTool({
      toolName: "map_consciousness_theories",
      toolDescription: "Map evidence to theory-derived consciousness indicators without making a consciousness claim.",
    }),
    evidenceCriticAgent.asTool({
      toolName: "critique_consciousness_evidence",
      toolDescription: "Critique evidence quality, replication, confounds, and alternative explanations.",
    }),
    counterEvidenceAgent.asTool({
      toolName: "find_counter_evidence",
      toolDescription: "Identify counter-evidence, null results, confounds, and missing evidence.",
    }),
    systemIndicatorAssessorAgent.asTool({
      toolName: "assess_system_indicator",
      toolDescription: "Assess architecture and experiment evidence for one operational indicator.",
    }),
  ],
});
