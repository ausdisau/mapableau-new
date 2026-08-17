import { tool, type Tool } from "@openai/agents";
import type { RunContext } from "@openai/agents";
import { z } from "zod";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { runNavigatorProviderSearchTurn } from "@/lib/ai/navigator/orchestrator";

import {
  accessProviderSearchInputSchema,
  delimitUntrustedData,
  domainDisabledResultSchema,
  draftSummaryInputSchema,
  draftSummaryResultSchema,
  type MapAbleAgentRunContext,
  MANAGER_DRAFT_TOOL,
} from "./contracts";
import {
  AGENTS_SDK_AUDIT,
  assertNavigatorToolBridgeAllowed,
  assertToolCallAllowed,
  isDomainEnabled,
} from "./policy";

function getCtx(runContext: RunContext<MapAbleAgentRunContext>): MapAbleAgentRunContext {
  return runContext.context;
}

async function auditToolExecuted(
  ctx: MapAbleAgentRunContext,
  toolName: string,
  silent?: boolean,
): Promise<void> {
  if (silent) return;
  await createAuditEvent({
    actorUserId: ctx.actorUserId,
    participantId: ctx.participantId,
    action: AGENTS_SDK_AUDIT.toolExecuted,
    entityType: "AiCapability",
    entityId: ctx.capabilityKey,
    metadata: { toolName },
  });
}

/** Live Access path — delegates to runNavigatorProviderSearchTurn (source of truth). */
export const accessProviderSearchTool = tool({
  name: "access_provider_search",
  description:
    "Run the governed Navigator provider-search turn (interpret, confirm, deterministic match). Never books or pays.",
  parameters: accessProviderSearchInputSchema,
  execute: async (args, runContext?: RunContext<MapAbleAgentRunContext>) => {
    const ctx = getCtx(runContext!);
    return executeAccessProviderSearchTool(ctx, args);
  },
});

export const careConsultTool = tool({
  name: "care_consult",
  description: "Care specialist (fail-closed until canonical gates are wired).",
  parameters: z.object({
    query: z.string().max(2000).optional(),
  }),
  execute: async (_args, runContext?: RunContext<MapAbleAgentRunContext>) => {
    const ctx = getCtx(runContext!);
    const policy = await assertToolCallAllowed({
      ctx,
      toolName: "care_consult",
      requiredDomain: "care",
    });
    if (!policy.allowed) {
      return { status: "blocked", reason: policy.reason };
    }
    return domainDisabledResultSchema.parse({
      status: "domain_disabled",
      domain: "care",
      message: "Care domain is not live in this pilot slice.",
    });
  },
});

export const transportConsultTool = tool({
  name: "transport_consult",
  description: "Transport specialist (fail-closed).",
  parameters: domainDisabledResultSchema.pick({ domain: true }),
  execute: async (_args, runContext?: RunContext<MapAbleAgentRunContext>) => {
    const ctx = getCtx(runContext!);
    await assertToolCallAllowed({
      ctx,
      toolName: "transport_consult",
      requiredDomain: "transport",
    });
    return {
      status: "domain_disabled" as const,
      domain: "transport" as const,
      message: "Transport domain is not live in this pilot slice.",
    };
  },
});

export const jobsConsultTool = tool({
  name: "jobs_consult",
  description: "Jobs specialist (fail-closed).",
  parameters: domainDisabledResultSchema.pick({ domain: true }),
  execute: async (_args, runContext?: RunContext<MapAbleAgentRunContext>) => {
    const ctx = getCtx(runContext!);
    await assertToolCallAllowed({
      ctx,
      toolName: "jobs_consult",
      requiredDomain: "jobs",
    });
    return {
      status: "domain_disabled" as const,
      domain: "jobs" as const,
      message: "Jobs domain is not live in this pilot slice.",
    };
  },
});

export const safeguardingDraftTool = tool({
  name: "safeguarding_draft_escalation",
  description:
    "Draft-only safeguarding escalation placeholder — never determines findings or submits reports.",
  parameters: draftSummaryInputSchema,
  execute: async (args, runContext?: RunContext<MapAbleAgentRunContext>) => {
    const ctx = getCtx(runContext!);
    const policy = await assertToolCallAllowed({
      ctx,
      toolName: "safeguarding_draft_escalation",
      requiredDomain: "safeguarding",
    });
    if (!policy.allowed) {
      return { status: "blocked", reason: policy.reason };
    }
    return {
      status: "draft_human_review" as const,
      draft: delimitUntrustedData("safeguarding_draft", args.summaryDraft),
      note: "No safeguarding finding or regulatory submission performed.",
    };
  },
});

