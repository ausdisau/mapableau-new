import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  CONSOLIDATED_MATCHING_SOURCES, OPTIONS_ENGINE_ALGORITHM_REFS, OPTIONS_ENGINE_CAPABILITY_KEY,
  OPTIONS_MODEL_EXPLANATION_CAPABILITY_KEY, algorithmRegisterRefForDomain, clearOptionsStore,
  generateOptions, mapLegacyConstraintKind, toCareOptionCandidate,
} from "@/lib/ai/platform/options-engine";
import { getAiCapability } from "@/lib/ai/platform/capabilities/registry";
import { isOptionsEngineEnabled } from "@/lib/config/options-engine";

describe("Options Engine — registry & consolidation", () => {
  beforeEach(() => { clearOptionsStore(); process.env.MAPABLE_OPTIONS_ENGINE_ENABLED = "true"; });
  afterEach(() => { clearOptionsStore(); delete process.env.MAPABLE_OPTIONS_ENGINE_ENABLED; });

  it("registers experimental fail-closed capabilities", () => {
    const engine = getAiCapability(OPTIONS_ENGINE_CAPABILITY_KEY);
    const model = getAiCapability(OPTIONS_MODEL_EXPLANATION_CAPABILITY_KEY);
    expect(engine?.maturity).toBe("experimental");
    expect(engine?.featureFlag).toBe("MAPABLE_OPTIONS_ENGINE_ENABLED");
    expect(engine?.authorityCeiling).toBe("SUGGEST_WITH_PARTICIPANT_APPROVAL");
    expect(engine?.algorithmRegisterRef).toBe("alg.options_engine");
    expect(model?.featureFlag).toBe("MAPABLE_OPTIONS_MODEL_EXPLANATION_ENABLED");
  });

  it("maps consolidated matching sources without a parallel SoR claim", () => {
    const keys = CONSOLIDATED_MATCHING_SOURCES.map((s) => s.key);
    expect(keys).toContain("matching.care_rules");
    expect(keys).toContain("navigator.provider_search.match");
    expect(algorithmRegisterRefForDomain("care")).toBe(OPTIONS_ENGINE_ALGORITHM_REFS.care);
  });

  it("maps legacy navigator constraint labels onto Options Engine kinds", () => {
    expect(mapLegacyConstraintKind("accessibility")).toBe("required_accessibility_feature");
    expect(mapLegacyConstraintKind("unknown_thing")).toBeNull();
  });

  it("fail-closed when flag disabled", () => {
    delete process.env.MAPABLE_OPTIONS_ENGINE_ENABLED;
    expect(isOptionsEngineEnabled()).toBe(false);
    expect(() => generateOptions({ tenantId: "t", participantId: "p", actorId: "p", domain: "care", requirements: [], candidates: [toCareOptionCandidate({ id: "w1", tenantId: "t", displayName: "W", organisationName: "O" })] })).toThrow(/DISABLED/);
  });
});
