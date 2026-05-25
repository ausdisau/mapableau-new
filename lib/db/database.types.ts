/**
 * Re-exports Prisma-generated types for the P0 platform spine.
 * Backend remains source of truth via Prisma models.
 */

export type {
  User as DbProfile,
  UserRoleAssignment as DbProfileRole,
  Organisation as DbOrganisation,
  OrganisationMember as DbOrganisationMember,
  ConsentRecord as DbConsentGrant,
  ConsentEvent as DbConsentEvent,
  AuditEvent as DbAuditLog,
  DataAccessLog as DbDataAccessLog,
  FeatureFlag as DbFeatureFlag,
  FeatureFlagRule as DbFeatureFlagRule,
  FeatureFlagEvent as DbFeatureFlagEvent,
  RolePermission as DbRolePermission,
  MapAbleUserRole,
  ProfileRoleStatus,
  PlatformConsentScope,
  ConsentEventType,
  DataAccessAction,
  OrganisationType,
  OrganisationStatus,
  ConsentStatus,
} from "@prisma/client";
