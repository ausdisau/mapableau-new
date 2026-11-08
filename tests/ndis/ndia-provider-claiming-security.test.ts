import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { assertNdiaTransportNotImplemented } from "@/lib/ndis/api-gateway/ndia-gateway-contract";
import {
  buildClaimIdempotencyKey,
  isDuplicateIdempotencyKey,
} from "@/lib/ndis/provider-claiming/idempotency";
import {
  assertTransitionAllowed,
  isLiveSubmissionPhaseReachable,
  mapPrismaStatusToLifecycle,
  prismaStatusForSyntheticValidation,
  SYNTHETIC_EXTERNAL_STATUS,
} from "@/lib/ndis/provider-claiming/lifecycle";
import {
  fetchAccessTokenUnverified,
  submitProviderClaimToNdia,
} from "@/lib/ndis/provider-claiming/ndia-api-client";
import {
  assertNdiaLiveTransportBlocked,
  assertSubmitPathNotInvented,
  NdiaAuthorisedTransportNotImplementedError,
} from "@/lib/ndis/provider-claiming/transport-gate";
import {
  assertNdiaTrustBoundarySource,
  describeTrustBoundaries,
} from "@/lib/ndis/provider-claiming/trust-boundaries";
import type { NdiaProviderClaimPayload } from "@/lib/ndis/provider-claiming/types";

const samplePayload: NdiaProviderClaimPayload = {
  claimType: "registered_provider",
  provider: {
    abn: null,
    ndisRegistrationNumber: "4050000001",
    organisationId: "org_1",
    name: "Example Provider",
  },
  participant: {
    ndisNumber: null,
    ndisNumberMasked: "****0001",
    mapableUserId: "user_1",
  },
  invoiceReference: { mapableBillingInvoiceId: "inv_1" },
  servicePeriod: { start: "2026-01-01", end: "2026-01-31" },
  lines: [
    {
      lineNumber: 1,
      supportItemCode: "01_011_0107_1_1",
      description: "Personal care",
      serviceDate: "2026-01-15",
      quantity: 1,
      unitPriceCents: 6500,
      totalCents: 6500,
      gstIncluded: false,
    },
  ],
  totals: {
    subtotalCents: 6500,
    taxCents: 0,
    totalCents: 6500,
    currency: "AUD",
  },
  metadata: { builtAt: "2026-11-08T00:00:00.000Z", mapableVersion: "test" },
};

describe("NDIA lifecycle separation", () => {
  it("never treats synthetic markers as government acknowledgement", () => {
    expect(
      mapPrismaStatusToLifecycle(
        "dry_run_passed",
        SYNTHETIC_EXTERNAL_STATUS.validationOnly,
      ),
    ).toBe("synthetic_validated");
    expect(
      mapPrismaStatusToLifecycle("submitted", SYNTHETIC_EXTERNAL_STATUS.mockLegacy),
    ).toBe("synthetic_validated");
    expect(prismaStatusForSyntheticValidation()).toBe("dry_run_passed");
    expect(prismaStatusForSyntheticValidation()).not.toBe("submitted");
  });

  it("forbids jumping to acknowledged without pending ack", () => {
    expect(() =>
      assertTransitionAllowed("synthetic_validated", "acknowledged"),
    ).toThrow(/NDIA_LIFECYCLE_TRANSITION_FORBIDDEN/);
  });

  it("keeps live submission phase unreachable", () => {
    expect(isLiveSubmissionPhaseReachable()).toBe(false);
  });
});

