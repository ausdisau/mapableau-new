import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { findFirstMock, updateMock, autonomyStopFindFirstMock, autonomyStopCreateMock } =
  vi.hoisted(() => ({
    findFirstMock: vi.fn(),
    updateMock: vi.fn(),
    autonomyStopFindFirstMock: vi.fn(),
    autonomyStopCreateMock: vi.fn(),
  }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    consentRecord: {
      findFirst: findFirstMock,
      update: updateMock,
    },
    autonomyStop: {
      findFirst: autonomyStopFindFirstMock,
      create: autonomyStopCreateMock,
    },
  },
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(),
}));

vi.mock("@/lib/consent/consent-receipt-service", () => ({
  createConsentReceipt: vi.fn(),
}));

vi.mock("@/lib/passport", () => ({
  fieldCategoriesForConsentScope: vi.fn(() => []),
  filterFieldCategoriesForRecipient: vi.fn(() => []),
  invalidatePassportProjectionCache: vi.fn(),
}));

vi.mock("@/lib/trust/fabric/receipt-service", () => ({
  recordDisclosureReceipt: vi.fn(),
}));

vi.mock("@/lib/programmes/authority/participant-authority-service", () => ({
  evaluateParticipantAuthority: vi.fn(async () => ({
    allowed: true,
    reason: "self",
  })),
}));

import { evaluateAutonomyPep, retrieveAuthorisedContext } from "@/lib/autonomy/pep";
import { ACS_EXACT_CONSENT_SKIPPED_LOG } from "@/lib/config/autonomy-care";
import { trustFabricConfig } from "@/lib/config/trust-fabric";
import { revokeConsent } from "@/lib/consent/consent-service";
import { checkExactPurposeConsent } from "@/lib/consent/exact-purpose-check";
import { requireExactConsent } from "@/lib/consent/require-exact-consent";
import {
  __resetProgrammeAuraStopForTests,
  assertProgrammeExecutionEligibility,
  isProgrammeAuraStopped,
  stopProgrammeAura,
} from "@/lib/programmes/aura/execution-gate";

