import { describe, expect, it } from "vitest";

import { buildIssuerMetadata } from "@/lib/federation-conformance/oid4vci";
import { buildVpProfile } from "@/lib/federation-conformance/oid4vp";

describe("OID4VCI issuer metadata", () => {
  it("advertises simulator when activation is off", () => {
    const previous = process.env.FEDERATION_ACTIVATION;
    delete process.env.FEDERATION_ACTIVATION;
    const meta = buildIssuerMetadata({
      publicOrigin: "https://issuer.example",
      schemaKeys: ["AccessibilityPassportSummary"],
    });
    expect(meta.simulator).toBe(true);
    expect(meta.disclaimer.toLowerCase()).toContain("not government");
    if (previous !== undefined) process.env.FEDERATION_ACTIVATION = previous;
  });

  it("includes each supplied schema in supported credentials", () => {
    const meta = buildIssuerMetadata({
      publicOrigin: "https://issuer.example",
      schemaKeys: ["Access", "Booking"],
    });
    expect(meta.supported_credentials).toHaveLength(2);
    expect(meta.supported_credentials[0].scope).toBe("credential:Access");
  });
});

describe("OID4VP profile", () => {
  it("is simulator by default and mentions trust-registry requirement", () => {
    const previous = process.env.FEDERATION_ACTIVATION;
    delete process.env.FEDERATION_ACTIVATION;
    const profile = buildVpProfile();
    expect(profile.simulator).toBe(true);
    expect(profile.disclaimer.toLowerCase()).toContain("trust-registry");
    if (previous !== undefined) process.env.FEDERATION_ACTIVATION = previous;
  });
});
