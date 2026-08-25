import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(async () => undefined),
}));

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  clearCapabilityKillSwitch,
  engageCapabilityKillSwitch,
} from "@/lib/ai/platform/policies/kill-switches";
import { getAiCapability, listAiCapabilities } from "@/lib/ai/platform";
import {
  RELATIONAL_AUDIT,
  RELATIONAL_CAPABILITY_KEYS,
  RELATIONAL_INTELLIGENCE_FLAGS,
  RELATIONAL_POLICY_VERSION,
  RELATIONAL_PROHIBITED_OPERATIONAL_CAPABILITIES,
  assertRelationalCapability,
  isProhibitedInference,
  isRelationalFeatureFlagEnabled,
  isRelationalIntelligenceKilled,
  rejectProhibitedInference,
  validateRelationalGovernedEnvelope,
} from "@/lib/ai/relational";

const ORIGINAL_ENV = { ...process.env };

function baseCtx(
  overrides: Partial<Parameters<typeof assertRelationalCapability>[0]> = {},
) {
  return {
    capabilityKey: "relational.interpret",
    tenantId: "tenant-a",
    expectedTenantId: "tenant-a",
    participantId: "participant-a",
    expectedParticipantId: "participant-a",
    actorUserId: "actor-a",
    grantedConsentScopes: ["profile.read"],
    silent: true,
    ...overrides,
  };
}

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.MAPABLE_RELATIONAL_INTELLIGENCE_ENABLED;
  delete process.env.MAPABLE_RELATIONAL_INTELLIGENCE_MODEL_ASSISTED;
  delete process.env.MAPABLE_RELATIONAL_INTELLIGENCE_DRAFT;
  delete process.env.MAPABLE_RELATIONAL_INTELLIGENCE_ACCESS_SEARCH;
  delete process.env.MAPABLE_RELATIONAL_INTELLIGENCE_HUMAN_HELP;
  delete process.env.MAPABLE_RELATIONAL_INTELLIGENCE_KILL_SWITCH;
  delete process.env.MAPABLE_AI_GLOBAL_KILL_SWITCH;
  delete process.env.MAPABLE_AI_PLATFORM_ENABLED;
  delete process.env.MAPABLE_AI_MODEL_GENERATION_ENABLED;
  vi.mocked(createAuditEvent).mockClear();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  for (const key of RELATIONAL_CAPABILITY_KEYS) {
    clearCapabilityKillSwitch(key);
  }
});

describe("Relational Intelligence Prompt 01 — flags", () => {
  it("defaults all relational flags to false", () => {
    expect(
      isRelationalFeatureFlagEnabled(RELATIONAL_INTELLIGENCE_FLAGS.enabled),
    ).toBe(false);
    expect(
      isRelationalFeatureFlagEnabled(
        RELATIONAL_INTELLIGENCE_FLAGS.modelAssisted,
      ),
    ).toBe(false);
    expect(
      isRelationalFeatureFlagEnabled(RELATIONAL_INTELLIGENCE_FLAGS.draft),
    ).toBe(false);
    expect(
      isRelationalFeatureFlagEnabled(RELATIONAL_INTELLIGENCE_FLAGS.accessSearch),
    ).toBe(false);
    expect(
      isRelationalFeatureFlagEnabled(RELATIONAL_INTELLIGENCE_FLAGS.humanHelp),
    ).toBe(false);
    expect(isRelationalIntelligenceKilled()).toBe(false);
  });
});

describe("Relational Intelligence Prompt 01 — registry", () => {
  it("registers the six Prompt 01 capabilities", () => {
    const keys = listAiCapabilities().map((c) => c.key);
    expect(keys).toEqual(
      expect.arrayContaining([...RELATIONAL_CAPABILITY_KEYS]),
    );
    for (const key of RELATIONAL_CAPABILITY_KEYS) {
      const cap = getAiCapability(key);
      expect(cap).toBeDefined();
      expect(cap!.productionClaimStatus).toBe("not_claimable");
      expect(cap!.maturity).toBe("experimental");
    }
  });

  it("binds deterministic authority ceilings", () => {
    expect(getAiCapability("relational.interpret")!.authorityCeiling).toBe(
      "READ_ONLY_EXPLAIN",
    );
    expect(getAiCapability("relational.draft")!.authorityCeiling).toBe(
      "DRAFT_ONLY",
    );
    expect(getAiCapability("human.help.request")!.authorityCeiling).toBe(
      "SUGGEST_WITH_HUMAN_REVIEW",
    );
  });
});

