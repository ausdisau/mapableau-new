import { describe, expect, it } from "vitest";

import { buildRegisterRedirect } from "@/lib/auth/auth-session-status";

describe("buildRegisterRedirect", () => {
  it("includes email query param", () => {
    expect(buildRegisterRedirect("user@example.com")).toBe(
      "/register?email=user%40example.com"
    );
  });

  it("preserves safe callbackUrl", () => {
    expect(buildRegisterRedirect("user@example.com", "/dashboard")).toBe(
      "/register?email=user%40example.com&callbackUrl=%2Fdashboard"
    );
  });

  it("drops unsafe callbackUrl", () => {
    expect(buildRegisterRedirect("user@example.com", "https://evil.test")).toBe(
      "/register?email=user%40example.com"
    );
  });
});
