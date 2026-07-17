/**
 * Hub-and-spoke policy: parent organisations may hold governance and reporting
 * relationships with child organisations, but this does NOT grant unrestricted
 * data access. Any read of child-tenant data by a parent-tenant actor MUST go
 * through the tenant boundary rules (membership OR DelegatedTenantAuthority OR
 * BreakGlassSession).
 */

export interface HubSpokeRelationship {
  parentOrganisationId: string;
  childOrganisationId: string;
}

export function assertNotSameTenant(rel: HubSpokeRelationship): void {
  if (rel.parentOrganisationId === rel.childOrganisationId) {
    throw new Error("HUB_SPOKE_SAME_TENANT_DENIED");
  }
}
