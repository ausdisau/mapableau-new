import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(),
}));

vi.mock("@/lib/consent/consent-service", () => ({
  grantConsent: vi.fn(),
  revokeConsent: vi.fn(),
}));

import type { CurrentUser } from "@/lib/auth/current-user";
import { resetSyntheticConsentsForTests } from "@/lib/coverage-care/core-bridge";
import {
  createCoverageCareEnquiry,
  getCoverageCareEnquiry,
  listProviderInbox,
  markEnquiryProviderReviewed,
  submitCoverageCareEnquiry,
  updateEnquirySharePreview,
  withdrawCoverageCareEnquiry,
} from "@/lib/coverage-care/enquiry-service";
import { listCoverageCareServices } from "@/lib/coverage-care/listing-service";
import { CoverageCarePermissionError } from "@/lib/coverage-care/permissions";
import { resetCoverageCareMemoryStore } from "@/lib/coverage-care/store/memory-store";
import {
  getAcmeCareTenant,
  getCoverageCareTenant,
  listAccessDenials,
} from "@/lib/coverage-care/tenant-context";

const participant: CurrentUser = {
  id: "user_participant_1",
  email: "p@example.com",
  name: "Pat",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  primaryRole: "participant",
  roles: ["participant"],
};

const providerAdmin: CurrentUser = {
  id: "user_provider_1",
  email: "admin@example.com",
  name: "Admin",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  primaryRole: "provider_admin",
  roles: ["provider_admin"],
};

describe("Coverage Care participant journey", () => {
  beforeEach(() => {
    process.env.MAPABLE_COVERAGE_CARE_ENABLED = "true";
    process.env.MAPABLE_COVERAGE_CARE_PERSISTENCE = "memory";
    resetCoverageCareMemoryStore();
    resetSyntheticConsentsForTests();
  });

  it("explores services → enquiry → share → submit → provider review → withdraw", async () => {
    const listings = listCoverageCareServices();
    expect(listings.length).toBeGreaterThan(0);
    expect(listings.every((l) => l.provenance === "synthetic_demo")).toBe(true);

    const listing = listings[0]!;
    const draft = createCoverageCareEnquiry({
      participant,
      listingId: listing.id,
    });
    expect(draft.status).toBe("draft");

    const reviewed = updateEnquirySharePreview({
      enquiryId: draft.id,
      participant,
      sharePreview: {
        fieldsShared: ["firstName", "suburb"],
        purpose: "Synthetic allied-health enquiry",
        providerLabel: listing.title,
      },
    });
    expect(reviewed.status).toBe("sharing_review");

    const submitted = await submitCoverageCareEnquiry({
      enquiryId: draft.id,
      participant,
    });
    expect(submitted.status).toBe("submitted");
    expect(submitted.consentRecordId).toBeTruthy();

    const coverageTenant = getCoverageCareTenant();
    const inbox = listProviderInbox({
      actor: providerAdmin,
      actorTenantId: coverageTenant.id,
    });
    expect(inbox.some((item) => item.id === draft.id)).toBe(true);

    const providerReviewed = markEnquiryProviderReviewed({
      enquiryId: draft.id,
      actor: providerAdmin,
      actorTenantId: coverageTenant.id,
      notes: "Synthetic acknowledgement",
    });
    expect(providerReviewed.status).toBe("provider_reviewed");

    const withdrawn = await withdrawCoverageCareEnquiry({
      enquiryId: draft.id,
      participant,
    });
    expect(withdrawn.status).toBe("withdrawn");
    expect(withdrawn.withdrawnAt).toBeTruthy();
  });

  it("blocks a second tenant from reading Coverage Care enquiries", () => {
    const listing = listCoverageCareServices()[0]!;
    const enquiry = createCoverageCareEnquiry({
      participant,
      listingId: listing.id,
    });

    const acme = getAcmeCareTenant();
    expect(() =>
      getCoverageCareEnquiry(enquiry.id, {
        actorTenantId: acme.id,
        actorUserId: "user_acme_actor",
      }),
    ).toThrow(CoverageCarePermissionError);

    const denials = listAccessDenials(acme.id);
    expect(denials.length).toBeGreaterThan(0);
    expect(denials[0]?.reason).toBe("CROSS_TENANT_DENIED");
  });

  it("does not leak Coverage Care listings into Acme tenant scope", () => {
    const acme = getAcmeCareTenant();
    const acmeListings = listCoverageCareServices({ tenantId: acme.id });
    expect(acmeListings.every((l) => l.tenantId === acme.id)).toBe(true);
    expect(
      acmeListings.every((l) => !l.title.includes("Coverage Care")),
    ).toBe(true);
  });
});
