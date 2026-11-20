import { describe, expect, it } from "vitest";

import {
  PROVIDER_FINDER_CHAT_MAX_FIELD,
  PROVIDER_FINDER_CHAT_MAX_MESSAGES,
  PROVIDER_FINDER_CHAT_MAX_REQUEST_MESSAGES,
  PROVIDER_FINDER_CHAT_MAX_TEXT,
  providerFinderChatRequestSchema,
  resetFinderChatLocksForTests,
  sliceChatHistory,
  tryLockFinderChatTurn,
  unlockFinderChatTurn,
} from "@/lib/provider/finder/chat-request";

function history(length: number) {
  return Array.from({ length }, (_, i) => ({
    role: "user" as const,
    parts: [{ type: "text", text: `m${i}` }],
  }));
}

describe("provider finder chat request", () => {
  it("accepts long chats then slices, and rejects only the request ceiling", () => {
    expect(
      providerFinderChatRequestSchema.safeParse({
        messages: history(PROVIDER_FINDER_CHAT_MAX_MESSAGES + 1),
      }).success,
    ).toBe(true);

    const parsed = providerFinderChatRequestSchema.parse({
      messages: history(PROVIDER_FINDER_CHAT_MAX_REQUEST_MESSAGES),
    });
    expect(sliceChatHistory(parsed.messages)).toHaveLength(
      PROVIDER_FINDER_CHAT_MAX_MESSAGES,
    );

    expect(
      providerFinderChatRequestSchema.safeParse({
        messages: history(PROVIDER_FINDER_CHAT_MAX_REQUEST_MESSAGES + 1),
      }).success,
    ).toBe(false);

    expect(
      providerFinderChatRequestSchema.safeParse({
        messages: [{ role: "user", parts: [] }],
        sessionId: "bad id with spaces",
      }).success,
    ).toBe(false);
  });

  it("accepts a follow-up session.query as long as a chat message", () => {
    const echoed = "x".repeat(PROVIDER_FINDER_CHAT_MAX_FIELD + 50);
    expect(
      providerFinderChatRequestSchema.safeParse({
        messages: [{ role: "user", parts: [{ type: "text", text: "next" }] }],
        session: { query: echoed },
      }).success,
    ).toBe(true);

    expect(
      providerFinderChatRequestSchema.safeParse({
        session: { query: "x".repeat(PROVIDER_FINDER_CHAT_MAX_TEXT + 1) },
      }).success,
    ).toBe(false);

    expect(
      providerFinderChatRequestSchema.safeParse({
        session: { location: "x".repeat(PROVIDER_FINDER_CHAT_MAX_FIELD + 1) },
      }).success,
    ).toBe(false);
  });

  it("slices history to the last 20 messages", () => {
    const messages = Array.from({ length: 25 }, (_, i) => i);
    expect(sliceChatHistory(messages)).toEqual(
      Array.from({ length: 20 }, (_, i) => i + 5),
    );
  });

  it("locks overlapping turns per session id", () => {
    resetFinderChatLocksForTests();
    expect(tryLockFinderChatTurn("finder-a")).toBe(true);
    expect(tryLockFinderChatTurn("finder-a")).toBe(false);
    expect(tryLockFinderChatTurn("finder-b")).toBe(true);
    unlockFinderChatTurn("finder-a");
    expect(tryLockFinderChatTurn("finder-a")).toBe(true);
    resetFinderChatLocksForTests();
  });
});
