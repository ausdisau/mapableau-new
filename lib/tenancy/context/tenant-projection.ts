/**
 * Convert an Organisation row into a tenant projection safe for logging or
 * cross-service handoff. Never includes raw participant/claim data.
 */
export interface TenantProjection {
  organisationId: string;
  tenantKey: string | null;
  legalName: string | null;
  tenantType: string;
  operatingModel: string;
  tenantStatus: string;
  jurisdiction: string;
  dataRegion: string;
  dataIsolationMode: string;
}

export function projectTenant(row: {
  id: string;
  tenantKey?: string | null;
  legalName?: string | null;
  tenantType?: string | null;
  operatingModel?: string | null;
  tenantStatus?: string | null;
  jurisdiction?: string | null;
  dataRegion?: string | null;
  dataIsolationMode?: string | null;
}): TenantProjection {
  return {
    organisationId: row.id,
    tenantKey: row.tenantKey ?? null,
    legalName: row.legalName ?? null,
    tenantType: row.tenantType ?? "registered_provider",
    operatingModel: row.operatingModel ?? "standalone",
    tenantStatus: row.tenantStatus ?? "active_limited",
    jurisdiction: row.jurisdiction ?? "AU",
    dataRegion: row.dataRegion ?? "au",
    dataIsolationMode: row.dataIsolationMode ?? "shared_schema_strict",
  };
}
