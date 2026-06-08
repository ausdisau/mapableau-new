import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import type { NdiaProviderClaimPayload } from "@/lib/ndia-provider-claiming/types";
import {
  mapBillingFundingType,
  validateFundingForProviderClaim,
  hasBlockingFindings,
} from "@/lib/ndia-provider-claiming/validate";
import { mapExternalStatusToClaimStatus } from "@/lib/ndia-provider-claiming/status-mapper";
import {
  classifyNdiaHttpError,
  NdiaApiError,
} from "@/lib/ndia/shared/ndia-errors";
import {
  mapNdiaSubmitResponse,
  mapProviderClaimToNdiaRequest,
} from "@/lib/ndia/shared/ndia-payload-mapper";
import {
  resetNdiaTokenCacheForTests,
  submitProviderClaimPayload,
} from "@/lib/ndia/shared/ndia-http-client";

const samplePayload: NdiaProviderClaimPayload = {
  claimType: "registered_provider",
  provider: {
    abn: "123",
    ndisRegistrationNumber: "4050000001",
    organisationId: "org1",
    name: "Test Provider",
  },
  participant: {
    ndisNumber: "430000000",
    ndisNumberMasked: "****0000",
    mapableUserId: "user1",
  },
  invoiceReference: { mapableLegacyInvoiceId: "inv1" },
  servicePeriod: { start: "2026-01-01", end: "2026-01-31" },
  lines: [
    {
      lineNumber: 1,
      supportItemCode: "01_011_0107_1_1",
      description: "Personal care",
      serviceDate: "2026-01-15",
      quantity: 2,
      unitPriceCents: 6500,
      totalCents: 13000,
      gstIncluded: false,
    },
  ],
  totals: {
    subtotalCents: 13000,
    taxCents: 0,
    totalCents: 13000,
    currency: "AUD",
  },
  metadata: { builtAt: new Date().toISOString(), mapableVersion: "1" },
};

describe("registered provider funding rules", () => {
  it("blocks plan-managed claims", () => {
    const findings = validateFundingForProviderClaim("ndis_plan_managed");
    expect(hasBlockingFindings(findings)).toBe(true);
    expect(findings.some((f) => f.code === "plan_managed")).toBe(true);
  });

  it("allows agency-managed with guidance", () => {
    const findings = validateFundingForProviderClaim("ndis_agency_managed");
    expect(hasBlockingFindings(findings)).toBe(false);
  });

  it("maps billing funding types", () => {
    expect(mapBillingFundingType("ndis_plan_managed")).toBe("ndis_plan_managed");
    expect(mapBillingFundingType("private_card")).toBe("ndis_agency_managed");
  });
});

describe("claim payload shape", () => {
  it("includes registered provider metadata", () => {
    expect(samplePayload.claimType).toBe("registered_provider");
    expect(samplePayload.lines).toHaveLength(1);
  });

  it("maps to NDIA request body with support item numbers", () => {
    const mapped = mapProviderClaimToNdiaRequest(samplePayload);
    expect(mapped.claimType).toBe("registered_provider");
    const lineItems = mapped.lineItems as Array<Record<string, unknown>>;
    expect(lineItems[0]?.supportItemNumber).toBe("01_011_0107_1_1");
    expect(lineItems[0]?.unitPrice).toBe(65);
  });
});

describe("NDIA error taxonomy", () => {
  it("classifies auth errors", () => {
    const err = classifyNdiaHttpError(401, { message: "Unauthorized" });
    expect(err).toBeInstanceOf(NdiaApiError);
    expect(err.category).toBe("auth");
  });

  it("classifies duplicate errors", () => {
    const err = classifyNdiaHttpError(409, { code: "DUPLICATE" });
    expect(err.category).toBe("duplicate");
  });

  it("maps external statuses", () => {
    expect(mapExternalStatusToClaimStatus("paid")).toBe("paid");
    expect(mapExternalStatusToClaimStatus("declined")).toBe("rejected");
  });
});

describe("NDIA response mapping", () => {
  it("extracts claim id and status from response", () => {
    const mapped = mapNdiaSubmitResponse({
      claimId: "NDIA-123",
      status: "accepted",
    });
    expect(mapped.externalClaimId).toBe("NDIA-123");
    expect(mapped.externalStatus).toBe("accepted");
  });
});

describe("NDIA HTTP client (mock mode)", () => {
  beforeEach(() => {
    resetNdiaTokenCacheForTests();
    vi.unstubAllEnvs();
    vi.stubEnv("NDIS_CLAIM_SUBMISSION_ENABLED", "false");
    vi.stubEnv("NDIA_REAL_SUBMISSION_ENABLED", "false");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    resetNdiaTokenCacheForTests();
  });

  it("returns mock submit result when live submit disabled", async () => {
    const result = await submitProviderClaimPayload(samplePayload);
    expect(result.mode).toBe("mock");
    expect(result.externalClaimId).toMatch(/^ndia_mock_/);
    expect(result.externalStatus).toBe("submitted_mock");
  });
});

describe("NDIA HTTP client (live mode with mocked fetch)", () => {
  beforeEach(() => {
    resetNdiaTokenCacheForTests();
    vi.unstubAllEnvs();
    vi.stubEnv("NDIS_CLAIM_SUBMISSION_ENABLED", "true");
    vi.stubEnv("NDIA_REAL_SUBMISSION_ENABLED", "true");
    vi.stubEnv("NDIA_PROVIDER_ADAPTER_MODE", "http");
    vi.stubEnv("NDIA_PROVIDER_API_BASE_URL", "https://api.ndia.test");
    vi.stubEnv("NDIA_PROVIDER_TOKEN_URL", "https://api.ndia.test/oauth/token");
    vi.stubEnv("NDIA_PROVIDER_API_CLIENT_ID", "client");
    vi.stubEnv("NDIA_PROVIDER_API_CLIENT_SECRET", "secret");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    resetNdiaTokenCacheForTests();
  });

  it("submits claim over HTTP when configured", async () => {
    const fetchMock = vi.fn(async (url: string | URL | Request) => {
      const href = String(url);
      if (href.includes("/oauth/token")) {
        return new Response(
          JSON.stringify({ access_token: "token-abc", expires_in: 3600 }),
          { status: 200 }
        );
      }
      return new Response(
        JSON.stringify({ claimId: "NDIA-999", status: "submitted" }),
        { status: 200 }
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await submitProviderClaimPayload(samplePayload);
    expect(result.mode).toBe("http");
    expect(result.externalClaimId).toBe("NDIA-999");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws structured error on submit failure", async () => {
    const fetchMock = vi.fn(async (url: string | URL | Request) => {
      const href = String(url);
      if (href.includes("/oauth/token")) {
        return new Response(
          JSON.stringify({ access_token: "token-abc", expires_in: 3600 }),
          { status: 200 }
        );
      }
      return new Response(
        JSON.stringify({ message: "Invalid line item", code: "VALIDATION" }),
        { status: 422 }
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(submitProviderClaimPayload(samplePayload)).rejects.toMatchObject({
      category: "validation",
    });
  });
});
