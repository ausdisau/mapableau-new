import { z } from "zod";

import { ALL_ROLES } from "@/lib/auth/roles";

export const profileCreateSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(200),
  phone: z.string().max(30).optional(),
  timezone: z.string().default("Australia/Sydney"),
  locale: z.string().default("en-AU"),
});

export const profileRoleAssignSchema = z.object({
  profileId: z.string().min(1),
  role: z.enum(ALL_ROLES as [string, ...string[]]),
  status: z.enum(["pending", "active", "suspended", "revoked"]).default("pending"),
  isPrimary: z.boolean().optional(),
});

export const organisationCreateSchema = z.object({
  name: z.string().min(1).max(300),
  organisationType: z.enum([
    "care_provider",
    "transport_provider",
    "plan_manager",
    "support_coordination",
    "employer",
    "community_partner",
    "mapable_internal",
  ]),
  abn: z.string().max(20).optional(),
  contactEmail: z.string().email().optional(),
});

export const organisationMemberLinkSchema = z.object({
  profileId: z.string().min(1),
  organisationId: z.string().min(1),
  role: z.enum(ALL_ROLES as [string, ...string[]]).optional(),
});

export const platformConsentScopeSchema = z.enum([
  "view_profile",
  "view_bookings",
  "view_documents",
  "view_invoices",
  "view_messages",
  "view_service_logs",
  "view_outcomes",
  "approve_invoices",
  "manage_bookings",
  "emergency_access",
]);

export const consentGrantCreateSchema = z.object({
  subjectProfileId: z.string().min(1),
  grantedToProfileId: z.string().min(1).optional(),
  grantedToOrganisationId: z.string().min(1).optional(),
  scope: platformConsentScopeSchema,
  purpose: z.string().min(3).max(500),
  expiryDate: z.coerce.date().optional(),
});

export const auditLogWriteSchema = z.object({
  action: z.string().min(1).max(120),
  entityType: z.string().min(1).max(80),
  entityId: z.string().optional(),
  participantId: z.string().optional(),
  organisationId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const featureFlagUpsertSchema = z.object({
  key: z.string().min(1).max(80).regex(/^[a-z][a-z0-9_]*$/),
  description: z.string().max(500).optional(),
  enabled: z.boolean(),
});

export type ProfileCreateInput = z.infer<typeof profileCreateSchema>;
export type ProfileRoleAssignInput = z.infer<typeof profileRoleAssignSchema>;
export type ConsentGrantCreateInput = z.infer<typeof consentGrantCreateSchema>;
