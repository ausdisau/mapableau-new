import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  AUSPOST_PAC_OPERATIONS,
  auspostPacJsonError,
} from "@/lib/auspost-pac/api-contract";
import { clearAuspostPacClientCache } from "@/lib/auspost-pac/client";
import {
  AusPostPacApiError,
  auspostPacErrorResponse,
} from "@/lib/auspost-pac/auspost-pac-api-error";
import {
  normalizeDomesticCalculateResponse,
  normalizePostcodeSearchResponse,
} from "@/lib/auspost-pac/normalize";
import { searchPostcodes } from "@/lib/auspost-pac/postcode-search-service";

describe("AusPost PAC API contract", () => {
  it("returns structured error with operationId header", async () => {
    const res = auspostPacJsonError(AUSPOST_PAC_OPERATIONS.postcodeSearch, 429, {
      error: "Too many requests",
      code: "RATE_LIMITED",
      retryable: true,
    });
    expect(res.status).toBe(429);
    expect(res.headers.get("X-Operation-Id")).toBe("auspostPostcodeSearch");
    const body = (await res.json()) as {
      operationId: string;
      code: string;
      retryable: boolean;
    };
    expect(body.operationId).toBe("auspostPostcodeSearch");
    expect(body.code).toBe("RATE_LIMITED");
    expect(body.retryable).toBe(true);
  });

  it("maps AusPostPacApiError to contract body", async () => {
    const res = auspostPacErrorResponse(
      new AusPostPacApiError("AUSPOST_PAC_NOT_CONFIGURED"),
      AUSPOST_PAC_OPERATIONS.domesticParcelCalculate,
    );
    expect(res.status).toBe(503);
    const body = (await res.json()) as { operationId: string; code: string };
    expect(body.operationId).toBe("auspostDomesticParcelCalculate");
    expect(body.code).toBe("AUSPOST_PAC_NOT_CONFIGURED");
  });
});

describe("AusPost PAC normalize", () => {
  it("normalizes single locality object", () => {
    const result = normalizePostcodeSearchResponse({
      localities: {
        locality: {
          location: "MELBOURNE",
          state: "VIC",
          postcode: "3000",
        },
      },
    });
    expect(result.localities).toHaveLength(1);
    expect(result.localities[0]).toMatchObject({
      location: "MELBOURNE",
      state: "VIC",
      postcode: "3000",
    });
  });

  it("normalizes locality array", () => {
    const result = normalizePostcodeSearchResponse({
      localities: {
        locality: [
          { location: "SYDNEY", state: "NSW", postcode: "2000" },
          { location: "PARRAMATTA", state: "NSW", postcode: "2150" },
        ],
      },
    });
    expect(result.localities).toHaveLength(2);
  });

  it("normalizes domestic calculate response", () => {
    const result = normalizeDomesticCalculateResponse({
      postage_result: {
        service: "Parcel Post",
        delivery_time: "2-6 business days",
        total_cost: "12.50",
        costs: {
          cost: { item: "Parcel Post", cost: "12.50" },
        },
      },
    });
    expect(result?.totalCost).toBe("12.50");
    expect(result?.costs[0]?.item).toBe("Parcel Post");
  });
});

describe("AusPost PAC client", () => {
  beforeEach(() => {
    vi.stubEnv("AUSPOST_PAC_API_KEY", "test-key-32charsxxxxxxxxxxxxxxx");
    vi.stubEnv("AUSPOST_PAC_ENABLED", "true");
    clearAuspostPacClientCache();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    clearAuspostPacClientCache();
  });

  it("throws when API key is missing", async () => {
    vi.stubEnv("AUSPOST_PAC_API_KEY", "");
    await expect(searchPostcodes({ q: "3000" })).rejects.toMatchObject({
      code: "AUSPOST_PAC_NOT_CONFIGURED",
    });
  });

  it("calls postcode search with AUTH-KEY header", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          localities: {
            locality: { location: "MELBOURNE", state: "VIC", postcode: "3000" },
          },
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await searchPostcodes({ q: "Melbourne", state: "VIC" });
    expect(result.localities[0]?.postcode).toBe("3000");
    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)["AUTH-KEY"]).toBe(
      "test-key-32charsxxxxxxxxxxxxxxx",
    );
  });
});
