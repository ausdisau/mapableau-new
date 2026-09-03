import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/ip-rate-limit", () => ({
  checkIpRateLimit: () => true,
  getClientIp: () => "127.0.0.1",
}));

describe("mobile tokens + bootstrap", () => {
  const prev = { ...process.env };

  beforeEach(() => {
    process.env.MAPABLE_MOBILE_API_ENABLED = "true";
    process.env.MAPABLE_MOBILE_AUTH_EXCHANGE_ENABLED = "true";
    process.env.MAPABLE_MOBILE_TOKEN_SECRET = "test-mobile-secret-not-for-prod-32";
    process.env.NEXTAUTH_SECRET = "ci-nextauth-secret-not-for-production-use-32chars";
    process.env.NEXT_PUBLIC_APP_URL = "https://mapable.com.au";
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...prev };
  });

  it("mints and verifies access tokens", async () => {
    const { mintMobileToken, verifyMobileToken } = await import(
      "@/lib/mobile/tokens"
    );
    const minted = mintMobileToken({
      sub: "user_1",
      email: "a@example.com",
      primaryRole: "participant",
      typ: "access",
      ttlSeconds: 60,
    });
    const claims = verifyMobileToken(minted.token, "access");
    expect(claims?.sub).toBe("user_1");
    expect(claims?.email).toBe("a@example.com");
  });

  it("GET /api/mobile/bootstrap returns flags when enabled", async () => {
    const { GET } = await import("@/app/api/mobile/bootstrap/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.apiBaseUrl).toBe("https://mapable.com.au");
    expect(body.featureFlags.mobileApiEnabled).toBe(true);
    expect(body.maps.googleMapsForAccess).toBe(false);
    expect(body.redis.clientAccess).toBe("forbidden");
    expect(body.realtimeMode).toBe("polling");
  });

  it("GET /api/mobile/bootstrap is 503 when disabled", async () => {
    process.env.MAPABLE_MOBILE_API_ENABLED = "false";
    vi.resetModules();
    const { GET } = await import("@/app/api/mobile/bootstrap/route");
    const res = await GET();
    expect(res.status).toBe(503);
  });

  it("integrity verify uses risk fallback when attestation missing", async () => {
    const { verifyPlayIntegrityAttestation } = await import(
      "@/lib/mobile/integrity"
    );
    process.env.MAPABLE_MOBILE_INTEGRITY_ENABLED = "true";
    const result = verifyPlayIntegrityAttestation({ attestationToken: null });
    expect(result.acceptable).toBe(true);
    expect(result.reason).toContain("fallback");
  });
});
