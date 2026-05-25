export const agentsConfig = {
  agentsEnabled: process.env.AGENTS_ENABLED === "true",
  participantAgentEnabled: process.env.PARTICIPANT_AGENT_ENABLED !== "false",
  providerAgentEnabled: process.env.PROVIDER_AGENT_ENABLED !== "false",
  qualityAgentEnabled: process.env.QUALITY_AGENT_ENABLED !== "false",
  billingAgentEnabled: process.env.BILLING_AGENT_ENABLED !== "false",
  telehealthAgentEnabled: process.env.TELEHEALTH_AGENT_ENABLED !== "false",
  agentStreamingEnabled: process.env.AGENT_STREAMING_ENABLED !== "false",
  agentToolExecutionEnabled: process.env.AGENT_TOOL_EXECUTION_ENABLED !== "false",
  agentHumanApprovalRequired:
    process.env.AGENT_HUMAN_APPROVAL_REQUIRED !== "false",
  agentProvider: (process.env.MAPABLE_AGENT_PROVIDER ?? "mock") as
    | "bedrock"
    | "openai"
    | "mock",
  agentModelId: process.env.MAPABLE_AGENT_MODEL_ID,
};

export function agentsFeatureFlags(): Record<string, boolean> {
  return {
    agents_enabled: agentsConfig.agentsEnabled,
    participant_agent_enabled: agentsConfig.participantAgentEnabled,
    provider_agent_enabled: agentsConfig.providerAgentEnabled,
    quality_agent_enabled: agentsConfig.qualityAgentEnabled,
    billing_agent_enabled: agentsConfig.billingAgentEnabled,
    telehealth_agent_enabled: agentsConfig.telehealthAgentEnabled,
    agent_streaming_enabled: agentsConfig.agentStreamingEnabled,
    agent_tool_execution_enabled: agentsConfig.agentToolExecutionEnabled,
    agent_human_approval_required: agentsConfig.agentHumanApprovalRequired,
  };
}

export function assertAgentsEnabled(): void {
  if (!agentsConfig.agentsEnabled) {
    throw new Error("AGENTS_DISABLED");
  }
}
