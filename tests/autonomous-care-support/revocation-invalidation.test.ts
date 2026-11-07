import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    consentRecord: {
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(),
}));

vi.mock("@/lib/consent/consent-receipt-service", () => ({
  createConsentReceipt: vi.fn(async () => ({ id: "receipt-rev" })),
}));

vi.mock("@/lib/passport", () => ({
  fieldCategoriesForConsentScope: () => [],
  filterFieldCategoriesForRecipient: (x: unknown) => x,
  invalidatePassportProjectionCache: vi.fn(),
}));

vi.mock("@/lib/trust/fabric/receipt-service", () => ({
  recordDisclosureReceipt: vi.fn(),
}));

import { revokeConsent } from "@/lib/consent/consent-service";
import {
  getProtectedReadInvalidationEpoch,
  __resetProtectedReadInvalidationEpochForTests,
} from "@/lib/programmes/aura/durable-stop";
import { prisma } from "@/lib/prisma";

describe("ACS Stage 1 — revocation invalidates protected reads (N3/N11)", () => {
  beforeEach(() => {
    __resetProtectedReadInvalidationEpochForTests();
    vi.mocked(prisma.consentRecord.update).mockReset();
  });

  it("bumps invalidation epoch on revoke so stale cache cannot approve", async () => {
    vi.mocked(prisma.consentRecord.update).mockResolvedValue({
      id: "c1",
      subjectUserId: "p-a",
      purpose: "care.roster.lookup",
      scope: "PROFILE_READ",
      grantedToUserId: null,
      grantedToOrganisationId: null,
      recipientType: null,
    } as never);

    const before = getProtectedReadInvalidationEpoch();
    await revokeConsent("c1", "p-a");
    expect(getProtectedReadInvalidationEpoch()).toBeGreaterThan(before);
  });
});
