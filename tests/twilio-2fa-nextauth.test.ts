import { afterEach, describe, expect, it, vi } from "vitest";

describe("Twilio 2FA login gate", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("rejects password-only login start when Twilio 2FA is enabled and password is invalid", async () => {
    vi.stubEnv("TWILIO_2FA_ENABLED", "true");
    vi.stubEnv("TWILIO_ACCOUNT_SID", "ACtest");
    vi.stubEnv("TWILIO_AUTH_TOKEN", "token");
    vi.stubEnv("TWILIO_VERIFY_SERVICE_SID", "VATEST");
    vi.resetModules();

    vi.doMock("@/lib/auth/supabase-credentials", () => ({
      verifySupabasePassword: vi.fn().mockResolvedValue(false),
    }));
    vi.doMock("@/lib/prisma", () => ({
      prisma: {
        user: {
          findUnique: vi.fn().mockResolvedValue({
            id: "u1",
            phone: "+61400000000",
          }),
        },
      },
    }));

    const { POST } = await import("@/app/api/auth/twilio-2fa/start/route");
    const response = await POST(
      new Request("http://localhost/api/auth/twilio-2fa/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "participant@example.com",
          password: "password123",
        }),
      }),
    );

    expect(response.status).toBe(401);
  });
});
