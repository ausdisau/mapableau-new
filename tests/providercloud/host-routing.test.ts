import { describe, expect, it } from "vitest";

import {
  DEFAULT_PROVIDERCLOUD_HOST,
  isProviderCloudHost,
  isProviderCloudSupplierPath,
  providerCloudRewritePath,
} from "@/lib/providercloud/host-routing";

describe("ProviderCloud host routing", () => {
  it("recognises the cloud subdomain from forwarded host", () => {
    expect(isProviderCloudHost("cloud.mapable.com.au", "mapable.com.au")).toBe(
      true,
    );
  });

  it("recognises the cloud subdomain from host when forwarded host is absent", () => {
    expect(isProviderCloudHost(null, `${DEFAULT_PROVIDERCLOUD_HOST}:443`)).toBe(
      true,
    );
  });

  it("does not route the main MapAble host into ProviderCloud", () => {
    expect(isProviderCloudHost("mapable.com.au", "mapable.com.au")).toBe(false);
  });

  it("rewrites the cloud host root to the ProviderCloud surface", () => {
    expect(providerCloudRewritePath("/")).toBe("/providercloud");
  });

  it("does not double-prefix explicit ProviderCloud routes", () => {
    expect(providerCloudRewritePath("/providercloud")).toBeNull();
  });

  it("does not rewrite APIs, auth, or the existing provider console", () => {
    expect(providerCloudRewritePath("/api/providercloud/status")).toBeNull();
    expect(providerCloudRewritePath("/login")).toBeNull();
    expect(providerCloudRewritePath("/provider/care")).toBeNull();
    expect(providerCloudRewritePath("/provider-ops")).toBeNull();
    expect(providerCloudRewritePath("/robots.txt")).toBeNull();
  });

  it("identifies grocery supplier paths as disabled supplier operations", () => {
    expect(isProviderCloudSupplierPath("/api/grocery/supplier/sync")).toBe(
      true,
    );
    expect(isProviderCloudSupplierPath("/api/grocery/supplier/status")).toBe(
      true,
    );
    expect(isProviderCloudSupplierPath("/api/providercloud/status")).toBe(
      false,
    );
  });
});
