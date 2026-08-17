import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(async () => undefined),
}));

vi.mock("@/lib/consent/consent-receipt-service", () => ({
  createConsentReceipt: vi.fn(async (input: { action: string }) => ({
    id: `receipt-${input.action}`,
  })),
}));

vi.mock("@/lib/platform/multi-tenant-admin/tenant-service", () => ({
  userCanAccessTenant: vi.fn(async () => true),
  assertTenantAccess: vi.fn(async () => undefined),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    consentRecord: { findMany: vi.fn() },
    participantAuthorityGrant: { findFirst: vi.fn() },
  },
}));

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { assertNavigatorConsentAndCapability } from "@/lib/ai/navigator/access";
import {
  NAVIGATOR_CONSENT_PURPOSE,
  verifyPurposeConsent,
} from "@/lib/ai/navigator/consent-gate";
import {
  assertNavigatorCapability,
  NAVIGATOR_AUDIT,
} from "@/lib/ai/navigator/gates";
import {
  buildMatchResult,
  rankEligibleProviders,
} from "@/lib/ai/navigator/matching/rank";
import { evidenceStatusFromUpdatedAt } from "@/lib/ai/navigator/matching/search-tool";
import type { ProviderCandidate } from "@/lib/ai/navigator/matching/types";
import { isModelAllowedForTask } from "@/lib/ai/platform/models/registry";
import { hasParticipantAuthority } from "@/lib/authority/participant-authority-service";
import { prisma } from "@/lib/prisma";

const FLAG_KEYS = [
  "MAPABLE_NAVIGATOR_PILOT_ENABLED",
  "MAPABLE_NAVIGATOR_PILOT_MATCHING",
] as const;

function clearFlags() {
  for (const key of FLAG_KEYS) delete process.env[key];
}

function consentRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "c-current",
    purpose: NAVIGATOR_CONSENT_PURPOSE,
    status: "active",
    expiryDate: new Date(Date.now() + 60_000),
    dataScope: ["location", "serviceType"],
    sourceAction: "interpret,match",
    createdAt: new Date("2026-08-01T00:00:00Z"),
    ...overrides,
  } as never;
}

function candidate(
  overrides: Partial<ProviderCandidate> & Pick<ProviderCandidate, "id" | "name">,
): ProviderCandidate {
  return {
    suburb: "Sydney",
    state: "NSW",
    postcode: "2000",
    services: ["support worker"],
    registrationGroups: [],
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    evidenceStatus: "unknown",
    sponsored: false,
    relatedParty: false,
    conflictNotes: [],
    ...overrides,
  };
}

describe("Navigator Phase 6c — consent remaining reasons", () => {
  beforeEach(() => {
    vi.mocked(prisma.consentRecord.findMany).mockReset();
    vi.mocked(createAuditEvent).mockClear();
  });

  it("rejects a superseded stored consent record id", async () => {
    const older = consentRow({
      id: "c-old",
      createdAt: new Date("2026-07-01T00:00:00Z"),
    });
    const newer = consentRow({
      id: "c-new",
      createdAt: new Date("2026-08-01T00:00:00Z"),
    });
    vi.mocked(prisma.consentRecord.findMany).mockResolvedValue([
      newer,
      older,
    ] as never);

    const result = await verifyPurposeConsent({
      tenantId: "t1",
      participantId: "p1",
      actorUserId: "p1",
      scope: "profile.read",
      purpose: NAVIGATOR_CONSENT_PURPOSE,
      action: "match",
      consentRecordId: "c-old",
      silent: true,
    });
    expect(result).toEqual({ ok: false, reason: "consent_superseded" });
  });

  it("rejects when requested fields are outside dataScope", async () => {
    vi.mocked(prisma.consentRecord.findMany).mockResolvedValue([
      consentRow({ dataScope: ["location"] }),
    ]);
    const result = await verifyPurposeConsent({
      tenantId: "t1",
      participantId: "p1",
      actorUserId: "p1",
      scope: "profile.read",
      purpose: NAVIGATOR_CONSENT_PURPOSE,
      action: "match",
      permittedFields: ["location", "diagnosis"],
      silent: true,
    });
    expect(result).toEqual({ ok: false, reason: "fields_insufficient" });
  });

  it("rejects when the action is not on sourceAction", async () => {
    vi.mocked(prisma.consentRecord.findMany).mockResolvedValue([
      consentRow({ sourceAction: "interpret" }),
    ]);
    const result = await verifyPurposeConsent({
      tenantId: "t1",
      participantId: "p1",
      actorUserId: "p1",
      scope: "profile.read",
      purpose: NAVIGATOR_CONSENT_PURPOSE,
      action: "escalate",
      silent: true,
    });
    expect(result).toEqual({ ok: false, reason: "action_not_permitted" });
  });
});

