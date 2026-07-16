import type {
  HumanReviewCategory,
  HumanReviewPriority,
} from "@prisma/client";

export type MapableAgentIntent =
  | "plan"
  | "billing"
  | "transport"
  | "jobs"
  | "safeguarding"
  | "general";

export type MapableAgentIntentResult = {
  type: MapableAgentIntent;
  confidence: number;
  filters: Record<string, unknown>;
};

export type ToolCallJson = {
  name: string;
  arguments: Record<string, unknown>;
};

export type OrchestratorTurnInput = {
  sessionId: string;
  message: string;
  actorUserId?: string | null;
  participantId?: string | null;
};

export type OrchestratorTurnResult = {
  sessionId: string;
  text: string;
  reasoningSummary?: string;
  toolsCalled: string[];
  humanReviewRequired: boolean;
  pendingReviewTaskIds: string[];
  warnings: string[];
  requiredConfirmations: Array<{
    type: string;
    title: string;
    explanation: string;
  }>;
  confidence?: number;
};

export type ReviewTriggerInput = {
  category: HumanReviewCategory;
  priority?: HumanReviewPriority;
  title: string;
  summary: string;
  context?: Record<string, unknown>;
  sessionId?: string;
  agentRunId?: string;
  participantId?: string;
};
