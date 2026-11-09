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
  amendCoverageCareEnquiry,
  createCoverageCareEnquiry,
  deleteCoverageCareEnquiry,
  getCoverageCareEnquiry,
  listProviderInbox,
  markEnquiryProviderStatus,
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
  listSyntheticDelegates,
} from "@/lib/coverage-care/tenant-context";
import { COVERAGE_CARE_PROPOSED_DISCIPLINES } from "@/lib/tenancy/coverage-care-brand";

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

describe("tenancy enquiry journey", () => {
  beforeEach(() => {
    process.env.MAPABLE_COVERAGE_CARE_ENABLED = "true";
    process.env.MAPABLE_COVERAGE_CARE_PERSISTENCE = "memory";
    resetCoverageCareMemoryStore();
    resetSyntheticConsentsForTests();
  });

  it("seeds all 10 proposed disciplines as awaiting verification", () => {
    const listings = listCoverageCareServices();
    const disciplines = new Set(listings.map((l) => l.discipline));
    for (const d of COVERAGE_CARE_PROPOSED_DISCIPLINES) {
      expect(disciplines.has(d)).toBe(true);
    }
    expect(
      listings.every((l) => l.publicationStatus === "proposed / awaiting verification"),
    ).toBe(true);
  });

  it("supports create → amend → share → submit → provider status → withdraw", async () => {
    const listing = listCoverageCareServices()[0]!;
    const draft = createCoverageCareEnquiry({
      participant,
      listingId: listing.id,
    });
    expect(draft.status).toBe("draft");

    amendCoverageCareEnquiry({
      enquiryId: draft.id,
      participant,
      sharePreview: {
        fieldsShared: ["firstName"],
        purpose: "Synthetic allied-health enquiry",
        providerLabel: listing.title,
        preferredChannel: "email",
        accessRequirements: "Quiet waiting room preferred",
      },
    });

    const reviewed = updateEnquirySharePreview({
      enquiryId: draft.id,
      participant,
      sharePreview: {
        fieldsShared: ["firstName", "suburb"],
        purpose: "Synthetic allied-health enquiry",
        providerLabel: listing.title,
        preferredChannel: "aac_text_only",
        accessRequirements: "Quiet waiting room preferred",
      },
    });
    expect(reviewed.status).toBe("sharing_review");
    expect(reviewed.sharePreview?.preferredChannel).toBe("aac_text_only");

    const submitted = await submitCoverageCareEnquiry({
      enquiryId: draft.id,
      participant,
    });
    expect(submitted.status).toBe("submitted");
    expect(submitted.providerStatus).toBe("new");
    expect(submitted.consentRecordId).toBeTruthy();

    const coverageTenant = getCoverageCareTenant();
    const inbox = listProviderInbox({
      actor: providerAdmin,
      actorTenantId: coverageTenant.id,
    });
    expect(inbox.some((item) => item.id === draft.id)).toBe(true);

    const inReview = markEnquiryProviderStatus({
      enquiryId: draft.id,
      actor: providerAdmin,
      actorTenantId: coverageTenant.id,
      providerStatus: "in_review",
      notes: "Synthetic acknowledgement",
      reply: "We received your enquiry (mock).",
    });
    expect(inReview.providerStatus).toBe("in_review");
    expect(inReview.responderLabel).toBe("Admin");

    const withdrawn = await withdrawCoverageCareEnquiry({
      enquiryId: draft.id,
      participant,
    });
    expect(withdrawn.status).toBe("withdrawn");
    expect(withdrawn.providerStatus).toBeNull();

    const inboxAfter = listProviderInbox({
      actor: providerAdmin,
      actorTenantId: coverageTenant.id,
    });
    expect(inboxAfter.some((item) => item.id === draft.id)).toBe(false);
  });

  it("deletes enquiry records and exposes synthetic delegates", async () => {
    const listing = listCoverageCareServices()[0]!;
    const draft = createCoverageCareEnquiry({
      participant,
      listingId: listing.id,
    });
    const deleted = await deleteCoverageCareEnquiry({
      enquiryId: draft.id,
      participant,
    });
    expect(deleted.status).toBe("deleted");
    // Soft-deleted records are hidden from subsequent reads.
    expect(getCoverageCareEnquiry(draft.id)).toBeNull();

    const delegates = listSyntheticDelegates("user_cc_participant_demo");
    expect(delegates.length).toBeGreaterThan(0);
    expect(delegates[0]?.scope).toContain("enquiry");
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
  });
});
