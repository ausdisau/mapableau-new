import { describe, expect, it } from "vitest";
import type { NextRequest } from "next/server";
import { redirectLegacyAccessIntelligencePaths } from "@/lib/access-intelligence/legacy-redirects";

function mockRequest(url: string): NextRequest {
  return { nextUrl: new URL(url), url } as NextRequest;
}

describe("legacy redirects", () => {
  it("redirects /verify-my-venue to /verify", () => {
    const res = redirectLegacyAccessIntelligencePaths(
      mockRequest("http://localhost/verify-my-venue"),
    );
    expect(res?.status).toBe(308);
    expect(res?.headers.get("location")).toBe("http://localhost/verify");
  });

  it("preserves query string on redirect", () => {
    const res = redirectLegacyAccessIntelligencePaths(
      mockRequest("http://localhost/verify-my-venue?placeId=abc"),
    );
    expect(res?.headers.get("location")).toBe(
      "http://localhost/verify?placeId=abc",
    );
  });

  it("does not redirect canonical paths", () => {
    expect(
      redirectLegacyAccessIntelligencePaths(
        mockRequest("http://localhost/verify"),
      ),
    ).toBeNull();
  });
});
