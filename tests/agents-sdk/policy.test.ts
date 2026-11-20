import { describe, expect, it } from "vitest";

import {
  PERMANENTLY_PROHIBITED_ACTIONS,
  type MapAbleAgentsContext,
} from "@/lib/ai/platform/agents-sdk/contracts";
import {
  assertDomainEnabled,
  assertMcpToolAllowlisted,
  assertNotPermanentlyProhibited,
  defaultEnabledDomainsForCapability,
  isPermanentlyProhibited,
} from "@/lib/ai/platform/agents-sdk/policy";
import {
  createPausedApproval,
  consumePausedApproval,
  __resetSdkApprovalStoreForTests,
} from "@/lib/ai/platform/agents-sdk/approval";
import { isLocalMcpAllowed } from "@/lib/ai/platform/agents-sdk/mcp-local";

function baseContext(
  overrides: Partial<MapAbleAgentsContext> = {},
): MapAbleAgentsContext {
  return {
    tenantId: "tenant-1",
    participantId: "participant-1",
    actorUserId: "participant-1",
    capabilityKey: "navigator.provider_search.match",
    purpose: "provider_search",
    enabledDomains: ["access"],
    mcpToolAllowlist: ["allowed_tool"],
    aiOptedOut: false,
    ...overrides,
  };
}

describe("agents-sdk policy", () => {
  it("marks permanent prohibitions including auto_assign_worker", () => {
    expect(isPermanentlyProhibited("auto_assign_worker")).toBe(true);
    expect(isPermanentlyProhibited("book_or_cancel_service")).toBe(true);
    expect(isPermanentlyProhibited("search_providers")).toBe(false);
    expect(PERMANENTLY_PROHIBITED_ACTIONS.length).toBeGreaterThan(10);
  });

  it("throws on permanently prohibited actions", () => {
    expect(() =>
      assertNotPermanentlyProhibited("assign_worker_or_driver"),
    ).toThrow(/MAPABLE_AGENT_PROHIBITED/);
  });

  it("enables access only for navigator.provider_search capabilities", () => {
    expect(
      defaultEnabledDomainsForCapability("navigator.provider_search.match"),
    ).toEqual(["access"]);
    expect(
      defaultEnabledDomainsForCapability("care.something"),
    ).toEqual([]);
  });

  it("blocks opted-out and disabled domains", () => {
    expect(() =>
      assertDomainEnabled(baseContext({ aiOptedOut: true }), "access"),
    ).toThrow(/AI_OPTED_OUT/);
    expect(() =>
      assertDomainEnabled(baseContext({ enabledDomains: ["access"] }), "care"),
    ).toThrow(/DOMAIN_DISABLED:care/);
  });

  it("enforces MCP tool allowlist", () => {
    expect(() =>
      assertMcpToolAllowlisted(baseContext(), "not_allowed"),
    ).toThrow(/MCP_TOOL_DENIED/);
    expect(() =>
      assertMcpToolAllowlisted(baseContext(), "allowed_tool"),
    ).not.toThrow();
  });

  it("disables local MCP on Vercel", () => {
    const prev = process.env.VERCEL;
    process.env.VERCEL = "1";
    process.env.MAPABLE_AGENTS_SDK_LOCAL_MCP = "true";
    expect(isLocalMcpAllowed()).toBe(false);
    if (prev === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = prev;
    delete process.env.MAPABLE_AGENTS_SDK_LOCAL_MCP;
  });
});

describe("agents-sdk approval bridge", () => {
  it("stores encrypted run state and never returns it on create", () => {
    __resetSdkApprovalStoreForTests();
    const created = createPausedApproval({
      context: baseContext(),
      proposedAction: "search_providers",
      summary: "Confirm provider search draft",
      runStateJson: JSON.stringify({ secret: "run-state" }),
    });
    expect(created.approvalRecordId).toMatch(/^sdkapr_/);
    expect(JSON.stringify(created)).not.toContain("run-state");

    const consumed = consumePausedApproval({
      approvalRecordId: created.approvalRecordId,
      tenantId: "tenant-1",
      participantId: "participant-1",
      decision: "approve",
    });
    expect(consumed.ok).toBe(true);
    expect(consumed.runStateJson).toContain("run-state");
  });

  it("rejects cross-tenant and expired approvals", () => {
    __resetSdkApprovalStoreForTests();
    const created = createPausedApproval({
      context: baseContext(),
      proposedAction: "search_providers",
      summary: "x",
      runStateJson: "{}",
      ttlMs: 1,
    });
    expect(
      consumePausedApproval({
        approvalRecordId: created.approvalRecordId,
        tenantId: "other-tenant",
        participantId: "participant-1",
        decision: "approve",
      }).ok,
    ).toBe(false);
  });

  it("refuses permanently prohibited proposed actions", () => {
    __resetSdkApprovalStoreForTests();
    expect(() =>
      createPausedApproval({
        context: baseContext(),
        proposedAction: "auto_assign_worker",
        summary: "nope",
        runStateJson: "{}",
      }),
    ).toThrow(/PROHIBITED/);
  });
});
