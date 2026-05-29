import { describe, expect, it } from "vitest";

import {
  copilotIntentToModule,
  MODULE_DEPENDENCIES,
  resolveModuleClosure,
  retrieveInterdependentModuleRag,
} from "@/lib/rag";
import { MOCK_PARTICIPANT_ID } from "@/lib/prms/mockPrmsData";
import type { ConsentScope } from "@/lib/prms/types";

const DEMO_SCOPES: ConsentScope[] = [
  "profile_sharing",
  "transport_sharing",
  "billing_plan_manager",
];

describe("module RAG graph", () => {
  it("care depends on transport and cases", () => {
    expect(MODULE_DEPENDENCIES.care).toContain("transport");
    expect(MODULE_DEPENDENCIES.care).toContain("cases");
  });

  it("resolveModuleClosure includes origin then dependencies", () => {
    const modules = resolveModuleClosure("transport", 8);
    expect(modules[0]).toBe("transport");
    expect(modules).toContain("care");
    expect(modules).toContain("prms");
  });

  it("maps combined copilot intent to orchestration module", () => {
    expect(copilotIntentToModule("combined")).toBe("orchestration");
  });
});

describe("interdependent module RAG retrieval", () => {
  it("returns chunks from origin and related modules for demo participant", async () => {
    const result = await retrieveInterdependentModuleRag({
      participantId: MOCK_PARTICIPANT_ID,
      query: "wheelchair transport physiotherapy care",
      originModule: "transport",
      grantedScopes: DEMO_SCOPES,
      maxModules: 8,
    });

    expect(result.originModule).toBe("transport");
    expect(result.modulesQueried).toContain("transport");
    expect(result.modulesQueried).toContain("care");
    expect(result.chunks.length).toBeGreaterThan(0);
    const moduleIds = new Set(result.chunks.map((c) => c.moduleId));
    expect(moduleIds.has("transport") || moduleIds.has("care")).toBe(true);
  });

  it("skips billing when plan-manager consent is missing", async () => {
    const result = await retrieveInterdependentModuleRag({
      participantId: MOCK_PARTICIPANT_ID,
      query: "invoice payment billing",
      originModule: "cases",
      grantedScopes: ["profile_sharing", "transport_sharing"],
      maxModules: 8,
    });

    expect(result.modulesQueried).not.toContain("billing");
  });

  it("returns empty for unknown participants", async () => {
    const result = await retrieveInterdependentModuleRag({
      participantId: "unknown-participant",
      query: "transport",
      originModule: "transport",
      grantedScopes: DEMO_SCOPES,
    });

    expect(result.chunks).toHaveLength(0);
  });
});
