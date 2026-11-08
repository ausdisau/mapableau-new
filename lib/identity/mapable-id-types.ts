import { z } from "zod";

export const identitySecurityMethodSchema = z.object({
  id: z.string(),
  title: z.string(),
  kind: z.enum(["passkey", "security_key", "authenticator", "password", "sms"]),
  status: z.enum([
    "configured",
    "not_configured",
    "pending_review",
    "unknown",
  ]),
});

export const identityDelegateSchema = z.object({
  id: z.string(),
  label: z.string(),
  access: z.string(),
  purpose: z.string(),
  status: z.enum(["active", "revoked", "expired", "unknown"]),
  expiresAt: z.string().nullable(),
  correlationId: z.string().optional(),
});

export const identityServiceSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(["connected", "not_connected", "planned", "unknown"]),
});

export const identityConsentSchema = z.object({
  id: z.string(),
  purpose: z.string(),
  scope: z.string(),
  status: z.string(),
  expiryDate: z.string().nullable(),
});

export const identitySessionSummarySchema = z.object({
  id: z.string(),
  lastSeenAt: z.string(),
  expiresAt: z.string(),
  userAgent: z.string().nullable(),
});

export const identityRecoveryOptionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  href: z.string().optional(),
});

export const identityMeResponseSchema = z.object({
  mode: z.literal("server_verified_read_only"),
  issuer: z.string(),
  audience: z.string(),
  subjectId: z.string(),
  displayName: z.string(),
  accountReference: z.string(),
  primaryRole: z.string().nullable(),
  security: z.array(identitySecurityMethodSchema),
  sessions: z.array(identitySessionSummarySchema),
  delegates: z.array(identityDelegateSchema),
  services: z.array(identityServiceSchema),
  consents: z.array(identityConsentSchema),
  recovery: z.array(identityRecoveryOptionSchema),
  policyShadow: z.object({
    allow: z.boolean(),
    reason: z.string(),
  }),
});

export type IdentityMeResponse = z.infer<typeof identityMeResponseSchema>;

/** Fields that must never appear in MapAbleID API responses. */
export const IDENTITY_ME_FORBIDDEN_KEYS = [
  "password",
  "passwordHash",
  "sessionToken",
  "sessionTokenHash",
  "publicKey",
  "credentialId",
  "ndis",
  "ndisNumber",
  "accessToken",
  "refreshToken",
  "secret",
  "otp",
  "rawAudit",
] as const;
