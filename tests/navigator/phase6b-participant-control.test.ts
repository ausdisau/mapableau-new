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

vi.mock("@/lib/ingestion/ndis-providers-search", () => ({
  searchNdisProviders: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    consentRecord: { findMany: vi.fn() },
    navigatorDecisionPassport: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    navigatorGovernedMemoryItem: {
      findMany: vi.fn(),
    },
  },
}));

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { applyMemoryToHardConstraints } from "@/lib/ai/navigator/memory/apply-to-constraints";
import { listMemoryItems } from "@/lib/ai/navigator/memory/service";
import {
  matchingConstraintsFromPassportLabels,
  rematchAfterPassportCorrection,
} from "@/lib/ai/navigator/passport/rematch";
import {
  correctDecisionPassport,
  hasActiveAiOptOut,
} from "@/lib/ai/navigator/passport/service";
import { runNavigatorProviderSearchTurn } from "@/lib/ai/navigator/orchestrator";
import { NAVIGATOR_CONSENT_PURPOSE } from "@/lib/ai/navigator/consent-gate";
import { searchNdisProviders } from "@/lib/ingestion/ndis-providers-search";
import { prisma } from "@/lib/prisma";

const FLAG_KEYS = [
  "MAPABLE_NAVIGATOR_PILOT_ENABLED",
  "MAPABLE_NAVIGATOR_PILOT_PASSPORT",
  "MAPABLE_NAVIGATOR_PILOT_MEMORY",
  "MAPABLE_NAVIGATOR_PILOT_MATCHING",
  "MAPABLE_NAVIGATOR_PILOT_ENVELOPES",
] as const;

function clearFlags() {
  for (const key of FLAG_KEYS) delete process.env[key];
}

function passportRow(overrides: Record<string, unknown> = {}) {
  const now = new Date();
  return {
    id: "pass-6b",
    tenantId: "t1",
    participantId: "p1",
    actorUserId: "p1",
    sessionId: "sess-6b",
    goalSummary: "Find support",
    interpretationJson: { summary: "support worker" },
    hardConstraintsJson: [
      { label: "state", value: "NSW", nonNegotiable: true },
      { label: "exclusion", value: "Provider X", nonNegotiable: true },
    ],
    rankingWeightsJson: {
      participantPreference: 0.4,
      accessibilityFit: 0.3,
      availability: 0.3,
    },
    sourcesJson: [],
    shortlistJson: [{ id: "old", label: "Old Outlet", factors: [] }],
    uncertaintyNotes: [],
    limitationsNotes: [],
    conflictsOfInterest: [],
    aiInvolved: true,
    modelIndependentRules: [],
    nextStep: "Review",
    nextStepController: "participant",
    consentedPurpose: NAVIGATOR_CONSENT_PURPOSE,
    consentRecordId: "c1",
    aiOptedOut: false,
    status: "active",
    correlationId: "corr",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("Navigator Phase 6b — correction rematch", () => {
  beforeEach(() => {
    clearFlags();
    process.env.MAPABLE_NAVIGATOR_PILOT_ENABLED = "true";
    process.env.MAPABLE_NAVIGATOR_PILOT_PASSPORT = "true";
    process.env.MAPABLE_NAVIGATOR_PILOT_MATCHING = "true";
    vi.mocked(createAuditEvent).mockClear();
    vi.mocked(searchNdisProviders).mockReset();
    vi.mocked(prisma.navigatorDecisionPassport.findFirst).mockReset();
    vi.mocked(prisma.navigatorDecisionPassport.update).mockReset();
  });

  afterEach(() => clearFlags());

  it("maps passport labels into matching hard constraints", () => {
    const constraints = matchingConstraintsFromPassportLabels([
      { label: "state", value: "NSW", nonNegotiable: true },
      { label: "exclusion", value: "Bad Co", nonNegotiable: true },
      { label: "accessibility", value: "wheelchair" },
    ]);
    expect(constraints.state).toBe("NSW");
    expect(constraints.exclusions).toContain("Bad Co");
    expect(constraints.accessibilityRequirements).toContain("wheelchair");
    expect(constraints.nonNegotiableKeys).toEqual(
      expect.arrayContaining(["state", "exclusions"]),
    );
  });

  it("rematches shortlist after participant correction", async () => {
    vi.mocked(prisma.navigatorDecisionPassport.findFirst).mockResolvedValue(
      passportRow() as never,
    );
    vi.mocked(searchNdisProviders).mockResolvedValue({
      providers: [
        {
          source_id: "new-1",
          provider_name: "Fresh Support",
          suburb: "Parramatta",
          state: "NSW",
          postcode: "2150",
          latitude: null,
          longitude: null,
          phone: null,
          email: null,
          website: null,
          services: ["support worker"],
          registration_groups: [],
          updated_at: new Date("2026-01-01"),
        },
      ],
      count: 1,
    });
    vi.mocked(prisma.navigatorDecisionPassport.update).mockImplementation(
      async ({ data }) =>
        passportRow({
          status: "corrected",
          shortlistJson: (data as { shortlistJson: unknown }).shortlistJson,
          limitationsNotes: (data as { limitationsNotes: string[] })
            .limitationsNotes,
          nextStep: (data as { nextStep: string }).nextStep,
        }) as never,
    );

    const view = await correctDecisionPassport({
      id: "pass-6b",
      tenantId: "t1",
      participantId: "p1",
      actorUserId: "p1",
      note: "Prefer Parramatta",
      silent: true,
    });

    expect(searchNdisProviders).toHaveBeenCalled();
    expect(view.shortlist.map((s) => s.id)).toContain("new-1");
    expect(view.shortlist.map((s) => s.id)).not.toContain("old");
    expect(createAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "navigator.passport.corrected",
        metadata: expect.objectContaining({ rematched: true }),
      }),
    );
  });
});

