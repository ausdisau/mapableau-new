import { describe, expect, it } from "vitest";

import {
  normalizeAuthEmail,
  safeAuthCallbackFromLocation,
  safeAuthCallbackPath,
} from "@/lib/auth/auth-flow";

describe("auth-flow helpers", () => {
  it("normalizes email", () => {
    expect(normalizeAuthEmail("  User@Example.COM ")).toBe("user@example.com");
  });

  it("allows safe relative callback paths", () => {
    expect(safeAuthCallbackPath("/dashboard/transport")).toBe(
      "/dashboard/transport"
    );
    expect(safeAuthCallbackPath(null)).toBe("/dashboard");
  });

  it("rejects open redirects", () => {
    expect(safeAuthCallbackPath("//evil.com")).toBe("/dashboard");
    expect(safeAuthCallbackPath("https://evil.com")).toBe("/dashboard");
    expect(safeAuthCallbackPath("")).toBe("/dashboard");
  });

  it("preserves query strings on the current page", () => {
    expect(
      safeAuthCallbackFromLocation(
        "/provider-finder",
        "?q=therapy&location=Sydney",
      ),
    ).toBe("/provider-finder?q=therapy&location=Sydney");
    expect(safeAuthCallbackFromLocation("/provider-finder", "")).toBe(
      "/provider-finder",
    );
    expect(safeAuthCallbackFromLocation("/provider-finder", null)).toBe(
      "/provider-finder",
    );
  });

  it("rejects open redirects when combining path and search", () => {
    expect(safeAuthCallbackFromLocation("//evil.com", "?q=1")).toBe(
      "/dashboard",
    );
    expect(
      safeAuthCallbackFromLocation("https://evil.com", "?q=1"),
    ).toBe("/dashboard");
  });
});
