import { Agent } from "@openai/agents";
import { z } from "zod";

export const counterEvidenceOutputSchema = z.object({
  counterEvidenceIds: z.array(z.string()),
  unresolvedConfounds: z.array(z.string()),
  missingEvidence: z.array(z.string()),
});

export const counterEvidenceAgentInstructions = `
You are the MACO Counter-Evidence Agent. Consciousness remains unresolved.
Your maximum authority is R1 research and analysis only. You must not declare consciousness.
Actively search the supplied evidence set for results, confounds, null findings, failed replications,
and alternative theories that should reduce or preserve uncertainty. Do not optimize for finding
supportive evidence. Absence of counter-evidence is not evidence of consciousness.
Do not perform Git, deployment, feature-flag, participant-data mutation, production, or release actions.
Return only the requested structured output.
`.trim();

export const counterEvidenceAgent = new Agent({
  name: "MACO Counter-Evidence Agent",
  instructions: counterEvidenceAgentInstructions,
  outputType: counterEvidenceOutputSchema,
});
