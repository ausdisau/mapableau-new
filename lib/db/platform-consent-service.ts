import type { PlatformConsentScope as PrismaPlatformScope } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { getDbClient } from "@/lib/db/db-client";
import { runInTransaction } from "@/lib/db/transaction-service";
import type { PlatformConsentScope } from "@/types/consent";
import type { ConsentScope } from "@/types/mapable";

/** Maps P0 platform scopes to legacy Prisma consent scopes where applicable. */
export function platformScopeToLegacyScope(
  scope: PlatformConsentScope
): ConsentScope | null {
  const map: Partial<Record<PlatformConsentScope, ConsentScope>> = {
    view_profile: "profile.read",
    view_bookings: "booking.read",
    view_invoices: "billing.read",
    view_messages: "messages.send",
    manage_bookings: "booking.manage",
    approve_invoices: "plan_manager.invoice_access",
  };
  return map[scope] ?? null;
}

export async function createPlatformConsentGrant(params: {
  subjectProfileId: string;
  scope: PlatformConsentScope;
  purpose: string;
  createdById: string;
  grantedToProfileId?: string;
  grantedToOrganisationId?: string;
  expiryDate?: Date;
}) {
  const legacy = platformScopeToLegacyScope(params.scope);

  return runInTransaction(async (tx) => {
    let consentRecordId: string;

    if (legacy) {
      const { consentScopeToPrisma } = await import("@/lib/consent/scope-map");
      const record = await tx.consentRecord.create({
        data: {
          subjectUserId: params.subjectProfileId,
          grantedToUserId: params.grantedToProfileId,
          grantedToOrganisationId: params.grantedToOrganisationId,
          scope: consentScopeToPrisma(legacy),
          purpose: params.purpose,
          status: "active",
          expiryDate: params.expiryDate,
          createdById: params.createdById,
        },
      });
      consentRecordId = record.id;
    } else {
      const record = await tx.consentRecord.create({
        data: {
          subjectUserId: params.subjectProfileId,
          grantedToUserId: params.grantedToProfileId,
          grantedToOrganisationId: params.grantedToOrganisationId,
          scope: "profile_read",
          purpose: `[${params.scope}] ${params.purpose}`,
          status: "active",
          expiryDate: params.expiryDate,
          createdById: params.createdById,
        },
      });
      consentRecordId = record.id;
    }

    await tx.consentEvent.create({
      data: {
        consentRecordId,
        eventType: "granted",
        actorUserId: params.createdById,
        metadata: { platformScope: params.scope },
      },
    });

    await createAuditEvent({
      actorUserId: params.createdById,
      action: "consent.granted",
      entityType: "consent_grants",
      entityId: consentRecordId,
      participantId: params.subjectProfileId,
      metadata: { scope: params.scope },
    });

    return { id: consentRecordId };
  });
}

export async function revokePlatformConsentGrant(
  consentGrantId: string,
  revokedById: string
) {
  return runInTransaction(async (tx) => {
    const record = await tx.consentRecord.update({
      where: { id: consentGrantId },
      data: {
        status: "revoked",
        revokedById,
        revokedAt: new Date(),
      },
    });

    await tx.consentEvent.create({
      data: {
        consentRecordId: consentGrantId,
        eventType: "revoked",
        actorUserId: revokedById,
      },
    });

    await createAuditEvent({
      actorUserId: revokedById,
      action: "consent.revoked",
      entityType: "consent_grants",
      entityId: consentGrantId,
      participantId: record.subjectUserId,
    });

    return record;
  });
}

export async function hasPlatformConsentScope(params: {
  subjectProfileId: string;
  scope: PlatformConsentScope;
  grantedToProfileId?: string;
  grantedToOrganisationId?: string;
}): Promise<boolean> {
  const legacy = platformScopeToLegacyScope(params.scope);
  if (legacy) {
    const { checkConsent } = await import("@/lib/consent/consent-service");
    return checkConsent({
      subjectUserId: params.subjectProfileId,
      scope: legacy,
      grantedToUserId: params.grantedToProfileId,
      grantedToOrganisationId: params.grantedToOrganisationId,
    });
  }

  const active = await getDbClient().consentRecord.findFirst({
    where: {
      subjectUserId: params.subjectProfileId,
      status: "active",
      purpose: { contains: `[${params.scope}]` },
      ...(params.grantedToProfileId
        ? { grantedToUserId: params.grantedToProfileId }
        : {}),
      ...(params.grantedToOrganisationId
        ? { grantedToOrganisationId: params.grantedToOrganisationId }
        : {}),
    },
  });
  return Boolean(active);
}

export function logConsentScopeAccess(
  scope: PrismaPlatformScope | PlatformConsentScope
): PlatformConsentScope | null {
  const values: PlatformConsentScope[] = [
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
  ];
  if (values.includes(scope as PlatformConsentScope)) {
    return scope as PlatformConsentScope;
  }
  return null;
}
