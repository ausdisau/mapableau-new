import type { NomineePermissionScope } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function hasNomineeScope(params: {
  nomineeId: string;
  participantId: string;
  scope: NomineePermissionScope;
}): Promise<boolean> {
  const link = await prisma.participantNomineeLink.findUnique({
    where: {
      participantId_nomineeId: {
        participantId: params.participantId,
        nomineeId: params.nomineeId,
      },
    },
    include: {
      permissions: {
        where: { scope: params.scope, revokedAt: null },
      },
    },
  });
  return link?.status === "active" && link.permissions.length > 0;
}

export async function getActiveNomineeLink(
  nomineeId: string,
  participantId: string
) {
  return prisma.participantNomineeLink.findUnique({
    where: {
      participantId_nomineeId: { participantId, nomineeId },
    },
    include: {
      permissions: { where: { revokedAt: null } },
    },
  });
}

export const ALL_NOMINEE_SCOPES: NomineePermissionScope[] = [
  "view_dashboard",
  "view_bookings",
  "create_booking_draft",
  "approve_invoice",
  "view_documents",
  "message_providers",
  "view_emergency_profile",
  "manage_notifications",
  "view_service_history",
  "support_plan_review",
];

export function scopeLabel(scope: NomineePermissionScope): string {
  const labels: Record<NomineePermissionScope, string> = {
    view_dashboard: "View dashboard",
    view_bookings: "View bookings",
    create_booking_draft: "Draft bookings",
    approve_invoice: "Approve invoices",
    view_documents: "View documents",
    message_providers: "Message providers",
    view_emergency_profile: "Emergency profile",
    manage_notifications: "Manage notifications",
    view_service_history: "View service history",
    support_plan_review: "Support plan review",
  };
  return labels[scope] ?? scope;
}
