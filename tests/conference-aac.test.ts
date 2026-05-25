import { describe, expect, it, vi, beforeEach } from "vitest";

import { DEFAULT_AAC_PHRASES, resolvePhraseText } from "@/lib/aac/aac-phrase-service";
import {
  setConferenceAdapterForTests,
  type ConferenceAdapter,
} from "@/lib/conference/conference-adapter";
import { createMockConferenceAdapter } from "@/lib/conference/mock-conference-adapter";
import { filterInboxThreads } from "@/lib/messages/inbox-filters";
import { startConferenceSchema } from "@/lib/validation/conference";
import { aacSpeakSchema, updateAacPhrasesSchema } from "@/lib/validation/aac";
import type { ConversationThread } from "@/types/messages";

const sampleThread = (overrides: Partial<ConversationThread> = {}): ConversationThread =>
  ({
    id: "t1",
    title: "Test",
    threadType: "direct",
    lastMessageAt: new Date().toISOString(),
    unreadCount: 0,
    isMuted: false,
    participantId: null,
    organisationId: null,
    ...overrides,
  }) as ConversationThread;

describe("conference and AAC validation", () => {
  it("accepts audio and video start payloads", () => {
    expect(startConferenceSchema.safeParse({ mode: "audio" }).success).toBe(true);
    expect(startConferenceSchema.safeParse({ mode: "video" }).success).toBe(true);
    expect(startConferenceSchema.safeParse({ mode: "chat" }).success).toBe(false);
  });

  it("accepts AAC phrase updates", () => {
    const parsed = updateAacPhrasesSchema.safeParse({
      phrases: [{ label: "Hi", phrase: "Hello there" }],
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts AAC speak with phrase id", () => {
    const parsed = aacSpeakSchema.safeParse({ phraseId: "preset-0" });
    expect(parsed.success).toBe(true);
  });
});

describe("inbox filters with conferencing feature", () => {
  const inbox = [
    sampleThread({ id: "d1", threadType: "direct" }),
    sampleThread({ id: "g1", threadType: "group" }),
    sampleThread({ id: "s1", threadType: "incident_safe_comms" }),
  ];

  it("still filters direct threads", () => {
    const direct = filterInboxThreads(inbox, "direct", "all_linked");
    expect(direct.map((t) => t.id)).toEqual(["d1"]);
  });

  it("still filters safety threads", () => {
    const safety = filterInboxThreads(inbox, "safety", "all_linked");
    expect(safety.map((t) => t.id)).toEqual(["s1"]);
  });
});

describe("mock conference adapter", () => {
  beforeEach(() => {
    setConferenceAdapterForTests(null);
  });

  it("creates room and token for join", async () => {
    const adapter = createMockConferenceAdapter();
    const room = await adapter.createRoom({
      threadId: "thread-abc",
      mode: "video",
    });
    expect(room.externalRoomId).toContain("mock-thread-abc");
    expect(room.roomUrl).toContain("mockConference");

    const token = await adapter.createMeetingToken({
      externalRoomId: room.externalRoomId,
      profileId: "user-1",
      displayName: "Alex",
      mode: "video",
    });
    expect(token.token.length).toBeGreaterThan(0);
    expect(token.roomUrl).toContain("token=");
  });

  it("allows injecting a custom adapter for tests", async () => {
    const custom: ConferenceAdapter = {
      createRoom: vi.fn().mockResolvedValue({
        externalRoomId: "custom-room",
        roomUrl: "https://example.test/room",
      }),
      createMeetingToken: vi.fn().mockResolvedValue({
        token: "tok",
        roomUrl: "https://example.test/room",
      }),
      endRoom: vi.fn(),
    };
    setConferenceAdapterForTests(custom);
    const { getConferenceAdapter } = await import("@/lib/conference/conference-adapter");
    const a = getConferenceAdapter();
    await a.createRoom({ threadId: "t", mode: "audio" });
    expect(custom.createRoom).toHaveBeenCalled();
    setConferenceAdapterForTests(null);
  });
});

describe("AAC phrase resolution", () => {
  it("resolves preset phrase text", async () => {
    const text = await resolvePhraseText("profile-1", "preset-0");
    expect(text).toBe(DEFAULT_AAC_PHRASES[0]!.phrase);
  });

  it("requires phrase id or text", async () => {
    await expect(resolvePhraseText("profile-1")).rejects.toThrow("PHRASE_REQUIRED");
  });
});

describe("messages overlay Call tab", () => {
  it("exports MessagesOverlay with Call tab labels", async () => {
    const fs = await import("node:fs/promises");
    const src = await fs.readFile("components/messages/MessagesOverlay.tsx", "utf8");
    expect(src).toContain('"call"');
    expect(src).toContain("ConferenceCallPanel");
    expect(src).toContain("Audio");
    expect(src).toContain("Video");
  });
});
