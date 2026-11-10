import { describe, expect, it } from "vitest";

import {
  ACCESSIMART_SUBDOMAIN,
  CARE_SUBDOMAIN,
  ECOSYSTEM_SUBDOMAIN,
  EMPLOYMENT_SUBDOMAIN,
  MARKETPLACE_SUBDOMAIN,
  TRANSPORT_SUBDOMAIN,
  listProgrammeSubdomainHosts,
  matchProgrammeSubdomainRewrite,
} from "@/lib/platform/mapable-subdomain-registry";
import { rewriteSubdomainPath } from "@/lib/platform/subdomain-route-adapter";

describe("MapAble programme subdomain registry", () => {
  it("lists default programme hosts and path prefixes", () => {
    const hosts = listProgrammeSubdomainHosts({});
    expect(hosts).toEqual(
      expect.arrayContaining([
        {
          id: "accessimart",
          host: "accessimart.mapable.com.au",
          pathPrefix: "/marketplace",
        },
        {
          id: "marketplace",
          host: "marketplace.mapable.com.au",
          pathPrefix: "/marketplace",
        },
        {
          id: "ecosystem",
          host: "ecosystem.mapable.com.au",
          pathPrefix: "/ecosystem",
        },
        { id: "care", host: "care.mapable.com.au", pathPrefix: "/care" },
        {
          id: "transport",
          host: "transport.mapable.com.au",
          pathPrefix: "/transport",
        },
        {
          id: "employment",
          host: "employment.mapable.com.au",
          pathPrefix: "/employment",
        },
        { id: "signal", host: "signal.mapable.com.au", pathPrefix: "/signal" },
      ]),
    );
  });

  it("rewrites AccessiMart root to the public Marketplace programme (option 1)", () => {
    expect(rewriteSubdomainPath(ACCESSIMART_SUBDOMAIN, "/")).toBe(
      "/marketplace",
    );
  });

  it("rewrites AccessiMart /review to the gated review surface (option 2 path)", () => {
    expect(rewriteSubdomainPath(ACCESSIMART_SUBDOMAIN, "/review")).toBe(
      "/marketplace/accessimart-review",
    );
    expect(
      rewriteSubdomainPath(ACCESSIMART_SUBDOMAIN, "/accessimart-review"),
    ).toBe("/marketplace/accessimart-review");
  });

  it("rewrites marketplace.mapable.com.au to /marketplace (option 3)", () => {
    expect(rewriteSubdomainPath(MARKETPLACE_SUBDOMAIN, "/")).toBe(
      "/marketplace",
    );
    expect(rewriteSubdomainPath(MARKETPLACE_SUBDOMAIN, "/browse")).toBe(
      "/marketplace/browse",
    );
  });

  it("rewrites ecosystem.mapable.com.au to /ecosystem (option 4)", () => {
    expect(rewriteSubdomainPath(ECOSYSTEM_SUBDOMAIN, "/")).toBe("/ecosystem");
    expect(rewriteSubdomainPath(ECOSYSTEM_SUBDOMAIN, "/handoffs")).toBe(
      "/ecosystem/handoffs",
    );
  });

  it("rewrites Care, Transport and Employment programme hosts", () => {
    expect(rewriteSubdomainPath(CARE_SUBDOMAIN, "/")).toBe("/care");
    expect(rewriteSubdomainPath(CARE_SUBDOMAIN, "/find")).toBe("/care/find");
    expect(rewriteSubdomainPath(TRANSPORT_SUBDOMAIN, "/")).toBe("/transport");
    expect(rewriteSubdomainPath(TRANSPORT_SUBDOMAIN, "/book")).toBe(
      "/transport/book",
    );
    expect(rewriteSubdomainPath(EMPLOYMENT_SUBDOMAIN, "/")).toBe("/employment");
  });

  it("matches AccessiMart host before Marketplace when both share pathPrefix", () => {
    const match = matchProgrammeSubdomainRewrite(
      "accessimart.mapable.com.au",
      "mapable.com.au",
      "/review",
      {},
    );
    expect(match?.adapter.id).toBe("accessimart");
    expect(match?.rewritePath).toBe("/marketplace/accessimart-review");
  });

  it("matches marketplace host separately from AccessiMart", () => {
    const match = matchProgrammeSubdomainRewrite(
      "marketplace.mapable.com.au",
      "mapable.com.au",
      "/",
      {},
    );
    expect(match?.adapter.id).toBe("marketplace");
    expect(match?.rewritePath).toBe("/marketplace");
  });

  it("matches Care / Transport / Employment hosts", () => {
    expect(
      matchProgrammeSubdomainRewrite(
        "care.mapable.com.au",
        null,
        "/",
        {},
      )?.rewritePath,
    ).toBe("/care");
    expect(
      matchProgrammeSubdomainRewrite(
        "transport.mapable.com.au",
        null,
        "/request",
        {},
      )?.rewritePath,
    ).toBe("/transport/request");
    expect(
      matchProgrammeSubdomainRewrite(
        "employment.mapable.com.au",
        null,
        "/",
        {},
      )?.rewritePath,
    ).toBe("/employment");
  });

  it("honours env host overrides", () => {
    const match = matchProgrammeSubdomainRewrite(
      "care.preview.example",
      null,
      "/",
      { MAPABLE_CARE_HOST: "care.preview.example" },
    );
    expect(match?.adapter.id).toBe("care");
    expect(match?.rewritePath).toBe("/care");
  });

  it("does not match the main MapAble host", () => {
    expect(
      matchProgrammeSubdomainRewrite("mapable.com.au", "mapable.com.au", "/", {}),
    ).toBeNull();
  });
});
