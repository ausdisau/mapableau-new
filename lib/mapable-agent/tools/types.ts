import type { ConsentScope } from "@/types/mapable";
import type { z } from "zod";

import type { HumanReviewCategory } from "@prisma/client";

export type ToolSensitivity = "read" | "draft" | "sensitive";

export type ToolContext = {
  actorUserId?: string | null;
  participantId?: string | null;
  sessionId?: string | null;
  agentRunId?: string | null;
};

export type ToolResult = {
  ok: boolean;
  data?: Record<string, unknown>;
  confidence?: number;
  reviewCategory?: HumanReviewCategory;
  error?: string;
};

export type ToolDefinition = {
  name: string;
  description: string;
  sensitivity: ToolSensitivity;
  /** When false, omitted from public tool catalog (internal orchestrator use). */
  catalogVisible?: boolean;
  requiresConsent?: ConsentScope[];
  requiresHumanApproval?: boolean;
  createsReviewOnLowConfidence?: boolean;
  inputSchema: z.ZodType;
  execute: (ctx: ToolContext, input: unknown) => Promise<ToolResult>;
};

export const BLOCKED_EXTERNAL_ACTIONS = new Set([
  "book",
  "approve",
  "pay",
  "submit",
  "send",
  "cancel",
  "disclose",
  "escalate",
]);
