import { getAgentConfig } from "../agent-registry";
import { buildMapableStrandsAgent } from "../build-agent";

export const providerOperationsAgent = buildMapableStrandsAgent(
  getAgentConfig("provider_operations")
);
