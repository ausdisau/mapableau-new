import { describe, expect, it } from "vitest";

// We test only the pure preconditions of the break-glass service without a DB.
// The service throws BreakGlassPolicyError before any DB call when input is bad.
import { BreakGlassPolicyError, requestBreakGlass } from "@/lib/tenancy/access/break-glass-service";

describe("break-glass policy (Wave 8)", () => {
  it("rejects too-short reason before touching the DB", async () => {
    await expect(
      requestBreakGlass({
        actorUserId: "u1",
        targetOrganisationId: "org_1",
        reason: "short",
        expiresInMinutes: 60,
      })
    ).rejects.toThrow(BreakGlassPolicyError);
  });

  it("rejects out-of-range expiry", async () => {
    await expect(
      requestBreakGlass({
        actorUserId: "u1",
        targetOrganisationId: "org_1",
        reason: "This is a long enough reason for testing policy checks.",
        expiresInMinutes: 24 * 60,
      })
    ).rejects.toThrow(/BREAK_GLASS_EXPIRY_OUT_OF_RANGE/);
  });
});
