import type { AgentActionStatus, AgentContext } from "../agent-types";

export type GraphStepResult<T = unknown> = {
  stepId: string;
  status: AgentActionStatus;
  output: T;
  requiresHumanReview: boolean;
};

export type GraphRunResult = {
  graphId: string;
  steps: GraphStepResult[];
  finalStatus: AgentActionStatus;
  summary: string;
  requiresHumanConfirmation: boolean;
};

export type GraphRunInput = {
  message: string;
  context: AgentContext;
  metadata?: Record<string, unknown>;
};
