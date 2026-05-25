import { getAgentConfig } from "../agent-registry";
import { buildMapableStrandsAgent } from "../build-agent";

export const billingPricingAgent = buildMapableStrandsAgent(
  getAgentConfig("billing_pricing")
);
