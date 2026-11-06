import {
  getCoverageCareMemoryState,
  memoryCreateId,
  memoryNow,
} from "@/lib/coverage-care/store/memory-store";
import type { CoverageCareTenantRecord } from "@/lib/coverage-care/types";
import {
  getAcmeCareRegisteredTenant,
  getCoverageCareRegisteredTenant,
  resolveTenantBySlug,
} from "@/lib/tenancy/tenant-registry";

export function resolveCoverageCareTenantBySlug(
  slug: string,
): CoverageCareTenantRecord | null {
  const registered = resolveTenantBySlug(slug);
  if (!registered) return null;
  return (
    getCoverageCareMemoryState().tenants.find((t) => t.id === registered.id) ??
    {
      id: registered.id,
      slug: registered.slug,
      name: registered.name,
      organisationId: registered.organisationId,
    }
  );
}

export function getCoverageCareTenant(): CoverageCareTenantRecord {
  const registered = getCoverageCareRegisteredTenant();
  return (
    getCoverageCareMemoryState().tenants.find((t) => t.id === registered.id) ?? {
      id: registered.id,
      slug: registered.slug,
      name: registered.name,
      organisationId: registered.organisationId,
    }
  );
}

export function getAcmeCareTenant(): CoverageCareTenantRecord {
  const registered = getAcmeCareRegisteredTenant();
  return (
    getCoverageCareMemoryState().tenants.find((t) => t.id === registered.id) ?? {
      id: registered.id,
      slug: registered.slug,
      name: registered.name,
      organisationId: registered.organisationId,
    }
  );
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

export function listSyntheticDelegates(participantUserId?: string) {
  const delegates = getCoverageCareMemoryState().delegates;
  if (!participantUserId) return [...delegates];
  return delegates.filter((d) => d.participantUserId === participantUserId);
}
