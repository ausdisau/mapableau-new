import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { normalizeE164Phone } from "@/lib/uber/guest";

describe("Uber SDK configuration", () => {
  it("is not configured without credentials in test env", async () => {
    const { isUberIntegrationEnabled, isUberSdkConfigured } = await import(
      "@/lib/uber/config"
    );
    expect(isUberSdkConfigured()).toBe(false);
    expect(isUberIntegrationEnabled()).toBe(false);
  });
});

describe("normalizeE164Phone", () => {
  it("normalizes Australian local numbers", () => {
    expect(normalizeE164Phone("0412 345 678")).toBe("+61412345678");
  });

  it("preserves existing E.164", () => {
    expect(normalizeE164Phone("+61412345678")).toBe("+61412345678");
  });
});

describe("UberClient", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetModules();
    process.env.UBER_CLIENT_ID = "test-client";
    process.env.UBER_CLIENT_SECRET = "test-secret";
    process.env.UBER_ORGANIZATION_UUID = "org-uuid";
    process.env.UBER_ENABLED = "true";
    process.env.UBER_USE_SANDBOX = "false";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.UBER_CLIENT_ID;
    delete process.env.UBER_CLIENT_SECRET;
    delete process.env.UBER_ORGANIZATION_UUID;
    delete process.env.UBER_ENABLED;
    delete process.env.UBER_USE_SANDBOX;
    vi.resetModules();
  });

  it("obtains OAuth token and calls guest trip estimates", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/oauth/v2/token")) {
        return new Response(
          JSON.stringify({ access_token: "tok_abc", expires_in: 3600 }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (url.includes("/v1/guests/trips/estimates") && init?.method === "POST") {
        const headers = new Headers(init.headers);
        expect(headers.get("Authorization")).toBe("Bearer tok_abc");
        expect(headers.get("x-uber-organizationuuid")).toBe("org-uuid");
        return new Response(
          JSON.stringify({ product_estimates: [{ product_id: "p1" }] }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response("not found", { status: 404 });
    });
    global.fetch = fetchMock as typeof fetch;

    const { UberClient } = await import("@/lib/uber/client");
    const { clearUberTokenCache } = await import("@/lib/uber/oauth");
    clearUberTokenCache();
    const client = new UberClient();
    const result = await client.getTripEstimates({
      pickup: { latitude: -33.87, longitude: 151.21 },
      dropoff: { latitude: -33.89, longitude: 151.25 },
    });

    expect(result.product_estimates?.[0]?.product_id).toBe("p1");
    expect(fetchMock).toHaveBeenCalled();
  });

  it("throws when credentials are missing", async () => {
    delete process.env.UBER_CLIENT_ID;
    const { UberClient } = await import("@/lib/uber/client");
    const client = new UberClient();
    await expect(
      client.getTripEstimates({
        pickup: { latitude: 0, longitude: 0 },
        dropoff: { latitude: 1, longitude: 1 },
      })
    ).rejects.toMatchObject({ code: "UBER_NOT_CONFIGURED" });
  });
});
