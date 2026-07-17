/**
 * Data-sharing agreements are documented as `DelegatedTenantAuthority` records
 * with a scope + reason + expiry. This helper describes the shape of a
 * documented agreement for reporting; it does not implement live data flow.
 */

export interface DataSharingAgreementSummary {
  id: string;
  fromOrganisationId: string;
  toOrganisationId: string;
  scope: string;
  status: string;
  effectiveFrom: string | null;
  expiresAt: string | null;
  reason: string;
}
