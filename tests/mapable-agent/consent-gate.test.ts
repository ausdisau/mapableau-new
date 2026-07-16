import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/consent/consent-service", () => ({
  checkConsent: vi.fn(),
}));

import { checkConsent } from "@/lib/consent/consent-service";
import { checkConsentGate } from "@/lib/mapable-agent/consent-gate";

describe("consent gate", () => {
  beforeEach(() => {
    vi.mocked(checkConsent).mockReset();
  });

  it("allows when no participant or scopes", async () => {
    const result = await checkConsentGate({});
    expect(result).toEqual({ allowed: true });
  });

  it("blocks when consent missing", async () => {
    vi.mocked(checkConsent).mockResolvedValue(false);
    const result = await checkConsentGate({
      participantId: "user-1",
      scopes: ["profile.read"],
    });
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.requiredConfirmations[0]?.type).toBe("CONSENT_CONFIRMATION");
    }
  });

  it("allows when all scopes granted", async () => {
    vi.mocked(checkConsent).mockResolvedValue(true);
    const result = await checkConsentGate({
      participantId: "user-1",
      scopes: ["profile.read"],
    });
    expect(result).toEqual({ allowed: true });
  });
});
