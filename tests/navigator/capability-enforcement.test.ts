import { afterEach, describe, expect, it } from "vitest";

import {
  assertCapabilityInvocation,
  clearCapabilityKillSwitch,
  engageCapabilityKillSwitch,
  requireAiCapability,
} from "@/lib/ai/platform";

describe("Navigator capability enforcement", () => {
  afterEach(() => {
    clearCapabilityKillSwitch("navigator.provider_search_pilot");
    delete process.env.MAPABLE_NAVIGATOR_PROVIDER_SEARCH_PILOT;
    delete process.env.MAPABLE_AI_GLOBAL_KILL_SWITCH;
    delete process.env.MAPABLE_AI_PLATFORM_ENABLED;
    delete process.env.MAPABLE_AI_MODEL_GENERATION_ENABLED;
  });

  it("registers navigator.provider_search_pilot with required consent scopes", () => {
    const cap = requireAiCapability("navigator.provider_search_pilot");
    expect(cap.requiredConsentScopes).toContain("navigator.provider_search");
    expect(cap.authorityCeiling).toBe("DRAFT_ONLY");
    expect(cap.toolAllowlist).toContain("create_care_request_draft");
    expect(cap.prohibitedUses).toContain("book_or_cancel_service");
  });

  it("rejects undeclared tools by default", () => {
    process.env.MAPABLE_NAVIGATOR_PROVIDER_SEARCH_PILOT = "true";
    const result = assertCapabilityInvocation({
      capabilityKey: "navigator.provider_search_pilot",
      toolName: "book_service_now",
      consentScopesPresent: ["navigator.provider_search"],
    });
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("tool_not_allowlisted");
    }
  });

  it("fails closed when feature flag is off", () => {
    const result = assertCapabilityInvocation({
      capabilityKey: "navigator.provider_search_pilot",
      toolName: "search_ndis_providers",
      consentScopesPresent: ["navigator.provider_search"],
    });
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("feature_flag_disabled");
    }
  });

  it("fails closed when kill switch engaged mid-workflow", () => {
    process.env.MAPABLE_NAVIGATOR_PROVIDER_SEARCH_PILOT = "true";
    engageCapabilityKillSwitch("navigator.provider_search_pilot");
    const result = assertCapabilityInvocation({
      capabilityKey: "navigator.provider_search_pilot",
      toolName: "search_ndis_providers",
      consentScopesPresent: ["navigator.provider_search"],
    });
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("capability_kill_switch");
    }
  });

  it("requires consent scopes present", () => {
    process.env.MAPABLE_NAVIGATOR_PROVIDER_SEARCH_PILOT = "true";
    const result = assertCapabilityInvocation({
      capabilityKey: "navigator.provider_search_pilot",
      toolName: "search_ndis_providers",
      consentScopesPresent: [],
    });
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("consent_scope_missing");
    }
  });
});
