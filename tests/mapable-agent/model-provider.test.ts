import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("ai", () => ({
  generateText: vi.fn().mockResolvedValue({ text: "Hello from gpt-oss" }),
  generateObject: vi.fn(),
  streamText: vi.fn(),
}));

vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: vi.fn(() => (modelId: string) => modelId),
}));

import { generateText } from "ai";

import { mapableAgentConfig } from "@/lib/mapable-agent/config";
import { OllamaGptOssProvider } from "@/lib/mapable-agent/model/ollama-gpt-oss-provider";
import { VllmGptOssProvider } from "@/lib/mapable-agent/model/vllm-gpt-oss-provider";

describe("model providers", () => {
  beforeEach(() => {
    vi.mocked(generateText).mockClear();
  });

  it("OllamaGptOssProvider returns trimmed chat text", async () => {
    const provider = new OllamaGptOssProvider();
    const result = await provider.chat({
      messages: [{ role: "user", content: "Hi" }],
    });
    expect(result.text).toBe("Hello from gpt-oss");
    expect(generateText).toHaveBeenCalled();
  });

  it("VllmGptOssProvider uses configured model id", async () => {
    const provider = new VllmGptOssProvider();
    await provider.chat({ messages: [{ role: "user", content: "Hi" }] });
    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: mapableAgentConfig.modelId,
      }),
    );
  });
});