describe("Navigator Phase 6b — AI opt-out honour", () => {
  beforeEach(() => {
    clearFlags();
    process.env.MAPABLE_NAVIGATOR_PILOT_ENABLED = "true";
    process.env.MAPABLE_NAVIGATOR_PILOT_PASSPORT = "true";
    process.env.MAPABLE_NAVIGATOR_PILOT_MATCHING = "true";
    vi.mocked(searchNdisProviders).mockReset();
    vi.mocked(prisma.consentRecord.findMany).mockResolvedValue([
      {
        id: "c-ok",
        purpose: NAVIGATOR_CONSENT_PURPOSE,
        status: "active",
        expiryDate: new Date(Date.now() + 60_000),
        dataScope: null,
        sourceAction: null,
        createdAt: new Date(),
      } as never,
    ]);
    vi.mocked(prisma.navigatorDecisionPassport.findFirst).mockResolvedValue({
      id: "pass-opt",
      aiOptedOut: true,
    } as never);
  });

  afterEach(() => clearFlags());

  it("detects active AI opt-out from passport", async () => {
    await expect(
      hasActiveAiOptOut({
        tenantId: "t1",
        participantId: "p1",
        sessionId: "sess",
      }),
    ).resolves.toBe(true);
  });

  it("blocks search when passport has aiOptedOut even if body omits it", async () => {
    const result = await runNavigatorProviderSearchTurn({
      tenantId: "t1",
      participantId: "p1",
      actorUserId: "p1",
      sessionId: "sess",
      goalText: "support worker",
      hardConstraints: { exclusions: [] },
      interpretationConfirmed: true,
      silent: true,
    });
    expect(result.status).toBe("blocked");
    expect(result.reason).toBe("ai_opted_out");
    expect(searchNdisProviders).not.toHaveBeenCalled();
  });
});

describe("Navigator Phase 6b — memory expiry and Stage-1 apply", () => {
  beforeEach(() => {
    clearFlags();
    process.env.MAPABLE_NAVIGATOR_PILOT_ENABLED = "true";
    process.env.MAPABLE_NAVIGATOR_PILOT_MEMORY = "true";
    vi.mocked(prisma.navigatorGovernedMemoryItem.findMany).mockReset();
  });

  afterEach(() => clearFlags());

  it("listMemoryItems asks Prisma to exclude expired rows", async () => {
    vi.mocked(prisma.navigatorGovernedMemoryItem.findMany).mockResolvedValue(
      [],
    );
    await listMemoryItems({ tenantId: "t1", participantId: "p1" });
    expect(prisma.navigatorGovernedMemoryItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { expiresAt: null },
            { expiresAt: { gt: expect.any(Date) } },
          ]),
        }),
      }),
    );
  });

  it("merges exclusion memory into hard constraints as non-negotiable", async () => {
    vi.mocked(prisma.navigatorGovernedMemoryItem.findMany).mockResolvedValue([
      {
        id: "m1",
        tenantId: "t1",
        participantId: "p1",
        purpose: NAVIGATOR_CONSENT_PURPOSE,
        category: "participant_exclusion",
        contentSummary: "Never Provider Z",
        provenance: "participant_stated",
        verification: "participant_stated",
        creatingActorId: "p1",
        consentRecordId: null,
        confidence: "stated",
        expiresAt: null,
        correctedAt: null,
        withdrawnAt: null,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        reviewedAt: null,
      } as never,
    ]);

    const merged = await applyMemoryToHardConstraints({
      tenantId: "t1",
      participantId: "p1",
      constraints: {
        requiredServices: [],
        exclusions: [],
        communicationRequirements: [],
        accessibilityRequirements: [],
        credentialRequirements: [],
        nonNegotiableKeys: [],
      },
    });

    expect(merged.exclusions).toContain("Never Provider Z");
    expect(merged.nonNegotiableKeys).toContain("exclusions");
  });
});
