import { describe, expect, it } from "vitest";

import {
  DEFAULT_LABS_HOST,
  isLabsHost,
  labsRewritePath,
} from "@/lib/labs/host-routing";

describe("MapAble Labs host routing", () => {
  it("recognises the Labs subdomain from forwarded host", () => {
    expect(isLabsHost("labs.mapable.com.au", "mapable.com.au")).toBe(true);
  });

  it("recognises the Labs subdomain from host when forwarded host is absent", () => {
    expect(isLabsHost(null, `${DEFAULT_LABS_HOST}:443`)).toBe(true);
  });

  it("does not route the main MapAble host into Labs", () => {
    expect(isLabsHost("mapable.com.au", "mapable.com.au")).toBe(false);
  });

  it("rewrites the Labs host root to the Labs application", () => {
    expect(labsRewritePath("/")).toBe("/labs");
  });

  it("rewrites clean Labs subdomain paths into the Labs route group", () => {
    expect(labsRewritePath("/mobility-futures")).toBe(
      "/labs/mobility-futures",
    );
  });

  it("does not double-prefix explicit Labs routes", () => {
    expect(labsRewritePath("/labs/mobility-futures")).toBeNull();
  });

  it("does not rewrite API requests or static files", () => {
    expect(labsRewritePath("/api/health")).toBeNull();
    expect(labsRewritePath("/images/mapable.svg")).toBeNull();
    expect(labsRewritePath("/robots.txt")).toBeNull();
  });
});
