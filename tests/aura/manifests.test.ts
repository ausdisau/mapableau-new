import { describe, expect, it } from "vitest";

import {
  isBillingApprovalAttempt,
  SPECIALIST_MANIFESTS,
} from "@/lib/aura/agents/manifests";
import { SPECIALIST_AGENT_SLUGS } from "@/lib/aura/agents/registry";

describe("specialist agent manifests", () => {
  it("all required specialists are represented", () => {
    const manifestSlugs = SPECIALIST_MANIFESTS.map((m) => m.slug);
    for (const required of SPECIALIST_AGENT_SLUGS) {
      expect(manifestSlugs).toContain(required);
    }
  });

  it("billing specialist NEVER lists an approve_invoice action", () => {
    const billing = SPECIALIST_MANIFESTS.find(
      (m) => m.slug === "billing-explain-only"
    );
    expect(billing).toBeTruthy();
    expect(billing?.allowedActionSlugs).not.toContain("billing.approve_invoice");
    expect(billing?.allowedActionSlugs).not.toContain("payments.approve");
    expect(billing?.prohibitedActionSlugs).toContain("billing.approve_invoice");
    expect(billing?.prohibitedActionSlugs).toContain("payments.approve");
  });

  it("isBillingApprovalAttempt flags billing approvals", () => {
    expect(isBillingApprovalAttempt("billing.approve_invoice")).toBe(true);
    expect(isBillingApprovalAttempt("billing.approve_claim")).toBe(true);
    expect(isBillingApprovalAttempt("payments.approve")).toBe(true);
    expect(isBillingApprovalAttempt("care.search_options")).toBe(false);
  });

  it("no manifest permits any of the always-prohibited actions", () => {
    const proh = [
      "billing.approve_invoice",
      "billing.approve_claim",
      "payments.approve",
      "consent.grant_or_alter",
      "delegation.appoint_or_alter",
      "incident.reportability_decide",
      "safeguarding.close",
      "safety.release_kill_switch",
      "integration.activate_production",
    ];
    for (const manifest of SPECIALIST_MANIFESTS) {
      for (const p of proh) {
        expect(manifest.allowedActionSlugs).not.toContain(p);
      }
    }
  });
});
