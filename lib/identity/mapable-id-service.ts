import { mapableIdConfig } from "@/lib/config/mapable-id";
import {
  decideIdentityAccess,
  type VerifiedSession,
} from "@/lib/identity/mapable-id-policy";
import type { IdentityMeResponse } from "@/lib/identity/mapable-id-types";
import { prisma } from "@/lib/prisma";

const PLANNED_SERVICES = [
  { id: "mapable", title: "MapAble" },
  { id: "providercloud", title: "ProviderCloud" },
  { id: "accessibooks", title: "AccessiBooks" },
  { id: "cripsquare", title: "CripSquare" },
] as const;

function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function delegateLabel(grant: {
  recipientRole: string | null;
  granteeUserId: string | null;
  delegateId: string | null;
}): string {
  if (grant.recipientRole) return grant.recipientRole;
  if (grant.granteeUserId) return "Trusted person";
  if (grant.delegateId) return "Delegate";
  return "Trusted access";
}

function grantStatus(grant: {
  status: string;
  revokedAt: Date | null;
  expiresAt: Date | null;
}): "active" | "revoked" | "expired" | "unknown" {
  if (grant.revokedAt || grant.status === "revoked") return "revoked";
  if (grant.expiresAt && grant.expiresAt.getTime() <= Date.now()) {
    return "expired";
  }
  if (grant.status === "active") return "active";
  return "unknown";
}

/**
 * Build a scrubbed, server-verified MapAbleID snapshot for the authenticated user.
 * Never returns passwords, token hashes, NDIS numbers, or raw audit payloads.
 */
export async function buildIdentityMeSnapshot(input: {
  userId: string;
  displayName: string;
  primaryRole: string | null;
  sessionId: string;
  expiresAtMs: number;
}): Promise<IdentityMeResponse> {
  const nowMs = Date.now();

  const [passkeys, mfaEnrolments, sessions, grants, consents] =
    await Promise.all([
      prisma.passkeyCredential.count({ where: { userId: input.userId } }),
      prisma.mfaEnrolment.findMany({
        where: { userId: input.userId },
        select: {
          id: true,
          method: true,
          status: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.authSessionRecord.findMany({
        where: {
          userId: input.userId,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        select: {
          id: true,
          lastSeenAt: true,
          expiresAt: true,
          userAgent: true,
        },
        orderBy: { lastSeenAt: "desc" },
        take: 10,
      }),
      prisma.participantAuthorityGrant.findMany({
        where: { participantId: input.userId },
        select: {
          id: true,
          purpose: true,
          allowedActions: true,
          actions: true,
          status: true,
          expiresAt: true,
          revokedAt: true,
          correlationId: true,
          recipientRole: true,
          granteeUserId: true,
          delegateId: true,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.consentRecord.findMany({
        where: { subjectUserId: input.userId },
        select: {
          id: true,
          purpose: true,
          scope: true,
          status: true,
          expiryDate: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 20,
      }),
    ]);

  const smsEnrolled = mfaEnrolments.some(
    (m) => m.method === "sms_twilio" && m.status === "enrolled",
  );
  const passkeyMfa = mfaEnrolments.some(
    (m) => m.method === "passkey" && m.status === "enrolled",
  );

  const security: IdentityMeResponse["security"] = [
    {
      id: "passkey",
      title: "Passkeys",
      kind: "passkey",
      status:
        passkeys > 0 || passkeyMfa
          ? "configured"
          : ("not_configured" as const),
    },
    {
      id: "security_key",
      title: "Security key / YubiKey",
      kind: "security_key",
      status: passkeys > 0 ? "configured" : ("not_configured" as const),
    },
    {
      id: "sms",
      title: "SMS verification",
      kind: "sms",
      status: smsEnrolled ? "configured" : ("not_configured" as const),
    },
    {
      id: "password",
      title: "Password sign-in",
      kind: "password",
      status: "configured",
    },
  ];

  const verifiedSession: VerifiedSession = {
    verifiedByServer: true,
    subjectId: input.userId,
    issuer: mapableIdConfig.trustedIssuers[0],
    audience: mapableIdConfig.audience,
    sessionId: input.sessionId,
    expiresAtMs: input.expiresAtMs,
    revoked: false,
  };

  const policyShadow = decideIdentityAccess(
    verifiedSession,
    {
      action: "view_identity",
      resourceOwnerSubjectId: input.userId,
    },
    {
      trustedIssuers: mapableIdConfig.trustedIssuers,
      audience: mapableIdConfig.audience,
      nowMs,
    },
  );

  return {
    mode: "server_verified_read_only",
    issuer: mapableIdConfig.trustedIssuers[0],
    audience: mapableIdConfig.audience,
    subjectId: input.userId,
    displayName: input.displayName,
    accountReference: `MapAbleID subject ${input.userId.slice(0, 8)}…`,
    primaryRole: input.primaryRole,
    security,
    sessions: sessions.map((session) => ({
      id: session.id,
      lastSeenAt: session.lastSeenAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      userAgent: session.userAgent,
    })),
    delegates: grants.map((grant) => {
      const actions =
        grant.allowedActions.length > 0
          ? grant.allowedActions
          : grant.actions;
      return {
        id: grant.id,
        label: delegateLabel(grant),
        access:
          actions.length > 0 ? actions.join(", ") : "Scoped assistance",
        purpose: grant.purpose,
        status: grantStatus(grant),
        expiresAt: toIso(grant.expiresAt),
        correlationId: grant.correlationId,
      };
    }),
    services: PLANNED_SERVICES.map((service) => ({
      id: service.id,
      title: service.title,
      status:
        service.id === "mapable"
          ? ("connected" as const)
          : ("planned" as const),
    })),
    consents: consents.map((consent) => ({
      id: consent.id,
      purpose: consent.purpose,
      scope: String(consent.scope),
      status: String(consent.status),
      expiryDate: toIso(consent.expiryDate),
    })),
    recovery: [
      {
        id: "password_reset",
        title: "Reset password",
        description:
          "Use the accessible password-reset flow. Sessions may be reviewed afterwards.",
        href: "/forgot-password",
      },
      {
        id: "account_security",
        title: "Review sign-in methods",
        description:
          "Passkeys, SMS MFA, trusted devices and active sessions stay under your control.",
        href: "/account/security",
      },
      {
        id: "human_assistance",
        title: "Independent human assistance",
        description:
          "Ask for help without handing over your password or giving a supporter permanent control.",
      },
    ],
    policyShadow: {
      allow: policyShadow.allow,
      reason: policyShadow.reason,
    },
  };
}

/** Deep scan for forbidden keys in a JSON-serialisable payload. */
export function containsForbiddenIdentityFields(
  value: unknown,
  path: string[] = [],
): string[] {
  const hits: string[] = [];
  if (value === null || value === undefined) return hits;
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      hits.push(
        ...containsForbiddenIdentityFields(item, [...path, String(index)]),
      );
    });
    return hits;
  }
  if (typeof value === "object") {
    for (const [key, nested] of Object.entries(
      value as Record<string, unknown>,
    )) {
      const lower = key.toLowerCase();
      if (
        lower.includes("password") ||
        lower.includes("tokenhash") ||
        lower === "sessiontoken" ||
        lower === "publickey" ||
        lower === "credentialid" ||
        lower.includes("ndisnumber") ||
        lower.includes("accesstoken") ||
        lower.includes("refreshtoken") ||
        (lower.includes("secret") && lower !== "secretstatus")
      ) {
        hits.push([...path, key].join("."));
      }
      hits.push(...containsForbiddenIdentityFields(nested, [...path, key]));
    }
  }
  return hits;
}
