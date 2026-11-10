import { afterEach, describe, expect, it } from "vitest";

import {
  isIrisAgentMemoryEnabled,
  loadIrisMemoryForTurn,
} from "@/lib/ai/memory/iris-agent-memory";

describe("iris agent memory adapter", () => {
  const envKeys = [
    "MAPABLE_IRIS_AGENT_MEMORY_ENABLED",
    "AGENT_MEMORY_URL",
    "STORE_ID",
    "AGENT_MEMORY_API_KEY",
  ] as const;
  const prev: Record<string, string | undefined> = {};

  afterEach(() => {
    for (const key of envKeys) {
      if (prev[key] === undefined) delete process.env[key];
      else process.env[key] = prev[key];
    }
  });

  function snapshotEnv() {
    for (const key of envKeys) {
      prev[key] = process.env[key];
    }
  }

  it("defaults disabled", () => {
    snapshotEnv();
    delete process.env.MAPABLE_IRIS_AGENT_MEMORY_ENABLED;
    expect(isIrisAgentMemoryEnabled()).toBe(false);
  });

  it("returns empty snippets when disabled", async () => {
    snapshotEnv();
    process.env.MAPABLE_IRIS_AGENT_MEMORY_ENABLED = "false";
    const bundle = await loadIrisMemoryForTurn({
      tenantId: "t1",
      participantId: "p1",
      query: "hello",
    });
    expect(bundle.enabled).toBe(false);
    expect(bundle.snippets).toEqual([]);
    expect(bundle.sessionId).toContain("mapable:t1:p1:");
  });

  it("fails soft when enabled but API unreachable", async () => {
    snapshotEnv();
    process.env.MAPABLE_IRIS_AGENT_MEMORY_ENABLED = "true";
    process.env.AGENT_MEMORY_URL = "http://127.0.0.1:9";
    process.env.STORE_ID = "store";
    process.env.AGENT_MEMORY_API_KEY = "key";
    const bundle = await loadIrisMemoryForTurn({
      tenantId: "t1",
      participantId: "p1",
      query: "preferences",
    });
    expect(bundle.enabled).toBe(true);
    expect(bundle.snippets).toEqual([]);
  });
});
