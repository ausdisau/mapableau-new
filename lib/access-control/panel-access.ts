import type { MapAbleUserRole } from "@prisma/client";

import type { CurrentUser } from "@/lib/auth/current-user";
import { canViewParticipantProfile, hasPermission } from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";
import { checkConsent } from "@/lib/consent/consent-service";
import { logDataAccess } from "@/lib/audit/data-access-log";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { prisma } from "@/lib/prisma";
import type { ConsentScope } from "@/types/mapable";

export type PanelActor = CurrentUser & { primaryRole: MapAbleUserRole };

export async function assertParticipantSelfAccess(
  actor: PanelActor,
  participantUserId: string,
  resourceType: string,
  resourceId?: string
): Promise<void> {
  const allowed =
    actor.id === participantUserId ||
    isAdminRole(actor.primaryRole) ||
    canViewParticipantProfile(
      actor.primaryRole,
      actor.id,
      participantUserId
    );

  if (!allowed) {
    const consentOk = await checkConsentForCoordinator(
      actor,
      participantUserId,
      "profile.read"
    );
    if (!consentOk) {
      throw new PanelAccessError("FORBIDDEN", "You cannot access this participant record.");
    }
  }

  await logDataAccess({
    actorUserId: actor.id,
    actorRole: actor.primaryRole,
    subjectUserId: participantUserId,
    resourceType,
    resourceId,
    action: "read",
    consentVerified: actor.id !== participantUserId,
  });
}

export async function assertOrganisationAccess(
  actor: PanelActor,
  organisationId: string,
  resourceType: string,
  resourceId?: string
): Promise<void> {
  if (isAdminRole(actor.primaryRole)) return;

  const orgIds = await getUserOrganisationIds(actor.id);
  if (!orgIds.includes(organisationId)) {
    throw new PanelAccessError("FORBIDDEN", "You are not a member of this organisation.");
  }

  await logDataAccess({
    actorUserId: actor.id,
    actorRole: actor.primaryRole,
    subjectUserId: actor.id,
    resourceType,
    resourceId,
    action: "read_org",
    metadata: { organisationId },
  });
}

export async function assertPlanManagerInvoiceAccess(
  actor: PanelActor,
  participantUserId: string,
  invoiceId: string
): Promise<void> {
  if (actor.primaryRole !== "plan_manager" && !isAdminRole(actor.primaryRole)) {
    throw new PanelAccessError("FORBIDDEN", "Plan manager access required.");
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, participantId: participantUserId },
  });
  if (!invoice) {
    throw new PanelAccessError("NOT_FOUND", "Invoice not found.");
  }

  if (!isAdminRole(actor.primaryRole)) {
    const ok = await checkConsent({
      subjectUserId: participantUserId,
      scope: "plan_manager.invoice_access",
      grantedToUserId: actor.id,
    });
    if (!ok) {
      throw new PanelAccessError("CONSENT_REQUIRED", "Invoice access requires participant consent.");
    }
  }

  await logDataAccess({
    actorUserId: actor.id,
    actorRole: actor.primaryRole,
    subjectUserId: participantUserId,
    resourceType: "Invoice",
    resourceId: invoiceId,
    action: "read",
    consentVerified: true,
  });
}

export function assertQualityLeadAccess(actor: PanelActor): void {
  if (
    !hasPermission(actor.primaryRole, "provider_quality:read") &&
    !isAdminRole(actor.primaryRole)
  ) {
    throw new PanelAccessError("FORBIDDEN", "Quality lead permission required.");
  }
}

async function checkConsentForCoordinator(
  actor: PanelActor,
  participantUserId: string,
  scope: ConsentScope
): Promise<boolean> {
  if (actor.primaryRole === "family_member") {
    return checkConsent({
      subjectUserId: participantUserId,
      scope,
      grantedToUserId: actor.id,
    });
  }
  if (actor.primaryRole === "support_coordinator") {
    return checkConsent({
      subjectUserId: participantUserId,
      scope: "support_coordination.access",
      grantedToUserId: actor.id,
    });
  }
  return false;
}

export class PanelAccessError extends Error {
  code: "FORBIDDEN" | "CONSENT_REQUIRED" | "NOT_FOUND" | "SAFETY_GATE";

  constructor(code: PanelAccessError["code"], message: string) {
    super(message);
    this.code = code;
    this.name = "PanelAccessError";
  }
}
