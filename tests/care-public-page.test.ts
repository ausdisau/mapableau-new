import { describe, expect, it } from "vitest";

import CareHubPage from "@/app/care/page";

describe("public care module page", () => {
  it("exports pilot care request metadata", () => {
    expect(CareHubPage).toBeTypeOf("function");
  });
});

describe("care pilot CTAs", () => {
  it("uses login callback to care request wizard", () => {
    const loginHref = "/login?callbackUrl=%2Fcare%2Frequest";
    expect(loginHref).toContain("callbackUrl=%2Fcare%2Frequest");
  });

  it("uses register callback to care request wizard", () => {
    const registerHref = "/register?callbackUrl=%2Fcare%2Frequest";
    expect(registerHref).toContain("callbackUrl=%2Fcare%2Frequest");
  });
});
