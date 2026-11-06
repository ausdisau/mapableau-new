import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(),
}));

import type { CurrentUser } from "@/lib/auth/current-user";
import {
  createBrandContent,
  listBrandContent,
  reviewBrandContent,
} from "@/lib/coverage-care/brandos-service";
import { getCoverageCareNdiaReadiness } from "@/lib/coverage-care/ndia-readiness";
import { runProvisioningPreview } from "@/lib/coverage-care/provisioning-service";
import { resetCoverageCareMemoryStore } from "@/lib/coverage-care/store/memory-store";
import { getCoverageCareTenant } from "@/lib/coverage-care/tenant-context";

const admin: CurrentUser = {
  id: "admin1",
  email: "a@example.com",
  name: "Admin",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  primaryRole: "provider_admin",
  roles: ["provider_admin"],
};

describe("Coverage Care BrandOS, provisioning, NDIA", () => {
  beforeEach(() => {
    process.env.MAPABLE_COVERAGE_CARE_ENABLED = "true";
    process.env.MAPABLE_COVERAGE_CARE_BRANDOS_ENABLED = "true";
    process.env.MAPABLE_COVERAGE_CARE_PROVISIONING_PREVIEW_ENABLED = "true";
    resetCoverageCareMemoryStore();
  });

  it("supports content approval workflow", () => {
    const tenant = getCoverageCareTenant();
    const created = createBrandContent({
      actor: admin,
      actorTenantId: tenant.id,
      kind: "messaging",
      title: "Pilot welcome",
      body: "Synthetic copy",
    });
    expect(created.approvalStatus).toBe("pending_approval");

    const approved = reviewBrandContent({
      actor: admin,
      actorTenantId: tenant.id,
      itemId: created.id,
      approvalStatus: "approved",
    });
    expect(approved.approvalStatus).toBe("approved");
    expect(listBrandContent().some((i) => i.id === created.id)).toBe(true);
  });

  it("runs provisioning preview without DNS writes and marks ownership blocked", () => {
    const tenant = getCoverageCareTenant();
    const checks = runProvisioningPreview({
      actor: admin,
      actorTenantId: tenant.id,
    });
    expect(
      checks.some(
        (c) =>
          c.checkCode === "domain_activation" && c.status === "not_configured",
      ),
    ).toBe(true);
    expect(checks.some((c) => c.checkCode === "dns_ownership" && c.status === "blocked")).toBe(
      true,
    );
    expect(checks.some((c) => c.checkCode === "feature_flags_default_off")).toBe(
      true,
    );
  });

  it("exposes disabled NDIA gateway readiness only", () => {
    const readiness = getCoverageCareNdiaReadiness();
    expect(readiness.liveSubmissionEnabled).toBe(false);
    expect(readiness.status).toBe("disabled");
    expect(readiness.gatewayName).toBe("official_disabled");
    expect(
      readiness.capabilities.every(
        (c) => c.code === "NOT_AUTHORISED_OR_NOT_CONFIGURED",
      ),
    ).toBe(true);
  });
});

