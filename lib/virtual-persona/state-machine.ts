import type { PersonaConversationState } from "@/lib/virtual-persona/types";

const TRANSITIONS: Record<
  PersonaConversationState,
  readonly PersonaConversationState[]
> = {
  idle: ["composing", "processing", "fallback_available"],
  composing: ["idle", "processing", "stopped"],
  processing: ["response_ready", "needs_clarification", "stopped", "error"],
  response_ready: [
    "composing",
    "draft_editing",
    "idle",
    "fallback_available",
    "stopped",
  ],
  draft_editing: ["response_ready", "composing", "idle", "stopped"],
  needs_clarification: ["composing", "processing", "stopped", "fallback_available"],
  stopped: ["idle", "composing", "fallback_available"],
  error: ["idle", "composing", "fallback_available", "stopped"],
  fallback_available: ["idle", "composing", "stopped"],
};

export function canTransitionPersonaState(
  from: PersonaConversationState,
  to: PersonaConversationState,
): boolean {
  if (from === to) return true;
  return TRANSITIONS[from].includes(to);
}

export function transitionPersonaState(
  from: PersonaConversationState,
  to: PersonaConversationState,
): PersonaConversationState {
  if (!canTransitionPersonaState(from, to)) {
    throw new Error(`Invalid persona state transition: ${from} → ${to}`);
  }
  return to;
}