describe("NDIA transport gate", () => {
  const previousPath = process.env.NDIA_PROVIDER_CLAIM_SUBMIT_PATH;

  afterEach(() => {
    if (previousPath === undefined) {
      delete process.env.NDIA_PROVIDER_CLAIM_SUBMIT_PATH;
    } else {
      process.env.NDIA_PROVIDER_CLAIM_SUBMIT_PATH = previousPath;
    }
  });

  it("blocks live transport", () => {
    expect(() => assertNdiaLiveTransportBlocked()).toThrow(
      NdiaAuthorisedTransportNotImplementedError,
    );
    expect(() => assertNdiaTransportNotImplemented()).toThrow(
      /NDIA_AUTHORISED_TRANSPORT_NOT_IMPLEMENTED/,
    );
  });

  it("rejects invented submit paths", () => {
    expect(() => assertSubmitPathNotInvented("/v1/provider/claims")).toThrow(
      NdiaAuthorisedTransportNotImplementedError,
    );
  });

  it("synthetic submit performs no network and is notSubmitted", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const result = await submitProviderClaimToNdia(samplePayload);
    expect(result.notSubmitted).toBe(true);
    expect(result.governmentReference).toBeNull();
    expect(result.mode).toBe("synthetic");
    expect(result.externalStatus).toBe(
      SYNTHETIC_EXTERNAL_STATUS.validationOnly,
    );
    expect(result.lifecyclePhase).toBe("synthetic_validated");
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("disables unverified token fetch", async () => {
    await expect(fetchAccessTokenUnverified()).rejects.toThrow(
      /NDIA_TOKEN_FETCH_DISABLED/,
    );
  });

  it("blocks invented path even when configured via env", async () => {
    process.env.NDIA_PROVIDER_CLAIM_SUBMIT_PATH = "/v1/provider/claims";
    await expect(submitProviderClaimToNdia(samplePayload)).rejects.toThrow(
      NdiaAuthorisedTransportNotImplementedError,
    );
  });
});

describe("NDIA trust boundaries", () => {
  it("lists separate agencies", () => {
    const boundaries = describeTrustBoundaries();
    expect(boundaries.thisBoundary).toBe("ndia_provider_api");
    expect(boundaries.mustRemainSeparate).toContain(
      "dohda_aged_care_b2g",
    );
    expect(boundaries.mustRemainSeparate).toContain(
      "adha_fhir_my_health_record",
    );
    expect(boundaries.mustRemainSeparate).toContain(
      "ndis_commission_registration_screening",
    );
  });

  it("rejects cross-boundary source references", () => {
    expect(() =>
      assertNdiaTrustBoundarySource('import "lib/integrations/dohda-b2g"'),
    ).toThrow(/NDIA_TRUST_BOUNDARY_VIOLATION/);
    expect(() =>
      assertNdiaTrustBoundarySource('from "@/lib/fhir/medplum-adapter"'),
    ).toThrow(/NDIA_TRUST_BOUNDARY_VIOLATION/);
  });
});

describe("NDIA idempotency", () => {
  it("builds stable keys and detects duplicates", () => {
    const a = buildClaimIdempotencyKey("org_1", samplePayload);
    const b = buildClaimIdempotencyKey("org_1", samplePayload);
    expect(a).toBe(b);
    expect(isDuplicateIdempotencyKey(a, b)).toBe(true);
    expect(isDuplicateIdempotencyKey(null, a)).toBe(false);
  });
});

describe("NDIA claim-service security gates", () => {
  const auditMock = vi.fn(async () => undefined);
  const claimAuditMock = vi.fn(async () => ({ id: "ca1" }));

  const claimRow = {
    id: "claim_1",
    organisationId: "org_1",
    participantId: "user_1",
    status: "validated" as const,
    claimPayloadJson: samplePayload,
    externalClaimId: null as string | null,
    externalStatus: null as string | null,
    legacyInvoiceId: null,
    billingInvoiceId: null,
    ndisRegistrationNumber: "4050000001",
    createdById: "actor_1",
  };

  beforeEach(() => {
    vi.resetModules();
    vi.doMock("@/lib/prisma", () => ({
      prisma: {
        ndiaProviderClaim: {
          findUnique: vi.fn(async () => ({ ...claimRow })),
          update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
            ...claimRow,
            ...data,
          })),
        },
        ndiaProviderClaimAudit: {
          create: claimAuditMock,
        },
        ndiaPilotApprovalRecord: {
          findFirst: vi.fn(async () => ({
            id: "apr_1",
            approved: true,
            approvedAt: new Date(),
          })),
        },
        invoice: { update: vi.fn() },
        billingInvoice: { update: vi.fn() },
      },
    }));
    vi.doMock("@/lib/audit/audit-event-service", () => ({
      createAuditEvent: auditMock,
    }));
    vi.doMock("@/lib/api/organisation-scope", () => ({
      getUserOrganisationIds: vi.fn(async () => ["org_1"]),
    }));
    vi.doMock("@/lib/consent/consent-service", () => ({
      checkConsent: vi.fn(async () => true),
    }));
    vi.doMock("@/lib/ndis/provider-claiming/validate", () => ({
      hasBlockingFindings: () => false,
      validateClaimPayload: vi.fn(async () => []),
      validateFundingForProviderClaim: () => [],
      mapBillingFundingType: (v: string) => v,
    }));
    process.env.NDIS_CLAIM_SUBMISSION_ENABLED = "true";
    process.env.NDIA_REAL_SUBMISSION_ENABLED = "false";
    process.env.NDIA_PROVIDER_ADAPTER_MODE = "mock";
    delete process.env.NDIA_PROVIDER_CLAIM_SUBMIT_PATH;
    auditMock.mockClear();
    claimAuditMock.mockClear();
  });

  afterEach(() => {
    vi.unmock("@/lib/prisma");
    vi.unmock("@/lib/audit/audit-event-service");
    vi.unmock("@/lib/api/organisation-scope");
    vi.unmock("@/lib/consent/consent-service");
    vi.unmock("@/lib/ndis/provider-claiming/validate");
    delete process.env.NDIS_CLAIM_SUBMISSION_ENABLED;
    delete process.env.NDIA_REAL_SUBMISSION_ENABLED;
    delete process.env.NDIA_PROVIDER_ADAPTER_MODE;
  });

  it("records synthetic validation without Prisma submitted", async () => {
    const { submitProviderClaim } = await import(
      "@/lib/ndis/provider-claiming/claim-service"
    );
    const user = {
      id: "actor_1",
      primaryRole: "provider_admin",
    } as never;

    const result = await submitProviderClaim("claim_1", user);
    expect(result.submitResult.notSubmitted).toBe(true);
    expect(result.claim.status).toBe("dry_run_passed");
    expect(result.claim.status).not.toBe("submitted");
    expect(result.claim.submittedAt).toBeNull();
    expect(result.disclaimer).toMatch(/not sent to NDIA/i);
  });

  it("denies missing consent without lawful authority", async () => {
    vi.resetModules();
    vi.doMock("@/lib/prisma", () => ({
      prisma: {
        ndiaProviderClaim: {
          findUnique: vi.fn(async () => ({ ...claimRow })),
          update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
            ...claimRow,
            ...data,
          })),
        },
        ndiaProviderClaimAudit: { create: claimAuditMock },
        ndiaPilotApprovalRecord: {
          findFirst: vi.fn(async () => ({
            id: "apr_1",
            approved: true,
            approvedAt: new Date(),
          })),
        },
        invoice: { update: vi.fn() },
        billingInvoice: { update: vi.fn() },
      },
    }));
    vi.doMock("@/lib/audit/audit-event-service", () => ({
      createAuditEvent: auditMock,
    }));
    vi.doMock("@/lib/api/organisation-scope", () => ({
      getUserOrganisationIds: vi.fn(async () => ["org_1"]),
    }));
    vi.doMock("@/lib/consent/consent-service", () => ({
      checkConsent: vi.fn(async () => false),
    }));
    vi.doMock("@/lib/ndis/provider-claiming/validate", () => ({
      hasBlockingFindings: () => false,
      validateClaimPayload: vi.fn(async () => []),
      validateFundingForProviderClaim: () => [],
      mapBillingFundingType: (v: string) => v,
    }));
    const { submitProviderClaim, NdiaClaimAuthorityError } = await import(
      "@/lib/ndis/provider-claiming/claim-service"
    );
    const user = {
      id: "actor_1",
      primaryRole: "provider_admin",
    } as never;

    await expect(submitProviderClaim("claim_1", user)).rejects.toBeInstanceOf(
      NdiaClaimAuthorityError,
    );
  });

  it("blocks live flag path without network", async () => {
    process.env.NDIA_REAL_SUBMISSION_ENABLED = "true";
    process.env.NDIA_PROVIDER_ADAPTER_MODE = "http";
    process.env.NDIA_PROVIDER_API_BASE_URL = "https://example.invalid";
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { submitProviderClaim } = await import(
      "@/lib/ndis/provider-claiming/claim-service"
    );
    const user = {
      id: "actor_1",
      primaryRole: "provider_admin",
    } as never;

    await expect(submitProviderClaim("claim_1", user)).rejects.toThrow(
      /NDIA_AUTHORISED_TRANSPORT_NOT_IMPLEMENTED/,
    );
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("denies cross-tenant claim access", async () => {
    const { getProviderClaimForOrg } = await import(
      "@/lib/ndis/provider-claiming/claim-service"
    );
    const user = {
      id: "actor_1",
      primaryRole: "mapable_admin",
    } as never;
    await expect(
      getProviderClaimForOrg(user, "claim_1", "org_other"),
    ).rejects.toThrow(/Cross-tenant/);
  });
});
