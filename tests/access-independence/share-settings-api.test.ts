import { beforeEach, describe, expect, it, vi } from "vitest";

const requireApiSession = vi.fn();
const createAuditEvent = vi.fn();
const verifyRecipient = vi.fn();
const listRecipients = vi.fn();
const findUnique = vi.fn();
const updateProfile = vi.fn();
const createProfile = vi.fn();
const replaceAccessPassportConsent = vi.fn();

vi.mock("@/lib/api/auth-handler", () => ({
  requireApiSession: (...args: unknown[]) => requireApiSession(...args),
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: (...args: unknown[]) => createAuditEvent(...args),
}));

vi.mock("@/lib/access-passport/verify-recipient", () => ({
  verifyPassportRecipientOrganisation: (...args: unknown[]) =>
    verifyRecipient(...args),
  listEligiblePassportRecipients: (...args: unknown[]) =>
    listRecipients(...args),
}));

vi.mock("@/lib/consent/consent-service", () => ({
  replaceAccessPassportConsent: (...args: unknown[]) =>
    replaceAccessPassportConsent(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    accessibilityProfile: {
      findUnique: (...args: unknown[]) => findUnique(...args),
      update: (...args: unknown[]) => updateProfile(...args),
      create: (...args: unknown[]) => createProfile(...args),
    },
  },
}));

import { PATCH } from "@/app/api/accessibility-profile/share-settings/route";

const orgId = "clxxxxxxxxxxxxxxxxxxxxxxxx";

describe("PATCH share-settings consent binding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiSession.mockResolvedValue({
      id: "user-1",
      primaryRole: "participant",
    });
  });

  it("creates an organisation-bound grant for a verified recipient", async () => {
    findUnique.mockResolvedValue({
      id: "profile-1",
      shareWithProviders: {},
    });
    verifyRecipient.mockResolvedValue({
      ok: true,
      organisationId: orgId,
      displayName: "Acme Care",
    });
    replaceAccessPassportConsent.mockResolvedValue({
      grantId: "consent-new",
    });
    updateProfile.mockResolvedValue({ id: "profile-1" });

    const res = await PATCH(
      new Request("http://localhost/api/accessibility-profile/share-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categories: ["mobility"],
          recipientOrganisationId: orgId,
          purpose: "Plan accessible visit",
          expiresAt: null,
          active: true,
        }),
      }),
    );
    expect(res.status).toBe(200);
    expect(replaceAccessPassportConsent).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientOrganisationId: orgId,
        active: true,
        categories: ["mobility"],
      }),
    );
    const body = (await res.json()) as {
      shareSettings: { recipientLabel: string; recipientOrganisationId: string };
    };
    expect(body.shareSettings.recipientLabel).toBe("Acme Care");
    expect(body.shareSettings.recipientOrganisationId).toBe(orgId);
  });

  it("rejects a fake or inaccessible organisation", async () => {
    findUnique.mockResolvedValue({ id: "profile-1", shareWithProviders: {} });
    verifyRecipient.mockResolvedValue({
      ok: false,
      reason: "Organisation not found or inactive.",
    });

    const res = await PATCH(
      new Request("http://localhost/api/accessibility-profile/share-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categories: ["mobility"],
          recipientOrganisationId: orgId,
          purpose: "Plan accessible visit",
          expiresAt: null,
          active: true,
        }),
      }),
    );
    expect(res.status).toBe(403);
    expect(replaceAccessPassportConsent).not.toHaveBeenCalled();
  });

  it("revokes the previous grant when sharing changes", async () => {
    findUnique.mockResolvedValue({
      id: "profile-1",
      shareWithProviders: {
        version: 1,
        categories: ["mobility"],
        recipientOrganisationId: orgId,
        recipientLabel: "Acme Care",
        purpose: "Old purpose",
        expiresAt: null,
        active: true,
        updatedAt: new Date().toISOString(),
        grantId: "consent-old",
      },
    });
    verifyRecipient.mockResolvedValue({
      ok: true,
      organisationId: orgId,
      displayName: "Acme Care",
    });
    replaceAccessPassportConsent.mockResolvedValue({
      grantId: "consent-new",
    });
    updateProfile.mockResolvedValue({ id: "profile-1" });

    const res = await PATCH(
      new Request("http://localhost/api/accessibility-profile/share-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categories: ["mobility", "sensory"],
          recipientOrganisationId: orgId,
          purpose: "Updated purpose for visit",
          expiresAt: null,
          active: true,
        }),
      }),
    );
    expect(res.status).toBe(200);
    expect(replaceAccessPassportConsent).toHaveBeenCalledWith(
      expect.objectContaining({
        previousGrantId: "consent-old",
        active: true,
      }),
    );
  });

  it("does not create a duplicate grant when nothing material changed", async () => {
    findUnique.mockResolvedValue({
      id: "profile-1",
      shareWithProviders: {
        version: 1,
        categories: ["mobility"],
        recipientOrganisationId: orgId,
        recipientLabel: "Acme Care",
        purpose: "Same purpose text",
        expiresAt: null,
        active: true,
        updatedAt: new Date().toISOString(),
        grantId: "consent-1",
      },
    });

    const res = await PATCH(
      new Request("http://localhost/api/accessibility-profile/share-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categories: ["mobility"],
          recipientOrganisationId: orgId,
          purpose: "Same purpose text",
          expiresAt: null,
          active: true,
        }),
      }),
    );
    expect(res.status).toBe(200);
    expect(replaceAccessPassportConsent).not.toHaveBeenCalled();
  });
});
