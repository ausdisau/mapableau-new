import { buildTenantContext, type TenantContext } from "./tenant-context";

/**
 * Build a tenant context for background jobs and cron. Jobs MUST supply an
 * explicit organisationId. A null organisationId is only permitted for
 * platform-level maintenance jobs and yields no tenant-scoped access.
 */
export function jobTenantContext(input: {
  organisationId: string | null;
  jobName: string;
}): TenantContext {
  return buildTenantContext({
    organisationId: input.organisationId,
    actor: { kind: "job", role: `job:${input.jobName}` },
    requestId: `job-${input.jobName}-${Date.now()}`,
  });
}
