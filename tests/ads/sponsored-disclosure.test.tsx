import { describe, expect, it } from "vitest";

import { SponsoredDisclosure } from "@/components/ads/mapable/SponsoredDisclosure";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";

describe("SponsoredDisclosure a11y", () => {
  it("exposes Sponsored accessible name with business name", () => {
    const html = renderToStaticMarkup(
      React.createElement(SponsoredDisclosure, {
        businessName: "Example Café",
      }),
    );
    expect(html).toContain('aria-label="Sponsored listing: Example Café"');
    expect(html).toContain("Sponsored");
    expect(html).not.toContain("Featured");
    expect(html).not.toContain("Recommended");
  });
});
