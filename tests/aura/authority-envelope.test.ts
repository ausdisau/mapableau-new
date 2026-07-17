import { describe, expect, it } from "vitest";

import {
  evaluateAuthority,
  riskTierAtOrAbove,
  type EvaluationEnvelope,
} from "@/lib/aura/authority/evaluate";

function baseEnvelope(overrides: Partial<EvaluationEnvelope> = {}): EvaluationEnvelope {
  const now = new Date("2026-07-16T00:00:00Z");
  return {
    id: "env_1",
    status: "active",
    subjectUserId: "u_participant",
    agentId: "agent_care",
    organisationId: null,
    scopePermissions: ["care.search_options"],
    allowedActionSlugs: ["care.search_options"],
    allowedToolIds: ["tool_search_care"],
    financialCapDollars: null,
    perActionFinancialCapDollars: null,
    perSessionCallCap: null,
    perDayCallCap: null,
    requiresParticipantEachTime: false,
    humanReviewAtOrAboveRiskTier: "medium_reversible",
    effectiveFrom: now,
    effectiveUntil: null,
    revokedAt: null,
    ...overrides,
  };
}

describe("evaluateAuthority", () => {
  it("denies with envelope_missing when no envelope", () => {
    const v = evaluateAuthority(null, {
      slug: "care.search_options",
      riskTier: "low_readonly",
      prohibited: false,
      requiresConsent: false,
    }, {
      agentId: "agent_care",
      actorUserId: "u_participant",
      consentDecision: "allowed",
    });
    expect(v.verdict).toBe("denied");
    if (v.verdict === "denied") expect(v.code).toBe("envelope_missing");
  });

  it("denies expired envelope", () => {
    const now = new Date("2026-07-16T12:00:00Z");
    const env = baseEnvelope({
      effectiveUntil: new Date("2026-07-15T00:00:00Z"),
    });
    const v = evaluateAuthority(env, {
      slug: "care.search_options",
      riskTier: "low_readonly",
      prohibited: false,
      requiresConsent: false,
    }, {
      agentId: "agent_care",
      actorUserId: "u_participant",
      consentDecision: "allowed",
      now,
    });
    if (v.verdict === "denied") expect(v.code).toBe("envelope_expired");
    else expect.fail("expected deny");
  });

  it("denies revoked envelope", () => {
    const env = baseEnvelope({ revokedAt: new Date("2026-07-01T00:00:00Z") });
    const v = evaluateAuthority(env, {
      slug: "care.search_options",
      riskTier: "low_readonly",
      prohibited: false,
      requiresConsent: false,
    }, {
      agentId: "agent_care",
      actorUserId: "u_participant",
      consentDecision: "allowed",
    });
    if (v.verdict === "denied") expect(v.code).toBe("envelope_revoked");
    else expect.fail("expected deny");
  });

  it("denies empty permissions (default deny)", () => {
    const env = baseEnvelope({ scopePermissions: [], allowedActionSlugs: [] });
    const v = evaluateAuthority(env, {
      slug: "care.search_options",
      riskTier: "low_readonly",
      prohibited: false,
      requiresConsent: false,
    }, {
      agentId: "agent_care",
      actorUserId: "u_participant",
      consentDecision: "allowed",
    });
    if (v.verdict === "denied") expect(v.code).toBe("empty_permissions");
    else expect.fail("expected deny");
  });

  it("denies when action slug not in allowlist", () => {
    const env = baseEnvelope();
    const v = evaluateAuthority(env, {
      slug: "care.approve_agreement",
      riskTier: "low_readonly",
      prohibited: false,
      requiresConsent: false,
    }, {
      agentId: "agent_care",
      actorUserId: "u_participant",
      consentDecision: "allowed",
    });
    if (v.verdict === "denied") expect(v.code).toBe("action_not_in_allowlist");
    else expect.fail("expected deny");
  });

  it("denies prohibited action even if inside allowlist", () => {
    const env = baseEnvelope({
      allowedActionSlugs: ["billing.approve_invoice"],
      scopePermissions: ["billing.approve_invoice"],
    });
    const v = evaluateAuthority(env, {
      slug: "billing.approve_invoice",
      riskTier: "high_irreversible",
      prohibited: true,
      requiresConsent: true,
    }, {
      agentId: "agent_care",
      actorUserId: "u_participant",
      consentDecision: "allowed",
    });
    if (v.verdict === "denied") expect(v.code).toBe("action_prohibited");
    else expect.fail("expected deny");
  });

  it("denies when tool not in allowlist", () => {
    const env = baseEnvelope({ allowedToolIds: ["tool_a"] });
    const v = evaluateAuthority(env, {
      slug: "care.search_options",
      riskTier: "low_readonly",
      prohibited: false,
      requiresConsent: false,
    }, {
      agentId: "agent_care",
      actorUserId: "u_participant",
      toolId: "tool_b",
      consentDecision: "allowed",
    });
    if (v.verdict === "denied") expect(v.code).toBe("tool_not_in_allowlist");
    else expect.fail("expected deny");
  });

  it("denies on financial cap exceed", () => {
    const env = baseEnvelope({ financialCapDollars: 100 });
    const v = evaluateAuthority(env, {
      slug: "care.search_options",
      riskTier: "low_readonly",
      prohibited: false,
      requiresConsent: false,
      estimatedFinancialImpactDollars: 200,
    }, {
      agentId: "agent_care",
      actorUserId: "u_participant",
      consentDecision: "allowed",
      totalEnvelopeSpendDollars: 0,
    });
    if (v.verdict === "denied") expect(v.code).toBe("financial_cap_exceeded");
    else expect.fail("expected deny");
  });

  it("denies on per-action cap exceed", () => {
    const env = baseEnvelope({ perActionFinancialCapDollars: 50 });
    const v = evaluateAuthority(env, {
      slug: "care.search_options",
      riskTier: "low_readonly",
      prohibited: false,
      requiresConsent: false,
      estimatedFinancialImpactDollars: 60,
    }, {
      agentId: "agent_care",
      actorUserId: "u_participant",
      consentDecision: "allowed",
    });
    if (v.verdict === "denied") expect(v.code).toBe("per_action_financial_cap_exceeded");
    else expect.fail("expected deny");
  });

  it("denies on tenant mismatch when envelope is org-scoped", () => {
    const env = baseEnvelope({ organisationId: "org_a" });
    const v = evaluateAuthority(env, {
      slug: "care.search_options",
      riskTier: "low_readonly",
      prohibited: false,
      requiresConsent: false,
    }, {
      agentId: "agent_care",
      actorUserId: "u_participant",
      consentDecision: "allowed",
      organisationId: "org_b",
    });
    if (v.verdict === "denied") expect(v.code).toBe("tenant_mismatch");
    else expect.fail("expected deny");
  });

  it("denies when consent verdict is denied", () => {
    const env = baseEnvelope();
    const v = evaluateAuthority(env, {
      slug: "care.search_options",
      riskTier: "low_readonly",
      prohibited: false,
      requiresConsent: true,
    }, {
      agentId: "agent_care",
      actorUserId: "u_participant",
      consentDecision: "denied",
    });
    if (v.verdict === "denied") expect(v.code).toBe("consent_not_allowed");
    else expect.fail("expected deny");
  });

  it("denies inactive delegate", () => {
    const env = baseEnvelope();
    const v = evaluateAuthority(env, {
      slug: "care.search_options",
      riskTier: "low_readonly",
      prohibited: false,
      requiresConsent: false,
    }, {
      agentId: "agent_care",
      actorUserId: "u_delegate",
      actorIsDelegate: true,
      delegateAuthorityIsActive: false,
      consentDecision: "allowed",
    });
    if (v.verdict === "denied") expect(v.code).toBe("delegate_inactive");
    else expect.fail("expected deny");
  });

  it("denies delegate lacking required category", () => {
    const env = baseEnvelope();
    const v = evaluateAuthority(env, {
      slug: "care.search_options",
      riskTier: "low_readonly",
      prohibited: false,
      requiresConsent: false,
    }, {
      agentId: "agent_care",
      actorUserId: "u_delegate",
      actorIsDelegate: true,
      delegateAuthorityIsActive: true,
      requiredDelegateCategory: "billing_manage",
      delegateCategoriesGranted: ["contact_and_scheduling"],
      consentDecision: "allowed",
    });
    if (v.verdict === "denied") expect(v.code).toBe("delegate_category_missing");
    else expect.fail("expected deny");
  });

  it("requires approval for high-risk actions and denies without one", () => {
    const env = baseEnvelope({ humanReviewAtOrAboveRiskTier: "medium_reversible" });
    const v = evaluateAuthority(env, {
      slug: "care.search_options",
      riskTier: "high_irreversible",
      prohibited: false,
      requiresConsent: false,
    }, {
      agentId: "agent_care",
      actorUserId: "u_participant",
      consentDecision: "allowed",
    });
    if (v.verdict === "denied") expect(v.code).toBe("approval_required_for_risk_tier");
    else expect.fail("expected deny");
  });

  it("denies when approval input hash is stale", () => {
    const env = baseEnvelope();
    const v = evaluateAuthority(env, {
      slug: "care.search_options",
      riskTier: "high_irreversible",
      prohibited: false,
      requiresConsent: false,
    }, {
      agentId: "agent_care",
      actorUserId: "u_participant",
      consentDecision: "allowed",
      approvalDecisionId: "ap_1",
      approvalDecisionStatus: "approved",
      approvalInputHash: "aaa",
      currentInputHash: "bbb",
    });
    if (v.verdict === "denied") expect(v.code).toBe("approval_input_hash_stale");
    else expect.fail("expected deny");
  });

  it("allows a well-formed low-risk request", () => {
    const env = baseEnvelope();
    const v = evaluateAuthority(env, {
      slug: "care.search_options",
      riskTier: "low_readonly",
      prohibited: false,
      requiresConsent: false,
    }, {
      agentId: "agent_care",
      actorUserId: "u_participant",
      consentDecision: "allowed",
    });
    expect(v.verdict).toBe("allowed");
  });

  it("denies session call cap exceeded", () => {
    const env = baseEnvelope({ perSessionCallCap: 3 });
    const v = evaluateAuthority(env, {
      slug: "care.search_options",
      riskTier: "low_readonly",
      prohibited: false,
      requiresConsent: false,
    }, {
      agentId: "agent_care",
      actorUserId: "u_participant",
      consentDecision: "allowed",
      sessionCallCountSoFar: 3,
    });
    if (v.verdict === "denied") expect(v.code).toBe("session_call_cap_exceeded");
    else expect.fail("expected deny");
  });

  it("riskTierAtOrAbove is inclusive and orders tiers", () => {
    expect(riskTierAtOrAbove("high_irreversible", "medium_reversible")).toBe(true);
    expect(riskTierAtOrAbove("medium_reversible", "medium_reversible")).toBe(true);
    expect(riskTierAtOrAbove("low_readonly", "medium_reversible")).toBe(false);
  });
});
