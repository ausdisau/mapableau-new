import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

describe("mapableAgentConfig on Vercel", () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    process.env = { ...envBackup };
    vi.resetModules();
  });

  beforeEach(() => {
    vi.resetModules();
  });

  it("defaults model provider to vllm on Vercel", async () => {
    process.env.VERCEL = "1";
    process.env.MAPABLE_AGENT_ENABLED = "true";
    delete process.env.MAPABLE_AGENT_MODEL_PROVIDER;

    const { mapableAgentConfig } = await import("@/lib/mapable-agent/config");
    expect(mapableAgentConfig.modelProvider).toBe("vllm");
    expect(mapableAgentConfig.isVercel).toBe(true);
  });

  it("flags localhost vLLM on Vercel", async () => {
    process.env.VERCEL = "1";
    process.env.MAPABLE_AGENT_ENABLED = "true";
    process.env.VLLM_BASE_URL = "http://127.0.0.1:8000/v1";

    const { getMapableAgentRuntimeIssues } = await import("@/lib/mapable-agent/config");
    const codes = getMapableAgentRuntimeIssues().map((i) => i.code);
    expect(codes).toContain("vllm_unreachable");
  });

  it("disables queue when REDIS_URL is unset", async () => {
    delete process.env.REDIS_URL;
    delete process.env.UPSTASH_REDIS_URL;

    vi.resetModules();
    const { mapableAgentConfig } = await import("@/lib/mapable-agent/config");
    expect(mapableAgentConfig.queueEnabled).toBe(false);
  });
});
