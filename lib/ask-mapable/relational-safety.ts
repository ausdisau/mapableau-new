import type { CopilotAction } from "@/lib/copilot/types";

/**
 * Relational safety policy for MapAble Companion / Ask MapAble.
 *
 * This module must not infer a diagnosis, loneliness score, capacity, social
 * quality, or relationship quality. It only reacts to explicit user wording
 * and constrains MapAble's own relational behaviour.
 */

export const RELATIONAL_SAFETY_VERSION = "0.1" as const;

const EXPLICIT_CONNECTION_NEED =
  /\b(i(?:'m| am) lonely|i feel lonely|feeling lonely|i(?:'m| am) isolated|feeling isolated|i feel alone|feeling alone|no one to talk to|need someone to talk to|want someone to talk to|need company|want company|keep me company|i feel disconnected|feeling disconnected)\b/i;

const PROHIBITED_RELATIONAL_OUTPUT_PATTERNS = [
  /\byou (?:only )?need me\b/i,
  /\byou don(?:'|’)t need anyone else\b/i,
  /\bi(?:'|’)m all you need\b/i,
  /\bdon(?:'|’)t leave me\b/i,
  /\bi need you(?: to stay)?\b/i,
  /\bi get jealous\b/i,
  /\bchoose me over\b/i,
  /\bstop talking to (?:them|other people|your friends|your family)\b/i,
  /\bspend more time with me than\b/i,
] as const;

export const RELATIONAL_BOUNDARY_MESSAGE =
  "Ask MapAble is an AI assistant, not a person. It will not ask you to choose it over people in your life, imply that it needs you, or pressure you to keep talking. You can keep talking here, use standard MapAble controls, or choose a human connection option.";

export function explicitlyRequestsConnectionSupport(query: string): boolean {
  return EXPLICIT_CONNECTION_NEED.test(query.trim());
}

export function containsProhibitedRelationalOutput(text: string): boolean {
  return PROHIBITED_RELATIONAL_OUTPUT_PATTERNS.some((pattern) =>
    pattern.test(text),
  );
}

/**
 * Fail closed only on high-signal manipulative relational phrases.
 * Ordinary warmth, empathy and conversation remain allowed.
 */
export function enforceRelationalOutputBoundary(answer: string): string {
  return containsProhibitedRelationalOutput(answer)
    ? RELATIONAL_BOUNDARY_MESSAGE
    : answer;
}

export function buildConnectionSupportNote(query: string): string | null {
  if (!explicitlyRequestsConnectionSupport(query)) return null;

  return (
    "We can keep talking here if that feels useful. If you want, I can also help " +
    "you connect with a person, find something social, or work through practical " +
    "barriers such as support or transport. You choose what you want next."
  );
}

/**
 * Adds optional bridge-to-connection actions. These are guidance/navigation
 * only and never trigger booking, disclosure, outreach, or service execution.
 */
export function addConnectionSupportActions(
  actions: CopilotAction[],
  query: string,
): CopilotAction[] {
  if (!explicitlyRequestsConnectionSupport(query)) return actions;

  const next = [...actions];

  if (!next.some((action) => action.href === "/dashboard/participation")) {
    next.push({
      type: "GUIDANCE_ONLY",
      label: "Find something social",
      requiresConfirmation: false,
      href: "/dashboard/participation",
    });
  }

  return next;
}
