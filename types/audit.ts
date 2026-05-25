import type { PlatformConsentScope } from "@/types/consent";
import type { UserRole } from "@/types/mapable";

export type DataAccessAction = "read" | "export" | "search" | "list";

export interface AuditLogEntry {
  id: string;
  actorProfileId?: string | null;
  actorRole?: UserRole | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  participantId?: string | null;
  organisationId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
}

export interface DataAccessLogEntry {
  id: string;
  actorProfileId: string;
  actorRole?: UserRole | null;
  resourceType: string;
  resourceId?: string | null;
  participantId?: string | null;
  organisationId?: string | null;
  action: DataAccessAction;
  consentScope?: PlatformConsentScope | null;
  createdAt: Date;
}

export type AuditEventCategory =
  | "auth"
  | "onboarding"
  | "consent"
  | "access"
  | "profile"
  | "organisation"
  | "feature_flag"
  | "system";
