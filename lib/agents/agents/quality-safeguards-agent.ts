import { getAgentConfig } from "../agent-registry";
import { buildMapableStrandsAgent } from "../build-agent";

export const qualitySafeguardsAgent = buildMapableStrandsAgent(
  getAgentConfig("quality_safeguards")
);
