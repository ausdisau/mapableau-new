import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { ndiaApiAdapter } from "@/lib/ndis/claiming/adapters/NdiaApiAdapter";
import { ndiaApiAdapterStub } from "@/lib/ndis/claiming/adapters/NdiaApiAdapter.stub";
import { mapBatchClaimToNdiaRequest } from "@/lib/ndia/shared/ndia-payload-mapper";
import {
  fundingSourceToPaymentRoute,
  paymentRouteRequiresMyProviderCheck,
  paymentRouteUsesBulkExport,
} from "@/lib/ndis/claiming/paymentRoute";
import { checksumExport } from "@/lib/ndis/claiming/exporters/bulkPaymentRequestExporter";
import { FUNDING_ROUTE_LABELS } from "@/lib/ndis/claiming/types";
import { verifyParticipantNdisNumber } from "@/lib/ndia/participant-api-client";
import { resetNdiaTokenCacheForTests } from "@/lib/ndia/shared/ndia-http-client";

describe("NDIS payment routes", () => {
  it("maps funding source types", () => {
    expect(fundingSourceToPaymentRoute("ndis_self_managed")).toBe("self_managed");
    expect(fundingSourceToPaymentRoute("ndis_plan_managed")).toBe("plan_managed");
    expect(fundingSourceToPaymentRoute("ndis_agency_managed")).toBe("ndia_managed");
    expect(fundingSourceToPaymentRoute("private_pay")).toBeNull();
  });

  it("flags NDIA-managed bulk export and my provider checks", () => {
    expect(paymentRouteUsesBulkExport("ndia_managed")).toBe(true);
    expect(paymentRouteRequiresMyProviderCheck("ndia_managed")).toBe(true);
    expect(paymentRouteRequiresMyProviderCheck("self_managed")).toBe(false);
  });

  it("has plain-language route labels", () => {
    expect(FUNDING_ROUTE_LABELS.ndia_managed).toContain("NDIA");
  });
});

describe("bulk export checksum", () => {
  it("is stable for identical content", () => {
    const a = checksumExport("a,b\n1,2");
    const b = checksumExport("a,b\n1,2");
    expect(a).toBe(b);
  });
});

describe("NDIA API adapter stub", () => {
  it("throws when not configured", async () => {
    await expect(ndiaApiAdapterStub.submitClaimBatch("batch-1")).rejects.toThrow(
      "NDIA API access not configured"
    );
  });
});

describe("NDIA batch payload mapping", () => {
  it("maps batch lines to NDIA request body", () => {
    const body = mapBatchClaimToNdiaRequest({
      batchReference: "BATCH-1",
      providerRegistrationNumber: "4050000001",
      organisationId: "org1",
      organisationName: "Provider Co",
      lines: [
        {
          participantNumber: "430000000",
          participantName: "Alex",
          supportItemCode: "01_011_0107_1_1",
          supportDescription: "Personal care",
          serviceStartDate: "2026-01-01",
          serviceEndDate: "2026-01-01",
          quantity: 2,
          unitPriceCents: 6500,
          totalAmountCents: 13000,
          claimReference: "line-1",
        },
      ],
    });

    expect(body.claimType).toBe("registered_provider_batch");
    expect(body.batchReference).toBe("BATCH-1");
  });
});

describe("NDIA API adapter without live credentials", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("NDIS_CLAIM_SUBMISSION_ENABLED", "false");
    vi.stubEnv("NDIA_REAL_SUBMISSION_ENABLED", "false");
    resetNdiaTokenCacheForTests();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    resetNdiaTokenCacheForTests();
  });

  it("rejects batch submit when live mode disabled", async () => {
    await expect(ndiaApiAdapter.submitClaimBatch("batch-1")).rejects.toThrow(
      "NDIA live submit not configured"
    );
  });
});

describe("participant verification scaffold", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("NDIA_PARTICIPANT_API_ENABLED", "false");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns mock verification when API disabled", async () => {
    const result = await verifyParticipantNdisNumber("430000000");
    expect(result.mode).toBe("mock");
    expect(result.valid).toBe(true);
  });
});
