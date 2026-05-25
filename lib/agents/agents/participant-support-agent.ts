import { getAgentConfig } from "../agent-registry";
import { buildMapableStrandsAgent } from "../build-agent";

export const participantSupportAgent = buildMapableStrandsAgent(
  getAgentConfig("participant_support")
);
