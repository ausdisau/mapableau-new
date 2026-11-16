import { describe, expect, it } from "vitest";

import {
  PROVIDER_FINDER_CHAT_MAX_MESSAGES,
  providerFinderChatRequestSchema,
  resetFinderChatLocksForTests,
  sliceChatHistory,
  tryLockFinderChatTurn,
  unlockFinderChatTurn,
} from "@/lib/provider/finder/chat-request";

describe("provider finder chat request", () => {
  it("rejects oversized history and invalid session ids", () => {
    const tooMany = {
      messages: Array.from({ length: PROVIDER_FINDER_CHAT_MAX_MESSAGES + 1 }, (_, i) => ({
        role: "user" as const,
        parts: [{ type: "text", text: `m${i}` }],
      })),
    };
    expect(providerFinderChatRequestSchema.safeParse(tooMany).success).toBe(
      false,
    );

    expect(
      providerFinderChatRequestSchema.safeParse({
        messages: [{ role: "user", parts: [] }],
        sessionId: "bad id with spaces",
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
