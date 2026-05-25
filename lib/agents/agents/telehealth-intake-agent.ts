import { getAgentConfig } from "../agent-registry";
import { buildMapableStrandsAgent } from "../build-agent";

export const telehealthIntakeAgent = buildMapableStrandsAgent(
  getAgentConfig("telehealth_intake")
);
