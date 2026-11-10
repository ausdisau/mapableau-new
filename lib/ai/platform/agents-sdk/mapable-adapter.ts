/**
 * Adapts MapAble AI Platform governance (capabilities, gates, agent-run service)
 * for the Agents SDK topology. This is the only place that should import
 * capability registry / agent-run service into the SDK layer.
 */

import { requireAiCapability } from "@/lib/ai/platform/capabilities/registry";
import { createAgentRun } from "@/lib/ai/agent-ops/agent-run-service";
import {
  assertNavigatorCapability,
  assertNavigatorActionAllowed,
} from "@/lib/ai/navigator/gates";
import {
  runNavigatorProviderSearchTurn,
  type NavigatorProviderSearchTurnInput,
} from "@/lib/ai/navigator/orchestrator";

import type { MapAbleAgentDomain, MapAbleAgentsContext } from "./contracts";
import {
  assertDomainEnabled,
  assertNotPermanentlyProhibited,
  defaultEnabledDomainsForCapability,
} from "./policy";

/**
 * Build the serializable SDK context from the canonical capability registry.
 * The model never chooses its own tool allowlist or enabled domains.
 */
export function buildAgentsSdkContext(input: {
  tenantId: string;
  participantId: string;
  actorUserId: string;
  capabilityKey: string;
  purpose: string;
  enabledDomains?: MapAbleAgentDomain[];
  sessionId?: string;
  aiOptedOut?: boolean;
  memorySnippets?: string[];
}): MapAbleAgentsContext {
  const capability = requireAiCapability(input.capabilityKey);
  return {
    tenantId: input.tenantId,
    participantId: input.participantId,
    actorUserId: input.actorUserId,
    capabilityKey: input.capabilityKey,
    purpose: input.purpose,
    enabledDomains:
      input.enabledDomains ??
      defaultEnabledDomainsForCapability(input.capabilityKey),
    mcpToolAllowlist: [...capability.toolAllowlist],
    sessionId: input.sessionId,
    aiOptedOut: input.aiOptedOut ?? false,
    memorySnippets: input.memorySnippets,
  };
}

/** @deprecated Prefer buildAgentsSdkContext */
export const buildAgentsContext = buildAgentsSdkContext;

/**
 * Canonical tool gate. Reuses Navigator's existing gate for the first permitted
 * slice instead of inventing a second authorization system.
 */
export async function assertGovernedTool(params: {
  context: MapAbleAgentsContext;
  domain: MapAbleAgentDomain;
  toolName: string;
  action: string;
}): Promise<void> {
  assertDomainEnabled(params.context, params.domain);
  assertNotPermanentlyProhibited(params.action);

  if (
    params.domain === "access" &&
    params.context.capabilityKey.startsWith("navigator.")
  ) {
    assertNavigatorActionAllowed(params.action);
    // Wrapper tool name is not a canonical business tool — Navigator re-gates
    // its real internal tools before service execution.
    const result = await assertNavigatorCapability({
      capabilityKey: params.context.capabilityKey,
      tenantId: params.context.tenantId,
      participantId: params.context.participantId,
      actorUserId: params.context.actorUserId,
    });
    if (!result.allowed) {
      throw new Error(`MAPABLE_AGENT_TOOL_DENIED:${result.reason}`);
    }
    return;
  }

  // Care / Transport / Jobs / safeguarding / compliance remain fail-closed
  // until canonical domain gates are wired and reviewed.
  throw new Error(`MAPABLE_AGENT_DOMAIN_NOT_WIRED:${params.domain}`);
}

export async function runExistingNavigatorSearch(
  context: MapAbleAgentsContext,
  input: Omit<
    NavigatorProviderSearchTurnInput,
    "tenantId" | "participantId" | "actorUserId" | "sessionId" | "aiOptedOut"
  >,
) {
  await assertGovernedTool({
    context,
    domain: "access",
    toolName: "navigator_provider_search",
    action: "search_providers",
  });

  return runNavigatorProviderSearchTurn({
    ...input,
    tenantId: context.tenantId,
    participantId: context.participantId,
    actorUserId: context.actorUserId,
    sessionId: context.sessionId,
    aiOptedOut: context.aiOptedOut,
  });
}

/**
 * Escalation is a proposal only. It does not write an incident, make a
 * safeguarding finding, contact an external party, or submit a report.
 */
export async function proposeHumanEscalationDraft(
  context: MapAbleAgentsContext,
  input: { reason: string; note?: string },
): Promise<{ draft: string; agentRunId: string | null }> {
  assertDomainEnabled(context, "access");
  assertNotPermanentlyProhibited("make_safeguarding_finding");
  assertNotPermanentlyProhibited("submit_incident_or_regulatory_report");

  const draft = [
    "Human-review draft (not a finding or report).",
    `Participant: ${context.participantId}`,
    `Reason: ${input.reason.slice(0, 500)}`,
    input.note ? `Note: ${input.note.slice(0, 500)}` : null,
    "No external contact, incident classification, or regulatory submission has occurred.",
  ]
    .filter(Boolean)
    .join("\n");

  const run = await createAgentRun({
    agentType: "matching",
    participantId: context.participantId,
    actorUserId: context.actorUserId,
    inputSummary: {
      source: "agents-sdk",
      capabilityKey: context.capabilityKey,
      purpose: "human_escalation_draft",
      reason: input.reason.slice(0, 200),
    },
    outputSummary: {
      draftOnly: true,
      findingMade: false,
      reportSubmitted: false,
    },
    toolsCalled: ["propose_human_escalation_draft"],
    riskTier: "medium",
    humanReviewRequired: true,
    participantConfirmationRequired: true,
  });

  return {
    draft,
    agentRunId: run.id ?? null,
  };
}

/**
 * Record a completed SDK Access/Navigator turn against AgentRun (matching).
 * Persistence may be skipped when agent-run persistence is disabled.
 */
export async function recordSdkNavigatorTurn(input: {
  participantId: string;
  actorUserId: string;
  capabilityKey: string;
  requestSummary: string;
  outputSummary: Record<string, unknown>;
  toolsCalled?: string[];
}): Promise<{ agentRunId: string | null }> {
  requireAiCapability(input.capabilityKey);
  const run = await createAgentRun({
    agentType: "matching",
    participantId: input.participantId,
    actorUserId: input.actorUserId,
    inputSummary: {
      source: "agents-sdk",
      capabilityKey: input.capabilityKey,
      summary: input.requestSummary.slice(0, 500),
    },
    outputSummary: input.outputSummary,
    toolsCalled: input.toolsCalled ?? ["navigator_provider_search"],
    riskTier: "low",
    humanReviewRequired: false,
    participantConfirmationRequired: true,
  });
  return { agentRunId: run.id ?? null };
}
