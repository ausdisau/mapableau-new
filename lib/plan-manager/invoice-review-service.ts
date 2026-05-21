import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { notifyUser } from "@/lib/notifications/notification-service";
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

export async function listAuthorisedInvoices(planManagerId: string) {
  const rels = await prisma.planManagerRelationship.findMany({
    where: { planManagerId, status: "active" },
  });
  const participantIds = rels.map((r) => r.participantId);
  return prisma.invoice.findMany({
    where: { participantId: { in: participantIds } },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      status: true,
      participantId: true,
      createdAt: true,
    },
  });
}

export async function raisePlanManagerQuery(params: {
  invoiceId: string;
  planManagerId: string;
  body: string;
}) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.invoiceId },
  });
  if (!invoice) throw new Error("NOT_FOUND");

  const allowed = await hasPlanManagerAccess(
    invoice.participantId,
    params.planManagerId
  );
  if (!allowed) throw new Error("CONSENT_REQUIRED");

  const query = await prisma.planManagerQuery.create({
    data: {
      invoiceId: params.invoiceId,
      planManagerId: params.planManagerId,
      body: params.body,
    },
  });

  const existingReview = await prisma.planManagerInvoiceReview.findFirst({
    where: {
      invoiceId: params.invoiceId,
      planManagerId: params.planManagerId,
    },
  });
  if (existingReview) {
    await prisma.planManagerInvoiceReview.update({
      where: { id: existingReview.id },
      data: { status: "query_raised", notes: params.body.slice(0, 500) },
    });
  } else {
    await prisma.planManagerInvoiceReview.create({
      data: {
        invoiceId: params.invoiceId,
        planManagerId: params.planManagerId,
        status: "query_raised",
        notes: params.body.slice(0, 500),
      },
    });
  }

  await notifyUser(
    invoice.participantId,
    "billing",
    "Plan manager question about your invoice",
    "A plan manager has raised a question that needs review."
  );

  await createAuditEvent({
    actorUserId: params.planManagerId,
    action: "plan_manager.query_raised",
    entityType: "Invoice",
    entityId: params.invoiceId,
    participantId: invoice.participantId,
  });

  return query;
}
