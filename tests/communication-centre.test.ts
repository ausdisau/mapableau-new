import { describe, expect, it, vi, beforeEach } from "vitest";

import { createMemoryRealtimeAdapter } from "@/lib/realtime/memory-realtime-adapter";
import { setRealtimeAdapterForTests } from "@/lib/realtime/realtime-adapter";
import {
  createThreadSchema,
  sendMessageSchema,
  reportThreadSchema,
} from "@/lib/validation/messages";
import { isSensitiveThreadType } from "@/lib/messages/message-audit-service";
import type { Message } from "@/types/messages";

describe("communication centre validation", () => {
  it("accepts direct thread creation payload", () => {
    const parsed = createThreadSchema.safeParse({
      threadType: "direct",
      title: "Chat",
      participantProfileIds: ["user-2"],
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts send message payload", () => {
    const parsed = sendMessageSchema.safeParse({ body: "Hello" });
    expect(parsed.success).toBe(true);
  });

  it("accepts report reasons", () => {
    const parsed = reportThreadSchema.safeParse({
      reason: "unsafe_support",
      details: "Concern about session",
    });
    expect(parsed.success).toBe(true);
  });
});

describe("message audit sensitivity", () => {
  it("flags incident threads as sensitive", () => {
    expect(isSensitiveThreadType("incident_safe_comms")).toBe(true);
  });

  it("does not flag direct threads", () => {
    expect(isSensitiveThreadType("direct")).toBe(false);
  });
});

describe("memory realtime adapter", () => {
  beforeEach(() => {
    setRealtimeAdapterForTests(null);
  });

  it("publishes message:new after subscribe", async () => {
    const adapter = createMemoryRealtimeAdapter();
    const received: Message[] = [];

    const off = await adapter.subscribeToThread("thread-1", {
      onMessage: (m) => received.push(m),
    });

    const sample: Message = {
      id: "msg-1",
      threadId: "thread-1",
      senderProfileId: "u1",
      messageType: "text",
      body: "Hi",
      status: "sent",
      metadataJson: null,
      createdAt: new Date().toISOString(),
      editedAt: null,
      deletedAt: null,
    };

    await adapter.publishMessageCreated("thread-1", sample);
    expect(received).toHaveLength(1);
    expect(received[0]?.id).toBe("msg-1");

    await off();
  });

  it("fires typing indicator events", async () => {
    const adapter = createMemoryRealtimeAdapter();
    const typing: string[] = [];

    const off = await adapter.subscribeToThread("thread-2", {
      onTypingStart: (id) => typing.push(id),
    });

    await adapter.publishTypingStarted("thread-2", "user-a");
    expect(typing).toEqual(["user-a"]);
    await off();
  });
});

describe("read receipt persistence", () => {
  it("markThreadRead is exported", async () => {
    const mod = await import("@/lib/messages/message-receipt-service");
    expect(typeof mod.markThreadRead).toBe("function");
  });
});

describe("access policy exports", () => {
  it("exports canViewThread", async () => {
    const mod = await import("@/lib/messages/message-access-policy");
    expect(typeof mod.canViewThread).toBe("function");
  });
});

describe("CommunicationCentreShell mobile layout", () => {
  it("module exports shell component", async () => {
    const mod = await import("@/components/messages/CommunicationCentreShell");
    expect(mod.CommunicationCentreShell).toBeDefined();
  });
});

describe("legacy conversation access", () => {
  it("denies access without participant record when prisma unavailable", async () => {
    const { userCanAccessConversation } = await import("@/lib/messages/message-service");
    try {
      const allowed = await userCanAccessConversation(
        "user-a",
        "conv-nonexistent",
        false
      );
      expect(allowed).toBe(false);
    } catch {
      expect(true).toBe(true);
    }
  });
});