describe("Stage 1 deterministic trust", () => {
  beforeEach(() => {
    findFirstMock.mockReset();
    updateMock.mockReset();
    autonomyStopFindFirstMock.mockReset();
    autonomyStopCreateMock.mockReset();
    __resetProgrammeAuraStopForTests();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    __resetProgrammeAuraStopForTests();
  });

  it("S1-01 exact purpose mismatch is denied", async () => {
    vi.stubEnv("MAPABLE_ACS_EXACT_CONSENT_ENABLED", "true");
    findFirstMock.mockResolvedValue(null);
    const denied = await checkExactPurposeConsent({
      subjectUserId: "participant-1",
      scope: "accessibility.read",
      purpose: "breakfast_packaging_help",
      grantedToOrganisationId: "org-1",
      requestedFields: ["rosterStatus"],
    });
    expect(denied.allowed).toBe(false);
    expect(findFirstMock.mock.calls[0]?.[0]?.where).toMatchObject({
      purpose: "breakfast_packaging_help",
    });
  });

  it("S1-02 field not in dataScope is denied including empty dataScope", async () => {
    vi.stubEnv("MAPABLE_ACS_EXACT_CONSENT_ENABLED", "true");
    findFirstMock.mockResolvedValue({
      id: "consent-2",
      dataScope: [],
    });
    const denied = await checkExactPurposeConsent({
      subjectUserId: "participant-1",
      scope: "accessibility.read",
      purpose: "breakfast_packaging_help",
      requestedFields: ["familyContact"],
    });
    expect(denied.allowed).toBe(false);
    expect(denied.reason).toMatch(/familyContact/);
  });

  it("S1-03 revoke then retry is denied", async () => {
    vi.stubEnv("MAPABLE_ACS_EXACT_CONSENT_ENABLED", "true");
    findFirstMock.mockResolvedValue({
      id: "consent-1",
      dataScope: ["rosterStatus"],
    });
    await expect(
      requireExactConsent({
        subjectUserId: "participant-1",
        scope: "accessibility.read",
        purpose: "breakfast_packaging_help",
        grantedToOrganisationId: "org-1",
        requestedFields: ["rosterStatus"],
        actorUserId: "participant-1",
      }),
    ).resolves.toBeUndefined();

    updateMock.mockResolvedValue({
      id: "consent-1",
      subjectUserId: "participant-1",
      purpose: "breakfast_packaging_help",
      scope: "accessibility_read",
      recipientType: null,
      grantedToUserId: null,
      grantedToOrganisationId: "org-1",
    });
    await revokeConsent("consent-1", "participant-1");

    findFirstMock.mockResolvedValue(null);
    await expect(
      requireExactConsent({
        subjectUserId: "participant-1",
        scope: "accessibility.read",
        purpose: "breakfast_packaging_help",
        grantedToOrganisationId: "org-1",
        requestedFields: ["rosterStatus"],
        actorUserId: "actor-1",
      }),
    ).rejects.toThrow(/CONSENT_REQUIRED/);
  });

  it("S1-04 durable Stop survives process-local reset when flag on", async () => {
    vi.stubEnv("MAPABLE_ACS_DURABLE_STOP_ENABLED", "true");
    autonomyStopFindFirstMock.mockResolvedValue({
      id: "stop-1",
      tenantId: "org-1",
      participantId: "p1",
    });
    __resetProgrammeAuraStopForTests();
    expect(isProgrammeAuraStopped()).toBe(false);
    await expect(
      assertProgrammeExecutionEligibility({
        participantId: "p1",
        actorUserId: "p1",
        action: "view_checklist",
        tenantId: "org-1",
      }),
    ).rejects.toThrow(/durable stop is active/);
  });

  it("S1-05 cross-tenant deny happens before retrieval stub", async () => {
    vi.stubEnv("MAPABLE_ACS_EXACT_CONSENT_ENABLED", "true");
    vi.stubEnv("MAPABLE_ACS_DURABLE_STOP_ENABLED", "true");
    autonomyStopFindFirstMock.mockResolvedValue(null);
    const pep = await evaluateAutonomyPep({
      actorUserId: "actor-1",
      tenantId: "org-a",
      participantId: "participant-1",
      purpose: "breakfast_packaging_help",
      scope: "accessibility.read",
      resourceOrganisationId: "org-b",
    });
    expect(pep.allowed).toBe(false);
    expect(pep.reason).toMatch(/Cross-organisation/);
    let loaded = false;
    expect(() =>
      retrieveAuthorisedContext(pep, () => {
        loaded = true;
        return { secret: true };
      }),
    ).toThrow(/PEP_DENIED_BEFORE_RETRIEVAL/);
    expect(loaded).toBe(false);
    expect(findFirstMock).not.toHaveBeenCalled();
  });

  it("S1-06 missing purpose does not silently grant ACS-flagged paths", async () => {
    vi.stubEnv("MAPABLE_ACS_EXACT_CONSENT_ENABLED", "true");
    findFirstMock.mockResolvedValue({ id: "consent-1", dataScope: ["rosterStatus"] });
    await expect(
      requireExactConsent({
        subjectUserId: "participant-1",
        scope: "accessibility.read",
        purpose: "   ",
        grantedToOrganisationId: "org-1",
        actorUserId: "actor-1",
      }),
    ).rejects.toThrow(/CONSENT_REQUIRED/);
    expect(findFirstMock).not.toHaveBeenCalled();
  });

  it("S1-07 Trust Fabric AI authority stays false and retrieval does not live-fetch", async () => {
    expect(trustFabricConfig.aiDecisionAuthorityEnabled).toBe(false);
    expect(trustFabricConfig.automaticAuthorityEnabled).toBe(false);
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const pep = await evaluateAutonomyPep({
      actorUserId: "actor-1",
      tenantId: "org-a",
      participantId: "participant-1",
      purpose: "breakfast_packaging_help",
      scope: "accessibility.read",
      clientSuppliedRole: "admin",
    });
    expect(pep.allowed).toBe(false);
    expect(() =>
      retrieveAuthorisedContext(pep, () => {
        void fetch("https://example.invalid/rag");
        return {};
      }),
    ).toThrow(/PEP_DENIED_BEFORE_RETRIEVAL/);
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("logs an honest skip when the exact-consent flag is off", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    findFirstMock.mockResolvedValue({ id: "consent-legacy" });
    await requireExactConsent({
      subjectUserId: "participant-1",
      scope: "accessibility.read",
      purpose: "breakfast_packaging_help",
      grantedToOrganisationId: "org-1",
      actorUserId: "actor-1",
    });
    expect(info).toHaveBeenCalledWith(ACS_EXACT_CONSENT_SKIPPED_LOG);
    expect(findFirstMock.mock.calls[0]?.[0]?.where.purpose).toBeUndefined();
    info.mockRestore();
  });

  it("persists durable Stop and audit when the durable flag is on", async () => {
    vi.stubEnv("MAPABLE_ACS_DURABLE_STOP_ENABLED", "true");
    autonomyStopCreateMock.mockResolvedValue({ id: "stop-row" });
    await stopProgrammeAura({
      tenantId: "org-1",
      participantId: "p1",
      stoppedById: "p1",
      reason: "participant stop",
    });
    expect(autonomyStopCreateMock).toHaveBeenCalled();
    expect(isProgrammeAuraStopped()).toBe(true);
  });
});
