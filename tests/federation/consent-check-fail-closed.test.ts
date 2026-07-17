import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  findUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    consentRecord: {
      findFirst: mocks.findFirst,
    },
    consentDirective: {
      findUnique: mocks.findUnique,
    },
  },
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(async () => ({ id: "ae-1" })),
}));

vi.mock("@/lib/consent/scope-map", () => ({
  consentScopeToPrisma: (s: string) => s,
  consentScopeFromPrisma: (s: string) => s,
}));

import { checkConsent } from "@/lib/consent/consent-service";

describe("checkConsent — Wave 9 hardening", () => {
  it("fails closed when both grantees are omitted", async () => {
    mocks.findFirst.mockReset();
    const ok = await checkConsent({
      subjectUserId: "p1",
      scope: "accessibility.read",
    });
    expect(ok).toBe(false);
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });

  it("still consults DB when grantee is present", async () => {
    mocks.findFirst.mockReset();
    mocks.findFirst.mockResolvedValueOnce(null);
    await checkConsent({
      subjectUserId: "p1",
      scope: "accessibility.read",
      grantedToOrganisationId: "org-1",
    });
    expect(mocks.findFirst).toHaveBeenCalled();
  });

  it("respects a withdrawn directive over an active record", async () => {
    mocks.findFirst.mockReset();
    mocks.findUnique.mockReset();
    mocks.findFirst.mockResolvedValueOnce({
      id: "r1",
      subjectUserId: "p1",
      status: "active",
      directiveId: "d1",
    });
    mocks.findUnique.mockResolvedValueOnce({
      decision: "withdrawn",
      status: "withdrawn",
      effectiveUntil: null,
    });
    const ok = await checkConsent({
      subjectUserId: "p1",
      scope: "accessibility.read",
      grantedToOrganisationId: "org-1",
    });
    expect(ok).toBe(false);
  });

  it("returns true when directive is active and record matches", async () => {
    mocks.findFirst.mockReset();
    mocks.findUnique.mockReset();
    mocks.findFirst.mockResolvedValueOnce({
      id: "r2",
      subjectUserId: "p1",
      status: "active",
      directiveId: "d2",
    });
    mocks.findUnique.mockResolvedValueOnce({
      decision: "active",
      status: "active",
      effectiveUntil: null,
    });
    const ok = await checkConsent({
      subjectUserId: "p1",
      scope: "accessibility.read",
      grantedToOrganisationId: "org-1",
    });
    expect(ok).toBe(true);
  });

  it("returns true when record matches and has no directive linkage", async () => {
    mocks.findFirst.mockReset();
    mocks.findFirst.mockResolvedValueOnce({
      id: "r3",
      subjectUserId: "p1",
      status: "active",
      directiveId: null,
    });
    const ok = await checkConsent({
      subjectUserId: "p1",
      scope: "accessibility.read",
      grantedToOrganisationId: "org-1",
    });
    expect(ok).toBe(true);
  });
});
