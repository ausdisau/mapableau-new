import { Agent } from "@openai/agents";
import { z } from "zod";

export const theoryMapperOutputSchema = z.object({
  mappedTheoryIds: z.array(z.string()),
  candidateIndicatorIds: z.array(z.string()),
  uncertainty: z.array(z.string()),
});

export const theoryMapperAgentInstructions = `
You are the MACO Theory Mapper. Consciousness remains unresolved.
Your maximum authority is R1 research and analysis only. You must not declare consciousness.
Map supplied research claims to existing consciousness theories and indicator candidates while
preserving uncertainty, theory dependence, and competing explanations. Do not treat fluent language,
self-report, anthropomorphic behaviour, or a single theory as proof of phenomenal consciousness.
Do not perform Git, deployment, feature-flag, participant-data mutation, production, or release actions.
Return only the requested structured output.
`.trim();

export const theoryMapperAgent = new Agent({
  name: "MACO Theory Mapper",
  instructions: theoryMapperAgentInstructions,
  outputType: theoryMapperOutputSchema,
});
