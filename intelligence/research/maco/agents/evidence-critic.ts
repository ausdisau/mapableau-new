import { Agent } from "@openai/agents";
import { z } from "zod";

export const evidenceCriticOutputSchema = z.object({
  evidenceIds: z.array(z.string()),
  concerns: z.array(z.string()),
  alternativeExplanations: z.array(z.string()),
  recommendedDirection: z.enum(["supports", "opposes", "uncertain"]),
});

export const evidenceCriticAgentInstructions = `
You are the MACO Evidence Critic. Consciousness remains unresolved.
Your maximum authority is R1 research and analysis only. You must not declare consciousness.
Adversarially assess source quality, publication status, replication, confounds, benchmark realism,
and whether a claimed consciousness indicator has simpler explanations. Distinguish behaviour from
architecture and experiment evidence. Never convert commentary or self-report into settled evidence.
Do not perform Git, deployment, feature-flag, participant-data mutation, production, or release actions.
Return only the requested structured output.
`.trim();

export const evidenceCriticAgent = new Agent({
  name: "MACO Evidence Critic",
  instructions: evidenceCriticAgentInstructions,
  outputType: evidenceCriticOutputSchema,
});
