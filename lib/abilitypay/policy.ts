import type { MapAbleUserRole } from "@prisma/client";

import { hasPermission } from "@/lib/auth/permissions";
import type { CurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

const APPROVER_ROLES: MapAbleUserRole[] = [
  "participant",
  "family_member",
  "plan_manager",
];

export function canAccessAbilityPay(user: CurrentUser): boolean {
  return hasPermission(user.primaryRole, "abilitypay:read");
}

export function canManagePlan(user: CurrentUser): boolean {
  return hasPermission(user.primaryRole, "abilitypay:plan:manage");
}

export function canReviewInvoice(user: CurrentUser): boolean {
  return hasPermission(user.primaryRole, "abilitypay:invoice:review");
}

export function canApproveInvoice(user: CurrentUser): boolean {
  return (
    hasPermission(user.primaryRole, "abilitypay:invoice:approve") &&
    APPROVER_ROLES.includes(user.primaryRole)
  );
}

export function canExportAbilityPay(user: CurrentUser): boolean {
  return hasPermission(user.primaryRole, "abilitypay:export");
}

export function canReadAbilityPayAudit(user: CurrentUser): boolean {
  return hasPermission(user.primaryRole, "abilitypay:audit:read");
}

export async function canViewInvoice(
  user: CurrentUser,
  invoiceId: string
): Promise<boolean> {
  if (!canAccessAbilityPay(user)) return false;
  if (hasPermission(user.primaryRole, "abilitypay:admin")) return true;

  const invoice = await prisma.abilityPayInvoice.findUnique({
    where: { id: invoiceId },
    select: { participantId: true, providerId: true, createdById: true },
  });
  if (!invoice) return false;

  if (invoice.participantId === user.id || invoice.createdById === user.id) {
    return true;
  }

  if (user.primaryRole === "plan_manager") {
    const rel = await prisma.planManagerRelationship.findUnique({
      where: {
        participantId_planManagerId: {
          participantId: invoice.participantId,
          planManagerId: user.id,
        },
      },
    });
    return rel?.status === "active";
  }

  if (user.primaryRole === "provider_admin" && invoice.providerId) {
    const provider = await prisma.abilityPayProvider.findUnique({
      where: { id: invoice.providerId },
      select: { organisationId: true },
    });
    if (!provider?.organisationId) return false;
    const membership = await prisma.organisationMember.findFirst({
      where: {
        userId: user.id,
        organisationId: provider.organisationId,
      },
    });
    return Boolean(membership);
  }

  return canReviewInvoice(user);
}
