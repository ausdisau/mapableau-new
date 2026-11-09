import { readFileSync } from "node:fs";
import { join } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

const { findFirstMock } = vi.hoisted(() => ({
  findFirstMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    consentRecord: {
      findFirst: findFirstMock,
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

import {
  AUTONOMY_FIRST_RELEASE_CEILING,
  AUTONOMY_UNACCEPTABLE_TARGET,
  assertAutonomyCeiling,
  isDeployableAutonomyLevel,
} from "@/lib/autonomy/envelope";
import { trustFabricConfig } from "@/lib/config/trust-fabric";
import { checkConsent } from "@/lib/consent/consent-service";
import { checkExactPurposeConsent } from "@/lib/consent/exact-purpose-check";
import {
  __resetProgrammeAuraStopForTests,
  isProgrammeAuraStopped,
  stopProgrammeAura,
} from "@/lib/programmes/aura/execution-gate";

describe("Stage 0 autonomy envelope evidence", () => {
  beforeEach(() => {
    findFirstMock.mockReset();
    __resetProgrammeAuraStopForTests();
  });

  it("keeps L2 as the first-release ceiling and refuses L5", () => {
    expect(AUTONOMY_FIRST_RELEASE_CEILING).toBe("L2_preauthorised");
    expect(isDeployableAutonomyLevel("L2_preauthorised")).toBe(true);
    expect(isDeployableAutonomyLevel("L5_unrestricted")).toBe(false);
    expect(() => assertAutonomyCeiling(AUTONOMY_UNACCEPTABLE_TARGET)).toThrow(
      /not an acceptable deployment target/i,
    );
    expect(trustFabricConfig.aiDecisionAuthorityEnabled).toBe(false);
    expect(trustFabricConfig.automaticAuthorityEnabled).toBe(false);
  });

  it("documents that production checkConsent does not match purpose or data fields", async () => {
    findFirstMock.mockResolvedValue({ id: "consent-1" });
    const allowed = await checkConsent({
      subjectUserId: "participant-1",
      scope: "accessibility.read",
      grantedToOrganisationId: "org-1",
    });
    expect(allowed).toBe(true);
    const where = findFirstMock.mock.calls[0]?.[0]?.where as Record<string, unknown>;
    expect(where).toMatchObject({
      subjectUserId: "participant-1",
      status: "active",
    });
    expect(where.purpose).toBeUndefined();
    expect(where.dataScope).toBeUndefined();
  });

  it("proposes an unwired exact-purpose gate that denies purpose and field mismatch", async () => {
    findFirstMock.mockResolvedValue(null);
    const denied = await checkExactPurposeConsent({
      subjectUserId: "participant-1",
      scope: "accessibility.read",
      purpose: "breakfast_packaging_help",
      grantedToOrganisationId: "backup-provider",
      requestedFields: ["rosterStatus"],
    });
    expect(denied.allowed).toBe(false);
    expect(findFirstMock.mock.calls[0]?.[0]?.where).toMatchObject({
      purpose: "breakfast_packaging_help",
    });

    findFirstMock.mockResolvedValue({
      id: "consent-2",
      dataScope: ["rosterStatus"],
    });
    const fieldDenied = await checkExactPurposeConsent({
      subjectUserId: "participant-1",
      scope: "accessibility.read",
      purpose: "breakfast_packaging_help",
      requestedFields: ["familyContact"],
    });
    expect(fieldDenied.allowed).toBe(false);
    expect(fieldDenied.reason).toMatch(/familyContact/);
  });

  it("keeps process-local Stop when the durable flag is off", async () => {
    expect(isProgrammeAuraStopped()).toBe(false);
    await stopProgrammeAura();
    expect(isProgrammeAuraStopped()).toBe(true);
    const source = readFileSync(
      join(process.cwd(), "lib/programmes/aura/execution-gate.ts"),
      "utf8",
    );
    expect(source).toMatch(/let programmeAuraStopped = false/);
    expect(source).toMatch(/isAcsDurableStopEnabled/);
    expect(source).not.toMatch(/redis|temporal/i);
  });

  it("does not wire the exact-purpose helper into legacy requireConsent", () => {
    const requireSource = readFileSync(
      join(process.cwd(), "lib/consent/require-consent.ts"),
      "utf8",
    );
    expect(requireSource).not.toMatch(/checkExactPurposeConsent/);
    expect(requireSource).toMatch(/checkConsent\(/);
  });
});
