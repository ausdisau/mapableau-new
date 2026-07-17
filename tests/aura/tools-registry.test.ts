import { describe, expect, it } from "vitest";

import {
  assertToolIsUsable,
  isProhibitedToolSlug,
  PROHIBITED_TOOL_SLUGS,
  validateAgainstSchema,
  type RegisteredTool,
} from "@/lib/aura/tools/registry";

function tool(overrides: Partial<RegisteredTool> = {}): RegisteredTool {
  return {
    id: "t1",
    slug: "safe_tool",
    displayName: "Safe",
    kind: "internal_query",
    status: "active",
    versionKey: "1.0.0",
    inputSchema: {},
    outputSchema: {},
    riskTier: "low_readonly",
    writeCapable: false,
    requiresConsent: false,
    externalEndpoint: null,
    ...overrides,
  };
}

describe("tool registry", () => {
  it("rejects known prohibited slugs", () => {
    for (const slug of PROHIBITED_TOOL_SLUGS) {
      expect(isProhibitedToolSlug(slug)).toBe(true);
    }
  });

  it("assertToolIsUsable throws when tool is null", () => {
    expect(() => assertToolIsUsable(null)).toThrow(/TOOL_NOT_REGISTERED/);
  });

  it("assertToolIsUsable throws when tool is not active", () => {
    expect(() => assertToolIsUsable(tool({ status: "draft" }))).toThrow(
      /TOOL_NOT_ACTIVE/
    );
  });

  it("assertToolIsUsable throws on prohibited slug", () => {
    expect(() => assertToolIsUsable(tool({ slug: "raw_shell" }))).toThrow(
      /TOOL_PROHIBITED/
    );
  });

  it("validateAgainstSchema catches missing required keys", () => {
    const result = validateAgainstSchema(
      { type: "object", required: ["participantId"] },
      {}
    );
    expect(result.ok).toBe(false);
  });

  it("validateAgainstSchema passes with all required keys", () => {
    const result = validateAgainstSchema(
      { type: "object", required: ["participantId"] },
      { participantId: "p1" }
    );
    expect(result.ok).toBe(true);
  });

  it("validateAgainstSchema catches wrong scalar type", () => {
    const result = validateAgainstSchema({ type: "string" }, 42);
    expect(result.ok).toBe(false);
  });
});
