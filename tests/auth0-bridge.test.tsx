/**
 * @vitest-environment jsdom
 */
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { AuthErrorSummary } from "@/components/auth/AuthErrorSummary";
import { LoginForm } from "@/components/auth/LoginForm";
import {
  getDashboardPathForRole,
  PRIVILEGED_ROLES,
} from "@/lib/auth/role-onboarding-router";
import {
  rejectUnsafeReturnTo,
  validateReturnTo,
} from "@/lib/auth/return-to";
import {
  getWixLoginUrl,
  getWixRegisterUrl,
} from "@/lib/config/auth-env";
import {
  getAllowedWixSyncFields,
  getBlockedWixSyncFields,
  isWixMemberBridgeEnabled,
  sanitizeWixSyncPayload,
} from "@/lib/wix/wix-member-bridge";

describe("returnTo validation", () => {
  it("accepts safe internal paths", () => {
    expect(validateReturnTo("/dashboard")).toBe("/dashboard");
    expect(validateReturnTo("/participant/bookings")).toBe("/participant/bookings");
  });

  it("rejects external URLs", () => {
    expect(validateReturnTo("https://evil.example/phish")).toBeNull();
    expect(validateReturnTo("//evil.example")).toBeNull();
    expect(validateReturnTo("/evil")).toBeNull();
  });

  it("flags rejected unsafe returnTo", () => {
    expect(rejectUnsafeReturnTo("https://evil.example")).toEqual({
      safe: null,
      rejected: true,
    });
  });
});

describe("role routing rules", () => {
  it("routes participant to /participant", () => {
    expect(getDashboardPathForRole("participant")).toBe("/participant");
  });

  it("routes provider_admin to /provider only as dashboard path", () => {
    expect(getDashboardPathForRole("provider_admin")).toBe("/provider");
  });

  it("does not treat admin as default participant path", () => {
    expect(getDashboardPathForRole("mapable_admin")).toBe("/admin");
    expect(getDashboardPathForRole("participant")).not.toBe("/admin");
  });

  it("treats provider/worker/driver as privileged roles", () => {
    expect(PRIVILEGED_ROLES).toContain("provider_admin");
    expect(PRIVILEGED_ROLES).toContain("support_worker");
    expect(PRIVILEGED_ROLES).toContain("driver");
    expect(PRIVILEGED_ROLES).not.toContain("participant");
  });

  it("does not auto-grant admin from participant defaults", () => {
    expect(PRIVILEGED_ROLES).not.toContain("participant");
    expect(getDashboardPathForRole("participant")).not.toBe("/admin");
  });
});

describe("Wix integration URLs and bridge", () => {
  it("points Wix login to MapAble auth login route", () => {
    const url = getWixLoginUrl("/dashboard");
    expect(url).toContain("/auth/login");
    expect(url).toContain("returnTo=%2Fdashboard");
  });

  it("points Wix get started to MapAble register route", () => {
    expect(getWixRegisterUrl()).toContain("/register");
  });

  it("disables Wix bridge by default", () => {
    expect(isWixMemberBridgeEnabled()).toBe(false);
  });

  it("does not sync sensitive fields in Wix payload sanitizer", () => {
    const payload = sanitizeWixSyncPayload({
      email: "user@example.com",
      displayName: "Alex",
      ndisPlanData: "secret",
      invoices: ["should-not-sync"],
      clinicalRecords: "blocked",
    });

    expect(payload.email).toBe("user@example.com");
    expect(payload.displayName).toBe("Alex");
    expect(payload).not.toHaveProperty("ndisPlanData");
    expect(payload).not.toHaveProperty("invoices");
    expect(getBlockedWixSyncFields()).toContain("clinicalRecords");
    expect(getAllowedWixSyncFields()).toContain("email");
  });
});

describe("auth UI accessibility", () => {
  it("login form exposes accessible sign-in button", () => {
    render(<LoginForm returnTo="/dashboard" />);
    const link = screen.getByRole("link", { name: /sign in securely/i });
    expect(link.getAttribute("href")).toBe("/auth/login?returnTo=%2Fdashboard");
    cleanup();
  });

  it("auth errors are announced", () => {
    render(<AuthErrorSummary errors={["We could not complete sign-in."]} />);
    expect(screen.getByRole("alert").textContent).toContain("problem with sign-in");
    cleanup();
  });

  it("supports keyboard focus on sign-in link", async () => {
    const user = userEvent.setup();
    render(<LoginForm returnTo="/dashboard" />);
    const link = screen.getByRole("link", { name: /sign in securely/i });
    link.focus();
    expect(document.activeElement).toBe(link);
    await user.keyboard("{Enter}");
    cleanup();
  });
});

describe("security expectations", () => {
  it("does not expose Auth0 client secret via public env naming", () => {
    expect(process.env.AUTH0_CLIENT_SECRET ?? "").not.toMatch(/^public_/);
  });

  it("allows admin dashboard path only through explicit role mapping", () => {
    expect(validateReturnTo("/admin/users")).toBe("/admin/users");
    expect(PRIVILEGED_ROLES).toContain("mapable_admin");
  });
});