export const complianceReadDraftTool = tool({
  name: "compliance_read_draft",
  description: "Read/draft compliance notes only — no submissions.",
  parameters: draftSummaryInputSchema,
  execute: async (args, runContext?: RunContext<MapAbleAgentRunContext>) => {
    const ctx = getCtx(runContext!);
    const policy = await assertToolCallAllowed({
      ctx,
      toolName: "compliance_read_draft",
      requiredDomain: "compliance",
    });
    if (!policy.allowed) {
      return { status: "blocked", reason: policy.reason };
    }
    return {
      status: "read_draft_only" as const,
      draft: args.summaryDraft.slice(0, 4000),
      note: "No compliance submission performed.",
    };
  },
});

/** Demonstrates SDK needsApproval — draft only, never writes canonical stores. */
export const proposeDraftSummaryTool = tool({
  name: MANAGER_DRAFT_TOOL,
  description:
    "Propose a participant-facing draft summary for review. Does not persist or execute actions.",
  parameters: draftSummaryInputSchema,
  needsApproval: true,
  execute: async (args, runContext?: RunContext<MapAbleAgentRunContext>) => {
    const ctx = getCtx(runContext!);
    const policy = await assertToolCallAllowed({
      ctx,
      toolName: MANAGER_DRAFT_TOOL,
    });
    if (!policy.allowed) {
      return { status: "blocked", reason: policy.reason };
    }
    await auditToolExecuted(ctx, MANAGER_DRAFT_TOOL);
    return draftSummaryResultSchema.parse({
      status: "draft_only",
      stored: false,
      summaryDraft: args.summaryDraft.slice(0, 4000),
      note: "SDK approval does not grant business authority; participant review required.",
    });
  },
});

/** Test helper — executes governed Access search without SDK runner. */
export async function executeAccessProviderSearchTool(
  ctx: MapAbleAgentRunContext,
  args: z.infer<typeof accessProviderSearchInputSchema>,
) {
  const policy = await assertToolCallAllowed({
    ctx,
    toolName: "access_provider_search",
    consentAction: args.interpretationConfirmed ? "match" : "interpret",
    requiredDomain: "access",
  });
  if (!policy.allowed) {
    return { status: "blocked", reason: policy.reason };
  }

  const bridge = await assertNavigatorToolBridgeAllowed({
    ctx,
    navigatorCapabilityKey: "navigator.provider_search.match",
    toolName: "ndis_provider_hard_filter",
  });
  if (!bridge.allowed) {
    return { status: "blocked", reason: bridge.reason };
  }

  const result = await runNavigatorProviderSearchTurn({
    tenantId: ctx.tenantId,
    participantId: ctx.participantId,
    actorUserId: ctx.actorUserId,
    sessionId: ctx.sessionId,
    goalText: args.goalText,
    structuredFilters: args.structuredFilters,
    hardConstraints: args.hardConstraints,
    rankingWeights: args.rankingWeights,
    interpretationConfirmed: args.interpretationConfirmed,
    aiOptedOut: ctx.aiOptedOut,
    saveDraft: args.saveDraft,
    transferFilters: args.transferFilters,
    consentPurpose: ctx.purpose,
  });

  await auditToolExecuted(ctx, "access_provider_search");
  return result;
}

export function buildToolsForContext(
  ctx: MapAbleAgentRunContext,
): Tool<MapAbleAgentRunContext>[] {
  const tools: Tool<MapAbleAgentRunContext>[] = [proposeDraftSummaryTool];
  if (isDomainEnabled(ctx, "access")) {
    tools.push(accessProviderSearchTool);
  }
  if (isDomainEnabled(ctx, "care")) {
    tools.push(careConsultTool);
  }
  if (isDomainEnabled(ctx, "transport")) {
    tools.push(transportConsultTool);
  }
  if (isDomainEnabled(ctx, "jobs")) {
    tools.push(jobsConsultTool);
  }
  if (isDomainEnabled(ctx, "safeguarding")) {
    tools.push(safeguardingDraftTool);
  }
  if (isDomainEnabled(ctx, "compliance")) {
    tools.push(complianceReadDraftTool);
  }
  return tools.filter((t) => ctx.toolAllowlist.includes(t.name));
}
