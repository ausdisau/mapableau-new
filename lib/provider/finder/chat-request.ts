import { z } from "zod";

/**
 * Process-local in-flight lock. Same limitation as `checkIpRateLimit`:
 * not globally enforceable across multiple instances. A shared store is
 * recommended before production-sensitive traffic; this preview stays
 * process-local. See docs/operations/RATE_LIMITING.md.
 */

export const PROVIDER_FINDER_CHAT_MAX_MESSAGES = 20;
export const PROVIDER_FINDER_CHAT_MAX_TEXT = 2000;
export const PROVIDER_FINDER_CHAT_MAX_FIELD = 200;

const clarificationSlotSchema = z.enum([
  "location",
  "service",
  "access",
  "general",
]);

const messageSchema = z.object({
  id: z.string().max(120).optional(),
  role: z.enum(["user", "assistant", "system"]),
  parts: z.array(z.unknown()).max(20).optional(),
});

export const providerFinderChatRequestSchema = z.object({
  messages: z
    .array(messageSchema)
    .max(PROVIDER_FINDER_CHAT_MAX_MESSAGES)
    .optional()
    .default([]),
  sessionId: z
    .string()
    .trim()
    .max(80)
    .regex(/^[A-Za-z0-9:_-]+$/)
    .optional(),
  session: z
    .object({
      query: z.string().max(PROVIDER_FINDER_CHAT_MAX_FIELD).optional(),
      location: z.string().max(PROVIDER_FINDER_CHAT_MAX_FIELD).optional(),
      providerName: z.string().max(PROVIDER_FINDER_CHAT_MAX_FIELD).optional(),
      serviceQuery: z.string().max(PROVIDER_FINDER_CHAT_MAX_FIELD).optional(),
      accessQuery: z.string().max(PROVIDER_FINDER_CHAT_MAX_FIELD).optional(),
      skippedSlots: z.array(clarificationSlotSchema).max(8).optional(),
    })
    .optional(),
});

export type ProviderFinderChatRequest = z.infer<
  typeof providerFinderChatRequestSchema
>;

const inFlightTurns = new Map<string, number>();
const IN_FLIGHT_TTL_MS = 30_000;

function pruneInFlight(now: number) {
  for (const [id, started] of inFlightTurns) {
    if (now - started > IN_FLIGHT_TTL_MS) inFlightTurns.delete(id);
  }
}

export function tryLockFinderChatTurn(sessionId: string): boolean {
  const now = Date.now();
  pruneInFlight(now);
  if (inFlightTurns.has(sessionId)) return false;
  inFlightTurns.set(sessionId, now);
  return true;
}

export function unlockFinderChatTurn(sessionId: string): void {
  inFlightTurns.delete(sessionId);
}

/** Test-only */
export function resetFinderChatLocksForTests(): void {
  inFlightTurns.clear();
}

export function sliceChatHistory<T>(messages: T[]): T[] {
  if (messages.length <= PROVIDER_FINDER_CHAT_MAX_MESSAGES) return messages;
  return messages.slice(-PROVIDER_FINDER_CHAT_MAX_MESSAGES);
}

