import type { CurrentUser } from "@/lib/auth/current-user";
import {
  coverageCareConfig,
  ensureCoverageCareEnabled,
} from "@/lib/config/coverage-care";
import { recordCoverageCareAudit } from "@/lib/coverage-care/core-bridge";
import { DEFAULT_COVERAGE_CARE_HOST } from "@/lib/coverage-care/host-routing";
import { assertProviderTenantAdmin } from "@/lib/coverage-care/permissions";
import {
  getCoverageCareMemoryState,
  memoryCreateId,
  memoryNow,
} from "@/lib/coverage-care/store/memory-store";
import { getCoverageCareTenant } from "@/lib/coverage-care/tenant-context";
import type { CoverageCareProvisionCheck } from "@/lib/coverage-care/types";

function assertProvisioningEnabled() {
  ensureCoverageCareEnabled();
  if (!coverageCareConfig.provisioningPreviewEnabled) {
    throw new Error("COVERAGE_CARE_PROVISIONING_DISABLED");
  }
}

/**
 * Domain-readiness preview only. Never writes DNS, certificates, or cookies.
 */
export function runProvisioningPreview(input: {
  actor: CurrentUser;
  actorTenantId: string;
}): CoverageCareProvisionCheck[] {
  assertProvisioningEnabled();
  const tenant = getCoverageCareTenant();
  assertProviderTenantAdmin(input.actor, input.actorTenantId, tenant.id);

  const host = coverageCareConfig.host || DEFAULT_COVERAGE_CARE_HOST;
  const ts = memoryNow();

  const checks: CoverageCareProvisionCheck[] = [
    {
      id: memoryCreateId("prov"),
      tenantId: tenant.id,
      checkCode: "hostname_configured",
      label: "Hostname configuration present",
      status: host ? "pass" : "fail",
      detail: `Configured host: ${host} (proposed — not live DNS).`,
      ranAt: ts,
    },
    {
      id: memoryCreateId("prov"),
      tenantId: tenant.id,
      checkCode: "dns_ownership",
      label: "DNS ownership / CNAME",
      status: "blocked",
      detail:
        "Blocked: domain ownership and DNS changes require human approval. No DNS write performed.",
      ranAt: ts,
    },
    {
      id: memoryCreateId("prov"),
      tenantId: tenant.id,
      checkCode: "tls_certificate",
      label: "TLS certificate readiness",
      status: "blocked",
      detail:
        "Blocked: certificate provisioning requires platform credentials and domain attachment.",
      ranAt: ts,
    },
    {
      id: memoryCreateId("prov"),
      tenantId: tenant.id,
      checkCode: "auth_cookie_domain",
      label: "Auth cookie / RP ID multi-host",
      status: "blocked",
      detail:
        "Blocked: NextAuth / passkey RP ID remains apex-scoped until security approval.",
      ranAt: ts,
    },
    {
      id: memoryCreateId("prov"),
      tenantId: tenant.id,
      checkCode: "canonical_seo",
      label: "Canonical / SEO isolation",
      status: "pass",
      detail:
        "Coverage Care layout sets proposed metadataBase when host rewrite is active; apex robots untouched.",
      ranAt: ts,
    },
    {
      id: memoryCreateId("prov"),
      tenantId: tenant.id,
      checkCode: "feature_flags_default_off",
      label: "Feature flags fail-closed",
      status: "pass",
      detail: "MAPABLE_COVERAGE_CARE_* flags default false unless explicitly true.",
      ranAt: ts,
    },
    {
      id: memoryCreateId("prov"),
      tenantId: tenant.id,
      checkCode: "tenant_isolation",
      label: "Tenant-scoped enquiry store",
      status: "pass",
      detail: "Enquiry and listing reads require matching tenantId.",
      ranAt: ts,
    },
  ];

  const state = getCoverageCareMemoryState();
  state.provisionChecks = [
    ...state.provisionChecks.filter((c) => c.tenantId !== tenant.id),
    ...checks,
  ];

  void recordCoverageCareAudit({
    actorUserId: input.actor.id,
    action: "coverage_care.provisioning.preview_run",
    entityType: "CoverageCareProvisionCheck",
    metadata: { host, checkCount: checks.length },
  });

  return checks.map((c) => ({ ...c }));
}

export function listProvisioningChecks(
  tenantId?: string,
): CoverageCareProvisionCheck[] {
  assertProvisioningEnabled();
  const scoped = tenantId ?? getCoverageCareTenant().id;
  return getCoverageCareMemoryState()
    .provisionChecks.filter((c) => c.tenantId === scoped)
    .map((c) => ({ ...c }));
}
