import { toolsForIntent } from "@/lib/mapable-agent/intent-router";
import type { MapableAgentIntent } from "@/lib/mapable-agent/types";
import {
  checkDuplicateInvoiceTool,
  checkPriceLimitTool,
  classifyInvoiceLineItemsTool,
  draftProviderMessageTool,
  extractPlanGoalsTool,
  getConsentStatusTool,
  getParticipantProfileTool,
  mapSupportToBudgetCategoryTool,
  parseNdisPlanTool,
  quoteAccessibleTripTool,
  searchInclusiveJobsTool,
  searchSupportWorkersTool,
} from "@/lib/mapable-agent/tools/implementations";
import {
  createHumanReviewTaskTool,
  createLogAuditEventTool,
  wrapToolExecution,
} from "@/lib/mapable-agent/tools/middleware";
import type { ToolContext, ToolDefinition, ToolResult } from "@/lib/mapable-agent/tools/types";

const ALL_TOOLS: ToolDefinition[] = [
  getParticipantProfileTool(),
  getConsentStatusTool(),
  parseNdisPlanTool(),
  extractPlanGoalsTool(),
  mapSupportToBudgetCategoryTool(),
  searchSupportWorkersTool(),
  quoteAccessibleTripTool(),
  classifyInvoiceLineItemsTool(),
  checkDuplicateInvoiceTool(),
  checkPriceLimitTool(),
  searchInclusiveJobsTool(),
  draftProviderMessageTool(),
  createHumanReviewTaskTool(),
  createLogAuditEventTool(),
];

const TOOL_MAP = new Map(ALL_TOOLS.map((t) => [t.name, t]));

export function getToolCatalog(): Array<{
  name: string;
  description: string;
  sensitivity: string;
  requiresHumanApproval?: boolean;
}> {
  return ALL_TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    sensitivity: t.sensitivity,
    requiresHumanApproval: t.requiresHumanApproval,
  }));
}

export function getToolsForIntent(intent: MapableAgentIntent): ToolDefinition[] {
  const names = new Set(toolsForIntent(intent));
  return ALL_TOOLS.filter((t) => names.has(t.name));
}

export async function executeToolByName(
  name: string,
  ctx: ToolContext,
  input: unknown,
): Promise<ToolResult> {
  const def = TOOL_MAP.get(name);
  if (!def) {
    return { ok: false, error: `Unknown tool: ${name}`, confidence: 0 };
  }
  return wrapToolExecution(def, ctx, input);
}

export function getToolDefinition(name: string): ToolDefinition | undefined {
  return TOOL_MAP.get(name);
}
