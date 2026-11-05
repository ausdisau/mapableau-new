import {
  getCoverageCareMemoryState,
  memoryCreateId,
  memoryNow,
} from "@/lib/coverage-care/store/memory-store";
import {
  ACME_CARE_TENANT_SLUG,
  COVERAGE_CARE_TENANT_SLUG,
  type CoverageCareTenantRecord,
} from "@/lib/coverage-care/types";

export function resolveCoverageCareTenantBySlug(
  slug: string,
): CoverageCareTenantRecord | null {
  return (
    getCoverageCareMemoryState().tenants.find((t) => t.slug === slug) ?? null
  );
}

export function getCoverageCareTenant(): CoverageCareTenantRecord {
  const tenant = resolveCoverageCareTenantBySlug(COVERAGE_CARE_TENANT_SLUG);
  if (!tenant) {
    throw new Error("COVERAGE_CARE_TENANT_MISSING");
  }
  return tenant;
}

export function getAcmeCareTenant(): CoverageCareTenantRecord {
  const tenant = resolveCoverageCareTenantBySlug(ACME_CARE_TENANT_SLUG);
  if (!tenant) {
    throw new Error("ACME_CARE_TENANT_MISSING");
  }
  return tenant;
}

export function recordAccessDenial(input: {
  actorUserId: string;
  attemptedTenantId: string;
  resourceType: string;
  resourceId?: string;
  reason: "TENANT_CONTEXT_REQUIRED" | "TENANT_MISMATCH" | "CROSS_TENANT_DENIED";
}) {
  const state = getCoverageCareMemoryState();
  state.denials.push({
    id: memoryCreateId("denial"),
    actorUserId: input.actorUserId,
    attemptedTenantId: input.attemptedTenantId,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    reason: input.reason,
    createdAt: memoryNow(),
  });
}

export function listAccessDenials(tenantId?: string) {
  const denials = getCoverageCareMemoryState().denials;
  if (!tenantId) return [...denials];
  return denials.filter((d) => d.attemptedTenantId === tenantId);
}
