/**
 * MapAble P0 core types.
 * `Profile` maps to the Prisma `User` row (identity only); extended data lives in role-specific profiles.
 */

export type ProfileId = string;
export type OrganisationId = string;

export type ProfileStatus = "active" | "suspended" | "archived";

export interface Profile {
  id: ProfileId;
  email: string;
  name: string;
  phone?: string | null;
  timezone: string;
  locale: string;
  status: ProfileStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type OrganisationType =
  | "care_provider"
  | "transport_provider"
  | "plan_manager"
  | "support_coordination"
  | "employer"
  | "community_partner"
  | "mapable_internal";

export type OrganisationStatus = "active" | "inactive" | "archived";

export interface Organisation {
  id: OrganisationId;
  name: string;
  organisationType: OrganisationType;
  status: OrganisationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganisationMember {
  id: string;
  profileId: ProfileId;
  organisationId: OrganisationId;
  role: string;
  createdAt: Date;
}

export type FeatureFlagKey =
  | "sponsored_provider_placement"
  | "telehealth_mvp"
  | "llm_assistant"
  | "stripe_checkout"
  | "xero_sync";

export interface FeatureFlagEvaluationContext {
  profileId?: string;
  role?: string;
  organisationId?: string;
  environment?: string;
}
