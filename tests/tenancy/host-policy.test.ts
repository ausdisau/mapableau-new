import { describe, expect, it } from "vitest";

import {
  isProposedCoverageCareHost,
  isReservedTenantLabel,
  resolveTenantHost,
} from "@/lib/tenancy/tenant-host-policy";

describe("tenant host policy", () => {
  it("allow-lists only the proposed Coverage Care host", () => {
    expect(resolveTenantHost(null, "coveragecare.mapable.com.au")).toEqual({
      kind: "proposed_tenant",
      host: "coveragecare.mapable.com.au",
      slug: "coveragecare",
    });
    expect(isProposedCoverageCareHost(null, "coveragecare.mapable.com.au")).toBe(
      true,
    );
  });

  it("marks reserved subdomain labels", () => {
    expect(resolveTenantHost(null, "auth.mapable.com.au").kind).toBe("reserved");
    expect(resolveTenantHost(null, "admin.mapable.com.au").kind).toBe("reserved");
    expect(resolveTenantHost(null, "peer.mapable.com.au").kind).toBe("reserved");
    expect(isReservedTenantLabel("api")).toBe(true);
  });

  it("treats forged and unknown hosts as non-activating", () => {
    expect(resolveTenantHost(null, "evil.example.com").kind).toBe("unknown");
    expect(resolveTenantHost(null, "coveragecare.evil.com").kind).toBe("unknown");
    expect(resolveTenantHost(null, "mapable.com.au").kind).toBe("unknown");
    expect(isProposedCoverageCareHost(null, "mapable.com.au")).toBe(false);
  });
});