describe("Navigator Phase 6c — overbroad delegation", () => {
  beforeEach(() => {
    vi.mocked(prisma.participantAuthorityGrant.findFirst).mockReset();
  });

  it("does not treat a wildcard grant as authority for a named action", async () => {
    vi.mocked(prisma.participantAuthorityGrant.findFirst).mockResolvedValue({
      id: "g-star",
      actions: ["*", "match"],
      consentScopes: ["profile.read"],
    } as never);

    const allowed = await hasParticipantAuthority({
      participantId: "p1",
      actorUserId: "delegate-1",
      domain: "navigator",
      action: "match",
      consentScopes: ["profile.read"],
    });
    expect(allowed).toBe(false);
  });

  it("does not let a match-only grant authorize escalate", async () => {
    vi.mocked(prisma.participantAuthorityGrant.findFirst).mockResolvedValue(
      null,
    );
    const allowed = await hasParticipantAuthority({
      participantId: "p1",
      actorUserId: "delegate-1",
      domain: "navigator",
      action: "escalate",
    });
    expect(allowed).toBe(false);
    expect(prisma.participantAuthorityGrant.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          actions: { has: "escalate" },
          delegateId: "delegate-1",
          domain: "navigator",
        }),
      }),
    );
  });
});

describe("Navigator Phase 6c — stale evidence disclosure", () => {
  it("marks listings older than a year as stale", () => {
    const now = new Date("2026-08-15T00:00:00Z");
    expect(
      evidenceStatusFromUpdatedAt(new Date("2024-01-01T00:00:00Z"), now),
    ).toBe("stale");
    expect(
      evidenceStatusFromUpdatedAt(new Date("2026-06-01T00:00:00Z"), now),
    ).toBe("unknown");
  });

  it("labels stale shortlist entries and records a limitation", () => {
    const stale = candidate({
      id: "stale-1",
      name: "Stale Co",
      evidenceStatus: "stale",
      updatedAt: new Date("2020-01-01T00:00:00Z"),
    });
    const ranked = rankEligibleProviders([stale]);
    expect(
      ranked.shortlist[0]?.materialFactors.some((factor) => /stale/i.test(factor)),
    ).toBe(true);

    const match = buildMatchResult({
      eligible: [stale],
      eliminationSummary: {},
    });
    expect(match.limitations.some((line) => /stale/i.test(line))).toBe(true);
  });
});

describe("Navigator Phase 6c — audit chain spy", () => {
  beforeEach(() => {
    clearFlags();
    process.env.MAPABLE_NAVIGATOR_PILOT_ENABLED = "true";
    vi.mocked(prisma.consentRecord.findMany).mockReset();
    vi.mocked(createAuditEvent).mockClear();
  });

  afterEach(() => {
    clearFlags();
  });

  it("emits navigator.consent.used and navigator.gate.allowed", async () => {
    vi.mocked(prisma.consentRecord.findMany).mockResolvedValue([consentRow()]);

    const consent = await verifyPurposeConsent({
      tenantId: "t1",
      participantId: "p1",
      actorUserId: "p1",
      scope: "profile.read",
      purpose: NAVIGATOR_CONSENT_PURPOSE,
      action: "match",
    });
    expect(consent.ok).toBe(true);

    const gate = await assertNavigatorCapability({
      capabilityKey: "navigator.provider_search.match",
      tenantId: "t1",
      participantId: "p1",
      actorUserId: "p1",
    });
    expect(gate.allowed).toBe(true);

    const actions = vi
      .mocked(createAuditEvent)
      .mock.calls.map((call) => call[0]?.action);
    expect(actions).toContain(NAVIGATOR_AUDIT.consentUsed);
    expect(actions).toContain(NAVIGATOR_AUDIT.gateAllowed);
  });

  it("emits navigator.consent.blocked when purpose consent fails", async () => {
    vi.mocked(prisma.consentRecord.findMany).mockResolvedValue([]);
    await verifyPurposeConsent({
      tenantId: "t1",
      participantId: "p1",
      actorUserId: "p1",
      scope: "profile.read",
      purpose: NAVIGATOR_CONSENT_PURPOSE,
      action: "match",
    });
    const actions = vi
      .mocked(createAuditEvent)
      .mock.calls.map((call) => call[0]?.action);
    expect(actions).toContain(NAVIGATOR_AUDIT.consentBlocked);
  });
});

describe("Navigator Phase 6c — gateway allowlist (model-assisted off)", () => {
  it("does not allow Navigator interpret on production model allowlists", () => {
    expect(
      isModelAllowedForTask(
        "google/gemini-3.5-flash",
        "navigator.provider_search.interpret",
      ),
    ).toBe(false);
    expect(
      isModelAllowedForTask(
        "openai/gpt-oss-120b",
        "navigator.provider_search.reply",
      ),
    ).toBe(false);
  });
});

describe("Navigator Phase 6c — passport/memory surface helper", () => {
  beforeEach(() => {
    clearFlags();
    process.env.MAPABLE_NAVIGATOR_PILOT_ENABLED = "true";
    vi.mocked(prisma.consentRecord.findMany).mockReset();
  });

  afterEach(() => {
    clearFlags();
  });

  it("denies when consent is missing", async () => {
    vi.mocked(prisma.consentRecord.findMany).mockResolvedValue([]);
    const result = await assertNavigatorConsentAndCapability({
      tenantId: "t1",
      participantId: "p1",
      actorUserId: "p1",
      capabilityKey: "navigator.provider_search.match",
      action: "match",
      silent: true,
    });
    expect(result).toEqual({
      ok: false,
      code: "NAVIGATOR_CONSENT_CONSENT_MISSING",
    });
  });
});
