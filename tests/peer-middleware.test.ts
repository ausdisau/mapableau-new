import { describe, expect, it } from "vitest";

import { shouldRunAuthMiddleware } from "@/lib/mapable-peers/peer-middleware";

describe("shouldRunAuthMiddleware", () => {
  it("guards authenticated app prefixes", () => {
    expect(shouldRunAuthMiddleware("/dashboard")).toBe(true);
    expect(shouldRunAuthMiddleware("/dashboard/settings")).toBe(true);
    expect(shouldRunAuthMiddleware("/provider")).toBe(true);
    expect(shouldRunAuthMiddleware("/provider/care/requests")).toBe(true);
    expect(shouldRunAuthMiddleware("/worker/today")).toBe(true);
    expect(shouldRunAuthMiddleware("/driver/profile")).toBe(true);
    expect(shouldRunAuthMiddleware("/messages/inbox")).toBe(true);
    expect(shouldRunAuthMiddleware("/practitioner")).toBe(true);
    expect(shouldRunAuthMiddleware("/abilitypay")).toBe(true);
    expect(shouldRunAuthMiddleware("/abilitypay/invoices")).toBe(true);
  });

  it("keeps module landing pages public", () => {
    expect(shouldRunAuthMiddleware("/care")).toBe(false);
    expect(shouldRunAuthMiddleware("/transport")).toBe(false);
    expect(shouldRunAuthMiddleware("/employment")).toBe(false);
    expect(shouldRunAuthMiddleware("/marketplace")).toBe(false);
    expect(shouldRunAuthMiddleware("/foods")).toBe(false);
  });

  it("guards authenticated module subroutes", () => {
    expect(shouldRunAuthMiddleware("/care/bookings")).toBe(true);
    expect(shouldRunAuthMiddleware("/care/request")).toBe(true);
    expect(shouldRunAuthMiddleware("/transport/bookings")).toBe(true);
  });

  it("leaves marketing and legal routes public", () => {
    expect(shouldRunAuthMiddleware("/")).toBe(false);
    expect(shouldRunAuthMiddleware("/about")).toBe(false);
    expect(shouldRunAuthMiddleware("/privacy")).toBe(false);
    expect(shouldRunAuthMiddleware("/providers")).toBe(false);
    expect(shouldRunAuthMiddleware("/login")).toBe(false);
  });
});
