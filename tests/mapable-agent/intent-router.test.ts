import { describe, expect, it } from "vitest";

import { classifyMapableAgentIntent, toolsForIntent } from "@/lib/mapable-agent/intent-router";

describe("classifyMapableAgentIntent", () => {
  it("detects billing intent", () => {
    const result = classifyMapableAgentIntent("check my invoice line items");
    expect(result.type).toBe("billing");
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it("detects safeguarding intent", () => {
    const result = classifyMapableAgentIntent("I need to report an incident");
    expect(result.type).toBe("safeguarding");
  });

  it("returns general for empty query", () => {
    expect(classifyMapableAgentIntent("").type).toBe("general");
  });
});

describe("toolsForIntent", () => {
  it("includes billing tools", () => {
    const tools = toolsForIntent("billing");
    expect(tools).toContain("classifyInvoiceLineItems");
    expect(tools).toContain("logAuditEvent");
  });
});