describe("Relational Intelligence Prompt 01 — gate denials", () => {
  it("denies when master flag is off", async () => {
    const result = await assertRelationalCapability(baseCtx());
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("feature_flag_disabled");
      expect(result.denial.nextStep.length).toBeGreaterThan(0);
    }
  });

  it("denies unregistered capabilities", async () => {
    const result = await assertRelationalCapability(
      baseCtx({ capabilityKey: "relational.unknown" }),
    );
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("capability_not_registered");
    }
  });

  it("denies prohibited operational capabilities", async () => {
    const result = await assertRelationalCapability(
      baseCtx({
        capabilityKey: RELATIONAL_PROHIBITED_OPERATIONAL_CAPABILITIES[0],
      }),
    );
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("prohibited_operational_capability");
    }
  });

  it("denies cross-tenant requests", async () => {
    process.env.MAPABLE_RELATIONAL_INTELLIGENCE_ENABLED = "true";
    const result = await assertRelationalCapability(
      baseCtx({ tenantId: "tenant-b" }),
    );
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("tenant_mismatch");
    }
  });

  it("denies wrong-participant requests", async () => {
    process.env.MAPABLE_RELATIONAL_INTELLIGENCE_ENABLED = "true";
    const result = await assertRelationalCapability(
      baseCtx({ participantId: "participant-b" }),
    );
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("participant_mismatch");
    }
  });

  it("denies missing consent purpose", async () => {
    process.env.MAPABLE_RELATIONAL_INTELLIGENCE_ENABLED = "true";
    const result = await assertRelationalCapability(
      baseCtx({ grantedConsentScopes: [] }),
    );
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("consent_missing_or_wrong_purpose");
    }
  });

  it("denies when RI kill switch is engaged", async () => {
    process.env.MAPABLE_RELATIONAL_INTELLIGENCE_ENABLED = "true";
    process.env.MAPABLE_RELATIONAL_INTELLIGENCE_KILL_SWITCH = "true";
    const result = await assertRelationalCapability(baseCtx());
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("relational_kill_switch");
    }
  });

  it("denies when capability kill switch is engaged", async () => {
    process.env.MAPABLE_RELATIONAL_INTELLIGENCE_ENABLED = "true";
    engageCapabilityKillSwitch("relational.interpret");
    const result = await assertRelationalCapability(baseCtx());
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("capability_kill_switch");
    }
  });

  it("allows interpret when master flag and consent are present", async () => {
    process.env.MAPABLE_RELATIONAL_INTELLIGENCE_ENABLED = "true";
    const result = await assertRelationalCapability(baseCtx());
    expect(result.allowed).toBe(true);
    if (result.allowed) {
      expect(result.authorityCeiling).toBe("READ_ONLY_EXPLAIN");
      expect(result.policyVersion).toBe(RELATIONAL_POLICY_VERSION);
    }
  });

  it("writes privacy-safe audit metadata on allow", async () => {
    process.env.MAPABLE_RELATIONAL_INTELLIGENCE_ENABLED = "true";
    await assertRelationalCapability(baseCtx({ silent: false }));
    expect(createAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: RELATIONAL_AUDIT.gateAllowed,
        metadata: expect.objectContaining({
          policyVersion: RELATIONAL_POLICY_VERSION,
          authorityCeiling: "READ_ONLY_EXPLAIN",
        }),
      }),
    );
    const meta = vi.mocked(createAuditEvent).mock.calls[0]![0]!
      .metadata as Record<string, unknown>;
    expect(JSON.stringify(meta)).not.toMatch(/password|ndis number|secret/i);
  });
});

describe("Relational Intelligence Prompt 01 — envelopes and inferences", () => {
  it("rejects model-claimed execution authority", () => {
    const result = validateRelationalGovernedEnvelope({
      capabilityKey: "relational.draft",
      tenantId: "tenant-a",
      participantId: "participant-a",
      actorUserId: "actor-a",
      purpose: "draft_note",
      consentScopes: ["profile.read"],
      correlationId: "corr-1",
      policyVersion: "client-claim",
      claimedAuthorityCeiling: "DETERMINISTIC_EXECUTE_VIA_SERVICE",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.denial.code).toBe("model_authority_rejected");
    }
  });

  it("normalises envelopes to registry policy version", () => {
    const result = validateRelationalGovernedEnvelope({
      capabilityKey: "relational.explain",
      tenantId: "tenant-a",
      participantId: "participant-a",
      actorUserId: "actor-a",
      purpose: "explain_match",
      consentScopes: ["profile.read"],
      correlationId: "corr-2",
      policyVersion: "client",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.envelope.policyVersion).toBe(RELATIONAL_POLICY_VERSION);
      expect(result.authorityCeiling).toBe("READ_ONLY_EXPLAIN");
    }
  });

  it("blocks prohibited inferences", () => {
    expect(
      isProhibitedInference("infer_emotion_from_biometric_or_communication"),
    ).toBe(true);
    expect(() =>
      rejectProhibitedInference("infer_capacity_from_communication_style"),
    ).toThrow(/RELATIONAL_PROHIBITED_INFERENCE/);
  });
});
