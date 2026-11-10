import { describe, expect, it } from "vitest";

import {
  AGENTS_SDK_EVAL_CASES,
} from "@/lib/ai/platform/agents-sdk/evals";
import {
  createPausedApproval,
  consumePausedApproval,
  __resetSdkApprovalStoreForTests,
} from "@/lib/ai/platform/agents-sdk/approval";
import {
  assertDomainEnabled,
  assertNotPermanentlyProhibited,
  defaultEnabledDomainsForCapability,
  isPermanentlyProhibited,
} from "@/lib/ai/platform/agents-sdk/policy";
import type { MapAbleAgentsContext } from "@/lib/ai/platform/agents-sdk/contracts";
import { createAccessSpecialist } from "@/lib/ai/platform/agents-sdk/specialists";
import { CARE_BLUEPRINT_SEED_CHUNKS } from "@/lib/search/care-blueprint-index";

function ctx(
  overrides: Partial<MapAbleAgentsContext> = {},
): MapAbleAgentsContext {
  return {
    tenantId: "tenant-a",
    participantId: "p1",
    actorUserId: "p1",
    capabilityKey: "navigator.provider_search.match",
    purpose: "eval",
    enabledDomains: ["access"],
    mcpToolAllowlist: [],
    aiOptedOut: false,
    ...overrides,
  };
}

describe("agents-sdk eval suite", () => {
  it("registers scaffold and care blueprint cases", () => {
    expect(AGENTS_SDK_EVAL_CASES.length).toBeGreaterThanOrEqual(12);
    expect(
      AGENTS_SDK_EVAL_CASES.some((c) => c.category === "care_blueprint"),
    ).toBe(true);
  });

  it("normal provider search enables access only", () => {
    expect(
      defaultEnabledDomainsForCapability("navigator.provider_search.match"),
    ).toEqual(["access"]);
  });

  it("ai opt-out blocks", () => {
    expect(() =>
      assertDomainEnabled(ctx({ aiOptedOut: true }), "access"),
    ).toThrow(/AI_OPTED_OUT/);
  });

  it("care domain disabled when not enabled", () => {
    expect(() => assertDomainEnabled(ctx(), "care")).toThrow(/DOMAIN_DISABLED/);
  });

  it("rejects booking, assignment, payment, safeguarding finding, auto-assign", () => {
    for (const action of [
      "book_or_cancel_service",
      "assign_worker_or_driver",
      "approve_or_pay_payment",
      "make_safeguarding_finding",
      "auto_assign_worker",
    ]) {
      expect(isPermanentlyProhibited(action)).toBe(true);
      expect(() => assertNotPermanentlyProhibited(action)).toThrow(/PROHIBITED/);
    }
  });

  it("approval create is opaque and cross-tenant resume fails", () => {
    __resetSdkApprovalStoreForTests();
    const created = createPausedApproval({
      context: ctx(),
      proposedAction: "search_providers",
      summary: "Confirm search",
      runStateJson: JSON.stringify({ run: "secret-state" }),
    });
    expect(JSON.stringify(created)).not.toContain("secret-state");
    const cross = consumePausedApproval({
      approvalRecordId: created.approvalRecordId,
      tenantId: "other",
      participantId: "p1",
      decision: "approve",
    });
    expect(cross.ok).toBe(false);
    expect(cross.reason).toMatch(/EXPIRED_OR_UNKNOWN/);
  });

  it("access specialist instructions forbid best-match / auto-assign language", () => {
    const agent = createAccessSpecialist();
    const instructions = String(
      (agent as { instructions?: unknown }).instructions ?? "",
    ).toLowerCase();
    expect(instructions).toContain("options that may fit your preferences");
    expect(instructions).toMatch(/never use ["']best match["']/);
  });

  it("blueprint seed chunks encode no auto-assignment invariant", () => {
    const joined = CARE_BLUEPRINT_SEED_CHUNKS.map((c) => c.invariants).join(
      " ",
    );
    expect(joined.toLowerCase()).toMatch(/auto-assign/);
    expect(joined.toLowerCase()).toMatch(/participant/);
  });
});
