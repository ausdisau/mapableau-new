import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(async () => undefined),
}));

vi.mock("@/lib/consent/consent-receipt-service", () => ({
  createConsentReceipt: vi.fn(async () => ({ id: "receipt-1" })),
}));

vi.mock("@/lib/authority/participant-authority-service", () => ({
  hasParticipantAuthority: vi.fn(async () => false),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    consentRecord: { findMany: vi.fn(async () => []) },
    governedActionEnvelope: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/lib/ai/navigator/orchestrator", () => ({
  runNavigatorProviderSearchTurn: vi.fn(async () => ({
    status: "needs_review",
    interpretation: { awaitingConfirmation: true },
    match: null,
    draftEnvelopeId: null,
    transferEnvelopeId: null,
    passportId: null,
  })),
}));

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  ALL_AGENTS_SDK_TOOL_NAMES,
  NAVIGATOR_AGENTS_SDK_CAPABILITY,
  buildDefaultRunContext,
  buildTraceMetadata,
  buildToolsForContext,
  defaultEnabledDomainsForPilot,
  decryptRunStatePayload,
  encryptRunStatePayload,
  assertToolCallAllowed,
  getDefaultRunConfig,
  isDomainEnabled,
  isProhibitedToolAction,
  proposeDraftSummaryTool,
  revalidateToolCallContext,
  runAccessProviderSearchViaSdk,
} from "@/lib/ai/platform/agents-sdk";
import {
  clearCapabilityKillSwitch,
  engageCapabilityKillSwitch,
  requireAiCapability,
} from "@/lib/ai/platform";
import { PROHIBITED_AUTONOMOUS_ACTIONS } from "@/lib/ai/platform/types/authority";
import { prisma } from "@/lib/prisma";

function baseCtx(overrides: Record<string, unknown> = {}) {
  return buildDefaultRunContext({
    tenantId: "tenant-a",
    participantId: "participant-a",
    actorUserId: "participant-a",
    enabledDomains: ["access"],
    toolAllowlist: [...ALL_AGENTS_SDK_TOOL_NAMES],
    ...overrides,
  });
}

describe("Agents SDK capability registry", () => {
  it("registers navigator.agents_sdk.manager as not_claimable", () => {
    const cap = requireAiCapability(NAVIGATOR_AGENTS_SDK_CAPABILITY);
    expect(cap.featureFlag).toBe("MAPABLE_NAVIGATOR_AGENTS_SDK_ENABLED");
    expect(cap.productionClaimStatus).toBe("not_claimable");
    expect(cap.toolAllowlist).toContain("access_provider_search");
    expect(cap.toolAllowlist).toContain("propose_draft_summary");
  });
});

