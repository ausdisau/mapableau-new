import { describe, expect, it } from "vitest";

import {
  parseAllowedEmbedDomains,
  resolveEmbedFrameAncestors,
} from "@/lib/security/embed-frame-ancestors";
import { getEmbedSecurityHeaders } from "@/lib/security/headers";

describe("embed frame-ancestors allowlist", () => {
  it("parses ALLOWED_EMBED_DOMAINS into origins", () => {
    expect(
      parseAllowedEmbedDomains(
        "https://partner.example, clinic.health.au, https://evil.example/path",
      ),
    ).toEqual([
      "https://partner.example",
      "https://clinic.health.au",
      "https://evil.example",
    ]);
  });

  it("falls back to 'self' when allowlist is empty", () => {
    const headers = new Headers();
    expect(resolveEmbedFrameAncestors(headers, "")).toBe("'self'");
    expect(resolveEmbedFrameAncestors(headers, undefined)).toBe("'self'");
  });

  it("allows a matching Referer origin and rejects unknown parents", () => {
    const allow = "https://partner.example,https://clinic.example";
    const allowed = new Headers({
      referer: "https://partner.example/page",
    });
    expect(resolveEmbedFrameAncestors(allowed, allow)).toBe(
      "'self' https://partner.example",
    );

    const denied = new Headers({
      referer: "https://malicious.example/",
    });
    expect(resolveEmbedFrameAncestors(denied, allow)).toBe("'self'");
  });

  it("never emits a wildcard frame-ancestors", () => {
    const headers = getEmbedSecurityHeaders();
    const map = Object.fromEntries(headers.map((h) => [h.key, h.value]));
    expect(map["Content-Security-Policy"]).toBe("frame-ancestors 'self'");
    expect(map["X-Frame-Options"]).toBeUndefined();
    expect(map["Content-Security-Policy"]).not.toContain("*");
  });
});
