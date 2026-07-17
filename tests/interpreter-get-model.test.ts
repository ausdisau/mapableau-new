import { afterEach, describe, expect, it, vi } from "vitest";

describe("resolveInterpreterProvider / getInterpreterEngineId", () => {
  const env = process.env;

  afterEach(() => {
    process.env = { ...env };
    vi.resetModules();
  });

  it("routes openai/* model ids to OpenAI", async () => {
    process.env = {
      ...env,
      SEARCH_INTERPRETER_ENABLED: "true",
      OPENAI_API_KEY: "sk-test",
      GOOGLE_GENERATIVE_AI_API_KEY: "",
      AI_GATEWAY_API_KEY: "",
      SEARCH_INTERPRETER_MODEL: "openai/gpt-4o-mini",
    };

    const { resolveInterpreterProvider, getInterpreterEngineId } = await import(
      "@/lib/search/interpreter/get-model"
    );

    expect(resolveInterpreterProvider("openai/gpt-4o-mini")).toBe("openai");
    expect(resolveInterpreterProvider("gpt-4.1-mini")).toBe("openai");
    expect(getInterpreterEngineId()).toBe("ai-sdk/openai/gpt-4o-mini");
  });

  it("routes google/* model ids to Google when key exists", async () => {
    process.env = {
      ...env,
      SEARCH_INTERPRETER_ENABLED: "true",
      OPENAI_API_KEY: "",
      GOOGLE_GENERATIVE_AI_API_KEY: "g-test",
      AI_GATEWAY_API_KEY: "",
      SEARCH_INTERPRETER_MODEL: "google/gemini-3.5-flash",
    };

    const { resolveInterpreterProvider, getInterpreterEngineId } = await import(
      "@/lib/search/interpreter/get-model"
    );

    expect(resolveInterpreterProvider("google/gemini-3.5-flash")).toBe("google");
    expect(resolveInterpreterProvider("gemini-3.5-flash")).toBe("google");
    expect(getInterpreterEngineId()).toBe("ai-sdk/google/gemini-3.5-flash");
  });

  it("prefers AI Gateway when configured", async () => {
    process.env = {
      ...env,
      SEARCH_INTERPRETER_ENABLED: "true",
      OPENAI_API_KEY: "sk-test",
      GOOGLE_GENERATIVE_AI_API_KEY: "g-test",
      AI_GATEWAY_API_KEY: "gw-test",
      SEARCH_INTERPRETER_MODEL: "openai/gpt-4o-mini",
    };

    const { resolveInterpreterProvider, getInterpreterEngineId } = await import(
      "@/lib/search/interpreter/get-model"
    );

    expect(resolveInterpreterProvider()).toBe("gateway");
    expect(getInterpreterEngineId()).toBe("ai-sdk/gateway/openai/gpt-4o-mini");
  });
});