describe("Agents SDK policy gates", () => {
  beforeEach(() => {
    delete process.env.MAPABLE_NAVIGATOR_AGENTS_SDK_ENABLED;
    clearCapabilityKillSwitch(NAVIGATOR_AGENTS_SDK_CAPABILITY);
    vi.mocked(createAuditEvent).mockClear();
  });

  afterEach(() => {
    delete process.env.MAPABLE_NAVIGATOR_AGENTS_SDK_ENABLED;
    clearCapabilityKillSwitch(NAVIGATOR_AGENTS_SDK_CAPABILITY);
  });

  it("denies when feature flag is default false", async () => {
    const result = await assertToolCallAllowed({
      ctx: baseCtx(),
      toolName: "access_provider_search",
      requiredDomain: "access",
      silent: true,
    });
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("feature_flag_disabled");
    }
  });

  it("denies disabled domains", async () => {
    process.env.MAPABLE_NAVIGATOR_AGENTS_SDK_ENABLED = "true";
    const ctx = baseCtx({ enabledDomains: ["access"] });
    const result = await assertToolCallAllowed({
      ctx,
      toolName: "care_consult",
      requiredDomain: "care",
      silent: true,
    });
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("domain_disabled");
    }
  });

  it("denies tools not in context allowlist", async () => {
    process.env.MAPABLE_NAVIGATOR_AGENTS_SDK_ENABLED = "true";
    const ctx = baseCtx({ toolAllowlist: ["propose_draft_summary"] });
    const result = await assertToolCallAllowed({
      ctx,
      toolName: "access_provider_search",
      requiredDomain: "access",
      silent: true,
    });
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("tool_not_in_context_allowlist");
    }
  });

  it("blocks prohibited autonomous actions passed as tool names", async () => {
    process.env.MAPABLE_NAVIGATOR_AGENTS_SDK_ENABLED = "true";
    for (const action of PROHIBITED_AUTONOMOUS_ACTIONS.slice(0, 5)) {
      expect(isProhibitedToolAction(action)).toBe(true);
      const result = await assertToolCallAllowed({
        ctx: baseCtx({ toolAllowlist: [action] }),
        toolName: action,
        silent: true,
      });
      expect(result.allowed).toBe(false);
    }
  });

  it("respects kill switch before service path", async () => {
    process.env.MAPABLE_NAVIGATOR_AGENTS_SDK_ENABLED = "true";
    engageCapabilityKillSwitch(NAVIGATOR_AGENTS_SDK_CAPABILITY);
    const result = await assertToolCallAllowed({
      ctx: baseCtx(),
      toolName: "propose_draft_summary",
      silent: true,
    });
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("capability_kill_switch");
    }
  });

  it("blocks model path when aiOptedOut", async () => {
    process.env.MAPABLE_NAVIGATOR_AGENTS_SDK_ENABLED = "true";
    const result = await assertToolCallAllowed({
      ctx: baseCtx({ aiOptedOut: true }),
      toolName: "access_provider_search",
      requiredDomain: "access",
      requiresModel: true,
      silent: true,
    });
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("ai_opted_out");
    }
  });

  it("blocks when consent missing", async () => {
    process.env.MAPABLE_NAVIGATOR_AGENTS_SDK_ENABLED = "true";
    vi.mocked(prisma.consentRecord.findMany).mockResolvedValueOnce([]);
    const result = await assertToolCallAllowed({
      ctx: baseCtx(),
      toolName: "access_provider_search",
      requiredDomain: "access",
      silent: true,
    });
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("consent_consent_missing");
    }
  });

  it("revalidate fails closed after consent withdrawal on resume", async () => {
    process.env.MAPABLE_NAVIGATOR_AGENTS_SDK_ENABLED = "true";
    vi.mocked(prisma.consentRecord.findMany).mockResolvedValueOnce([]);
    const resume = await revalidateToolCallContext({
      ctx: baseCtx(),
      toolName: "propose_draft_summary",
      silent: true,
    });
    expect(resume.allowed).toBe(false);
  });

  it("excludes sensitive ids from trace metadata", () => {
    const ctx = baseCtx();
    const meta = buildTraceMetadata(ctx);
    expect(meta).toEqual({
      capabilityKey: NAVIGATOR_AGENTS_SDK_CAPABILITY,
      purpose: expect.any(String),
      domains: "access",
    });
    expect(JSON.stringify(meta)).not.toContain(ctx.tenantId);
    expect(JSON.stringify(meta)).not.toContain(ctx.participantId);
  });

  it("sets traceIncludeSensitiveData false in run config", () => {
    const config = getDefaultRunConfig(baseCtx());
    expect(config.traceIncludeSensitiveData).toBe(false);
  });

  it("encrypts and decrypts run state round-trip", () => {
    vi.stubEnv("MAPABLE_ALLOW_DEV_ENCRYPTION_FALLBACK", "true");
    vi.stubEnv("NODE_ENV", "test");
    const plain = '{"schemaVersion":"1.13","test":true}';
    const encrypted = encryptRunStatePayload(plain);
    expect(encrypted).not.toContain("participant");
    expect(decryptRunStatePayload(encrypted)).toBe(plain);
  });

  it("propose_draft_summary requires SDK approval", () => {
    expect(proposeDraftSummaryTool.needsApproval).toBeDefined();
  });

  it("buildToolsForContext omits care when domain disabled", () => {
    const tools = buildToolsForContext(baseCtx({ enabledDomains: ["access"] }));
    expect(tools.map((t) => t.name)).toContain("access_provider_search");
    expect(tools.map((t) => t.name)).not.toContain("care_consult");
  });

  it("default pilot enables access only", () => {
    expect(defaultEnabledDomainsForPilot()).toEqual(["access"]);
    expect(isDomainEnabled(baseCtx(), "access")).toBe(true);
    expect(isDomainEnabled(baseCtx(), "care")).toBe(false);
  });

  it("runAccessProviderSearchViaSdk fails closed when flag off", async () => {
    delete process.env.MAPABLE_NAVIGATOR_AGENTS_SDK_ENABLED;
    const result = await runAccessProviderSearchViaSdk({
      context: baseCtx(),
      searchInput: {
        tenantId: "tenant-a",
        participantId: "participant-a",
        actorUserId: "participant-a",
        hardConstraints: { nonNegotiableKeys: [] },
        interpretationConfirmed: false,
      },
    });
    expect(result.status).toBe("blocked");
  });
});

describe("Agents SDK IDOR envelope scope", () => {
  it("getGovernedActionEnvelope returns null for cross-tenant", async () => {
    const { getGovernedActionEnvelope } = await import(
      "@/lib/ai/navigator/envelopes/service"
    );
    vi.mocked(prisma.governedActionEnvelope.findFirst).mockResolvedValueOnce(
      null,
    );
    const row = await getGovernedActionEnvelope({
      envelopeId: "env-1",
      tenantId: "other-tenant",
      participantId: "participant-a",
    });
    expect(row).toBeNull();
  });
});
