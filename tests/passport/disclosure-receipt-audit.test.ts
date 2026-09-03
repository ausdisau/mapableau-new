import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  consentCreateMock,
  consentUpdateMock,
  consentFindManyMock,
  consentReceiptCreateMock,
  accessReceiptCreateMock,
  auditMock,
} = vi.hoisted(() => ({
  consentCreateMock: vi.fn(),
  consentUpdateMock: vi.fn(),
  consentFindManyMock: vi.fn(),
  consentReceiptCreateMock: vi.fn(),
  accessReceiptCreateMock: vi.fn(),
  auditMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    consentRecord: {
      create: consentCreateMock,
      update: consentUpdateMock,
      findMany: consentFindManyMock,
    },
    consentReceipt: {
      create: consentReceiptCreateMock,
    },
    participantAccessReceipt: {
      create: accessReceiptCreateMock,
    },
  },
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: auditMock,
}));

import { grantConsent, revokeConsent } from "@/lib/consent/consent-service";
import {
  EMPLOYER_FORBIDDEN_PASSPORT_KEYS,
  DelegateScopeError,
  assertEmployerFieldCategoriesSafe,
  fieldCategoriesForConsentScope,
  filterFieldCategoriesForRecipient,
  filterPassportPayloadForRecipient,
  resetPassportProjectionCacheForTests,
  validateDelegateConsentScopes,
} from "@/lib/passport";

beforeEach(() => {
  vi.clearAllMocks();
  resetPassportProjectionCacheForTests();
  process.env.MAPABLE_TRUST_FABRIC_ENABLED = "true";
  consentCreateMock.mockResolvedValue({
    id: "consent-1",
    subjectUserId: "participant-1",
    scope: "accessibility_read",
    purpose: "workplace adjustments",
    grantedToOrganisationId: "org-employer",
    recipientType: "organisation",
  });
  consentUpdateMock.mockResolvedValue({
    id: "consent-1",
    subjectUserId: "participant-1",
    scope: "accessibility_read",
    purpose: "workplace adjustments",
    grantedToOrganisationId: "org-employer",
    recipientType: "organisation",
    grantedToUserId: null,
  });
  consentReceiptCreateMock.mockResolvedValue({ id: "cr-1" });
  accessReceiptCreateMock.mockResolvedValue({
    id: "receipt-1",
    correlationId: "corr-1",
  });
  auditMock.mockResolvedValue(undefined);
});

describe("employer disclosure policy", () => {
  it("strips forbidden passport keys for organisation recipients", () => {
    const payload = {
      mobilityNeeds: "wheelchair",
      diagnosis: "should-not-leak",
      medicalHistory: "should-not-leak",
      communicationPreferences: { modes: ["speech"] },
    };

    const filtered = filterPassportPayloadForRecipient(payload, "organisation");

    expect(filtered).toEqual({
      mobilityNeeds: "wheelchair",
      communicationPreferences: { modes: ["speech"] },
    });
    for (const key of EMPLOYER_FORBIDDEN_PASSPORT_KEYS) {
      expect(filtered).not.toHaveProperty(key);
    }
  });

  it("allows full payload for non-employer recipients", () => {
    const payload = {
      diagnosis: "visible-to-clinician",
      mobilityNeeds: "wheelchair",
    };
    expect(filterPassportPayloadForRecipient(payload, "worker")).toEqual(payload);
  });

  it("filters forbidden field categories for employer recipients", () => {
    expect(() =>
      assertEmployerFieldCategoriesSafe(["other_support_profile"]),
    ).toThrow(/Employer disclosure cannot include field category/);

    const safe = filterFieldCategoriesForRecipient(
      ["mobility_needs", "other_support_profile"],
      "organisation",
    );
    expect(safe).toEqual(["mobility_needs"]);
  });

  it("maps consent scopes to field categories", () => {
    expect(fieldCategoriesForConsentScope("accessibility.read")).toContain(
      "mobility_needs",
    );
    expect(fieldCategoriesForConsentScope("support_profile.read")).toContain(
      "other_support_profile",
    );
  });
});

describe("consent grant and revoke disclosure receipts", () => {
  it("records disclosure receipt with field categories, purpose, and recipient on grant", async () => {
    await grantConsent({
      subjectUserId: "participant-1",
      grantedToOrganisationId: "org-employer",
      scope: "accessibility.read",
      purpose: "workplace adjustments",
      createdById: "participant-1",
      recipientType: "organisation",
    });

    expect(consentReceiptCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "granted",
          scope: "accessibility.read",
          purpose: "workplace adjustments",
          recipientType: "organisation",
        }),
      }),
    );

    expect(accessReceiptCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          participantId: "participant-1",
          organisationId: "org-employer",
          purpose: "workplace adjustments",
          fieldCategories: expect.arrayContaining(["mobility_needs"]),
          consentRecordId: "consent-1",
          outcome: "disclosed",
        }),
      }),
    );
  });

  it("does not include forbidden categories when granting to employer with support_profile scope", async () => {
    consentCreateMock.mockResolvedValue({
      id: "consent-2",
      subjectUserId: "participant-1",
      scope: "support_profile_read",
      purpose: "delegate support",
      grantedToOrganisationId: "org-employer",
      recipientType: "organisation",
    });

    await grantConsent({
      subjectUserId: "participant-1",
      grantedToOrganisationId: "org-employer",
      scope: "support_profile.read",
      purpose: "delegate support",
      createdById: "participant-1",
      recipientType: "organisation",
    });

    const call = accessReceiptCreateMock.mock.calls[0]?.[0];
    expect(call?.data.fieldCategories).not.toContain("other_support_profile");
  });

  it("records revocation disclosure receipt and invalidates passport cache", async () => {
    const { setPassportProjection, getPassportProjection } = await import("@/lib/passport");

    setPassportProjection("participant-1", "compat", { active: true });
    expect(getPassportProjection("participant-1", "compat")).not.toBeNull();

    await revokeConsent("consent-1", "participant-1");

    expect(getPassportProjection("participant-1", "compat")).toBeNull();

    expect(accessReceiptCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          purpose: expect.stringContaining("revoked:"),
          fieldCategories: expect.any(Array),
        }),
      }),
    );
  });
});

describe("delegate scope validation", () => {
  it("rejects scopes the participant has not actively granted", async () => {
    consentFindManyMock.mockResolvedValue([
      { scope: "profile_read" },
    ]);

    await expect(
      validateDelegateConsentScopes("participant-1", ["accessibility.read"]),
    ).rejects.toBeInstanceOf(DelegateScopeError);
  });

  it("accepts delegatable scopes within participant-granted bounds", async () => {
    consentFindManyMock.mockResolvedValue([
      { scope: "profile_read" },
      { scope: "accessibility_read" },
      { scope: "engagement_read_delegate" },
    ]);

    const scopes = await validateDelegateConsentScopes("participant-1", [
      "profile.read",
      "accessibility.read",
    ]);

    expect(scopes).toEqual(["profile.read", "accessibility.read"]);
  });

  it("rejects non-delegatable billing scopes", async () => {
    await expect(
      validateDelegateConsentScopes("participant-1", ["billing.read"]),
    ).rejects.toThrow(/cannot be delegated/);
  });
});
