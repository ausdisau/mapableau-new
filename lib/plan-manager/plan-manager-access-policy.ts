import { prisma } from "@/lib/prisma";

export async function hasPlanManagerAccess(
  participantId: string,
  planManagerId: string
) {
  const rel = await prisma.planManagerRelationship.findUnique({
    where: {
      participantId_planManagerId: { participantId, planManagerId },
    },
  });
  return rel?.status === "active";
}

export async function assertPlanManagerInvoiceAccess(
  planManagerId: string,
  invoiceId: string
) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { participantId: true },
  });
  if (!invoice) throw new Error("NOT_FOUND");

  const allowed = await hasPlanManagerAccess(
    invoice.participantId,
    planManagerId
  );
  if (!allowed) throw new Error("CONSENT_REQUIRED");
  return invoice;
}
