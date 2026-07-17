import { describe, expect, it } from "vitest";

import { validateWoTFormSecurity } from "@/lib/accessops/protocols/wot/security";

describe("WoT SSRF guard", () => {
  it("blocks localhost forms", () => {
    expect(validateWoTFormSecurity("http://localhost:8080", false)).toMatchObject({
      allowed: false,
      reason: "ssrf_blocked",
    });
  });

  it("requires HTTPS in production", () => {
    expect(validateWoTFormSecurity("http://example.com/form", true)).toMatchObject({
      allowed: false,
      reason: "insecure_form_rejected",
    });
  });
});
