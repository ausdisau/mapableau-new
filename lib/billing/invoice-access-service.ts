import type { CurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export async function canAccessInvoice(
  user: CurrentUser,
  invoice: {
    participantId: string;
    organisationId: string | null;
  }
): Promise<boolean> {
  if (isAdminRole(user.primaryRole)) return true;
  if (invoice.participantId === user.id) return true;

  if (invoice.organisationId) {
    const member = await prisma.organisationMember.findFirst({
      where: {
        userId: user.id,
        organisationId: invoice.organisationId,
      },
    });
    if (member) return true;
  }

  if (hasPermission(user.primaryRole, "plan_manager:portal")) {
    const consent = await prisma.consentRecord.findFirst({
      where: {
        subjectUserId: invoice.participantId,
        grantedToUserId: user.id,
        scope: { in: ["billing_read", "plan_manager_invoice_access"] },
        status: "active",
      },
    });
    if (consent) return true;
  }

  const nomineeConsent = await prisma.consentRecord.findFirst({
    where: {
      subjectUserId: invoice.participantId,
      grantedToUserId: user.id,
      scope: "billing_read",
      status: "active",
    },
  });
  return Boolean(nomineeConsent);
}

export async function assertInvoiceAccess(
  user: CurrentUser,
  invoiceId: string
) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) throw new Error("INVOICE_NOT_FOUND");
  const allowed = await canAccessInvoice(user, invoice);
  if (!allowed) throw new Error("FORBIDDEN");
  return invoice;
}
