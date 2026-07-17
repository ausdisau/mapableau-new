import { describe, expect, it } from "vitest";

import {
  evaluateMcpAccess,
  type McpServerRecord,
} from "@/lib/aura/protocols/mcp/gateway";

function server(overrides: Partial<McpServerRecord> = {}): McpServerRecord {
  return {
    id: "s1",
    slug: "example",
    displayName: "Example MCP",
    endpoint: "https://example.invalid/mcp",
    versionPin: "1.0.0",
    approvedAt: new Date("2026-07-16T00:00:00Z"),
    conformancePassed: true,
    productionActivated: true,
    ...overrides,
  };
}

describe("MCP gateway", () => {
  it("returns not_configured when mcpEnabled=false", () => {
    const v = evaluateMcpAccess({
      requestedSlug: "example",
      requestedVersion: "1.0.0",
      registry: [server()],
      configOverrides: { mcpEnabled: false } as never,
    });
    expect(v.verdict).toBe("not_configured");
  });

  it("blocks unregistered server", () => {
    const v = evaluateMcpAccess({
      requestedSlug: "unknown",
      requestedVersion: "1.0.0",
      registry: [server()],
      configOverrides: { mcpEnabled: true } as never,
    });
    expect(v.verdict).toBe("denied");
    if (v.verdict === "denied") expect(v.code).toBe("server_not_registered");
  });

  it("blocks unapproved server", () => {
    const v = evaluateMcpAccess({
      requestedSlug: "example",
      requestedVersion: "1.0.0",
      registry: [server({ approvedAt: null })],
      configOverrides: { mcpEnabled: true } as never,
    });
    if (v.verdict === "denied") expect(v.code).toBe("server_not_approved");
    else expect.fail("expected deny");
  });

  it("blocks server pending conformance", () => {
    const v = evaluateMcpAccess({
      requestedSlug: "example",
      requestedVersion: "1.0.0",
      registry: [server({ conformancePassed: false })],
      configOverrides: { mcpEnabled: true } as never,
    });
    if (v.verdict === "denied") expect(v.code).toBe("server_conformance_pending");
    else expect.fail("expected deny");
  });

  it("blocks version pin mismatch", () => {
    const v = evaluateMcpAccess({
      requestedSlug: "example",
      requestedVersion: "2.0.0",
      registry: [server()],
      configOverrides: { mcpEnabled: true } as never,
    });
    if (v.verdict === "denied") expect(v.code).toBe("version_pin_mismatch");
    else expect.fail("expected deny");
  });

  it("blocks not-production-activated server", () => {
    const v = evaluateMcpAccess({
      requestedSlug: "example",
      requestedVersion: "1.0.0",
      registry: [server({ productionActivated: false })],
      configOverrides: { mcpEnabled: true } as never,
    });
    if (v.verdict === "denied")
      expect(v.code).toBe("server_not_production_activated");
    else expect.fail("expected deny");
  });

  it("allows a fully approved production-activated pinned server", () => {
    const v = evaluateMcpAccess({
      requestedSlug: "example",
      requestedVersion: "1.0.0",
      registry: [server()],
      configOverrides: { mcpEnabled: true } as never,
    });
    expect(v.verdict).toBe("allowed");
  });
});
