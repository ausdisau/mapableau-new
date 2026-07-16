import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/mapable-agent/config", () => ({
  isMapableAgentConfigured: vi.fn(() => true),
  assertMapableAgentRuntimeReady: vi.fn(),
  mapableAgentConfig: {
    modelProvider: "ollama",
    maxSteps: 8,
    ollamaBaseUrl: "http://127.0.0.1:11434",
    modelId: "gpt-oss:20b",
  },
}));

vi.mock("@/lib/mapable-agent/model", () => ({
  getMapableAgentModelProvider: vi.fn(() => ({
    chat: vi.fn().mockResolvedValue({ text: "Fallback", confidence: 0.8 }),
    chatStream: vi.fn(),
    generateStructured: vi.fn(),
    id: "ollama",
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    agentSession: {
      findUnique: vi.fn(),
    },
    agentMessage: {
      create: vi.fn(),
    },
    agentRun: {
      update: vi.fn(),
    },
    humanReviewTask: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/agent-ops/agent-run-service", () => ({
  createAgentRun: vi.fn().mockResolvedValue({ id: "run-1" }),
}));

vi.mock("@/lib/mapable-agent/consent-gate", () => ({
  checkConsentGate: vi.fn().mockResolvedValue({ allowed: true }),
}));

vi.mock("@/lib/mapable-agent/agent-tools", () => ({
  createMapableAgent: vi.fn(() => ({
    generate: vi.fn().mockResolvedValue({
      text: "Orchestrator reply",
      steps: [{ toolCalls: [{ toolName: "getConsentStatus" }] }],
    }),
  })),
}));

import { prisma } from "@/lib/prisma";
import { runMapableAgentTurn } from "@/lib/mapable-agent/orchestrator";

describe("orchestrator", () => {
  beforeEach(() => {
    vi.mocked(prisma.agentSession.findUnique).mockResolvedValue({
      id: "sess-1",
      participantId: "user-1",
      messages: [],
    } as never);
    vi.mocked(prisma.agentMessage.create).mockResolvedValue({} as never);
    vi.mocked(prisma.humanReviewTask.findMany).mockResolvedValue([]);
    vi.mocked(prisma.agentRun.update).mockResolvedValue({} as never);
  });

  it("persists user and assistant messages on a turn", async () => {
    const result = await runMapableAgentTurn({
      sessionId: "sess-1",
      message: "What is core supports?",
      actorUserId: "user-1",
    });

    expect(result.text).toBe("Orchestrator reply");
    expect(prisma.agentMessage.create).toHaveBeenCalledTimes(2);
    expect(result.toolsCalled).toContain("getConsentStatus");
  });
});
