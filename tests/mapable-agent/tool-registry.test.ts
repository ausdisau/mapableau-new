import { describe, expect, it } from "vitest";

import { getToolCatalog, getToolDefinition } from "@/lib/mapable-agent/tools/registry";
import { BLOCKED_EXTERNAL_ACTIONS } from "@/lib/mapable-agent/tools/types";

describe("tool registry", () => {
  it("registers 14 tools", () => {
    expect(getToolCatalog()).toHaveLength(14);
  });

  it("draftProviderMessage requires human approval", () => {
    const tool = getToolDefinition("draftProviderMessage");
    expect(tool?.requiresHumanApproval).toBe(true);
    expect(tool?.sensitivity).toBe("draft");
  });

  it("blocks external action verbs in policy set", () => {
    expect(BLOCKED_EXTERNAL_ACTIONS.has("send")).toBe(true);
    expect(BLOCKED_EXTERNAL_ACTIONS.has("book")).toBe(true);
  });
});
