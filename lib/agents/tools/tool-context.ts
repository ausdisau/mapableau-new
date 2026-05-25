import type { ToolContext } from "@strands-agents/sdk";

import {
  MAPABLE_INVOCATION_STATE_KEY,
  type MapAbleInvocationState,
} from "../agent-types";

export function getMapableState(
  context?: ToolContext
): MapAbleInvocationState {
  const state = context?.invocationState?.[MAPABLE_INVOCATION_STATE_KEY] as
    | MapAbleInvocationState
    | undefined;
  if (!state) {
    throw new Error("Missing MapAble agent invocation state.");
  }
  return state;
}

export function hashInput(input: unknown): string {
  const raw = JSON.stringify(input);
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  return `h${Math.abs(hash)}`;
}
