import { describe, expect, it } from "vitest";

import {
  findServiceRecoveryManifest,
  isBillingApprovalAttempt,
  isEmergencyServiceAttempt,
  SPECIALIST_MANIFESTS,
} from "@/lib/aura/agents/manifests";
import { EMERGENCY_ACTION_SLUGS } from "@/lib/aura/safety/emergency-boundary";

describe("AURA service_recovery specialist manifest", () => {
  it("exists as its own manifest, distinct from account recovery", () => {
    const svc = findServiceRecoveryManifest();
    expect(svc).toBeDefined();
    expect(svc?.slug).toBe("service-recovery");
    const account = SPECIALIST_MANIFESTS.find((m) => m.slug === "recovery");
    expect(account).toBeDefined();
    expect(account?.slug).not.toBe(svc?.slug);
  });

  it("prohibits every emergency action slug", () => {
    const svc = findServiceRecoveryManifest();
    for (const slug of EMERGENCY_ACTION_SLUGS) {
      expect(svc?.prohibitedActionSlugs).toContain(slug);
    }
  });

  it("prohibits billing approvals", () => {
    const svc = findServiceRecoveryManifest();
    expect(svc?.prohibitedActionSlugs).toEqual(
      expect.arrayContaining([
        "billing.approve_invoice",
        "billing.approve_claim",
        "payments.approve",
      ])
    );
  });

  it("has a medium_reversible approval ceiling — not high_irreversible", () => {
    const svc = findServiceRecoveryManifest();
    expect(svc?.requiresApprovalAtOrAbove).toBe("medium_reversible");
  });

  it("mentions emergency in disclaimers", () => {
    const svc = findServiceRecoveryManifest();
    const disc = (svc?.disclaimers ?? []).join(" ").toLowerCase();
    expect(disc).toMatch(/emergency|000/);
  });

  it("mentions no-auto-cancel in disclaimers", () => {
    const svc = findServiceRecoveryManifest();
    const disc = (svc?.disclaimers ?? []).join(" ").toLowerCase();
    expect(disc).toMatch(/auto-?cancel|confirms/);
  });

  it("does not allow financial submit or approval slugs", () => {
    const svc = findServiceRecoveryManifest();
    const allow = new Set(svc?.allowedActionSlugs ?? []);
    expect(allow.has("billing.submit_claim")).toBe(false);
    expect(allow.has("payments.approve")).toBe(false);
    expect(allow.has("invoices.approve")).toBe(false);
  });

  it("does not allow emergency slugs", () => {
    const svc = findServiceRecoveryManifest();
    const allow = new Set(svc?.allowedActionSlugs ?? []);
    for (const slug of EMERGENCY_ACTION_SLUGS) {
      expect(allow.has(slug)).toBe(false);
    }
  });

  it("isEmergencyServiceAttempt catches known emergency slugs", () => {
    expect(isEmergencyServiceAttempt("emergency.contact_000")).toBe(true);
    expect(isEmergencyServiceAttempt("emergency.dispatch")).toBe(true);
    expect(isEmergencyServiceAttempt("care.search_options")).toBe(false);
  });

  it("isBillingApprovalAttempt still works alongside emergency helper", () => {
    expect(isBillingApprovalAttempt("billing.approve_invoice")).toBe(true);
    expect(isBillingApprovalAttempt("emergency.contact_000")).toBe(false);
  });
});
