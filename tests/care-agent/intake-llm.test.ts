import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/mapable-agent/model", () => ({
  getMapableAgentModelProvider: vi.fn(),
}));

vi.mock("@/lib/care-agent/config", () => ({
  isCareAgentLlmEnabled: vi.fn(() => true),
  careAgentConfig: {
    llmEnabled: true,
    fallbackToRules: true,
    confidenceThreshold: 0.75,
  },
  assertCareAgentLlmReady: vi.fn(),
}));

import { getMapableAgentModelProvider } from "@/lib/mapable-agent/model";
import { runCareIntakeWithLlm } from "@/lib/care-agent/intake-llm";

const baseInput = {
  sessionId: "sess-1",
  message: "I need a support worker for shower and dressing on Tuesday morning in Parramatta",
  assessmentSignals: {},
  preferences: {},
};

describe("runCareIntakeWithLlm", () => {
  beforeEach(() => {
    vi.mocked(getMapableAgentModelProvider).mockReset();
  });

  it("uses LLM structured output when confidence is high", async () => {
    vi.mocked(getMapableAgentModelProvider).mockReturnValue({
      id: "ollama",
      generateStructured: vi.fn().mockResolvedValue({
        inferredRequestType: "personal_care",
        titleHint: "Showering support Tuesday morning",
        schedulingHints: { locationHint: "Parramatta" },
        riskSignals: [],
        linkedTransportRequired: false,
        confidence: 0.9,
      }),
      chat: vi.fn(),
      chatStream: vi.fn(),
    } as never);

    const result = await runCareIntakeWithLlm(baseInput);
    expect(result.meta.source).toBe("llm");
    expect(result.meta.fallbackUsed).toBe(false);
    expect(result.intake.inferredRequestType).toBe("personal_care");
    expect(result.intake.titleHint).toContain("Showering");
  });

  it("falls back to rules when LLM confidence is low", async () => {
    vi.mocked(getMapableAgentModelProvider).mockReturnValue({
      id: "ollama",
      generateStructured: vi.fn().mockResolvedValue({
        inferredRequestType: "other",
        titleHint: "Unclear request",
        schedulingHints: {},
        riskSignals: [],
        linkedTransportRequired: false,
        confidence: 0.4,
      }),
      chat: vi.fn(),
      chatStream: vi.fn(),
    } as never);

    const result = await runCareIntakeWithLlm(baseInput);
    expect(result.meta.source).toBe("rules");
    expect(result.meta.fallbackUsed).toBe(true);
    expect(result.intake.inferredRequestType).toBe("personal_care");
  });

  it("falls back to rules when LLM throws", async () => {
    vi.mocked(getMapableAgentModelProvider).mockReturnValue({
      id: "ollama",
      generateStructured: vi.fn().mockRejectedValue(new Error("model down")),
      chat: vi.fn(),
      chatStream: vi.fn(),
    } as never);

    const result = await runCareIntakeWithLlm(baseInput);
    expect(result.meta.source).toBe("rules");
    expect(result.meta.fallbackUsed).toBe(true);
  });
});
