import { describe, expect, it } from "vitest";

import robots from "@/app/robots";

describe("public robots boundary", () => {
  it("publishes a sitemap while discouraging crawl of governed surfaces", () => {
    const result = robots();
    expect(result.sitemap).toMatch(/\/sitemap\.xml$/);

    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const wildcard = rules.find((rule) => rule.userAgent === "*");
    expect(wildcard).toBeTruthy();

    const disallow = Array.isArray(wildcard?.disallow)
      ? wildcard?.disallow
      : [wildcard?.disallow];

    expect(disallow).toEqual(
      expect.arrayContaining([
        "/api/",
        "/dashboard/",
        "/messages/",
        "/my/",
        "/marketplace/cart",
      ]),
    );
  });
});
