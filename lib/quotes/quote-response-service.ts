import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function submitQuoteResponse(params: {
  quoteRequestId: string;
  organisationId: string;
  totalCents: number;
  notes?: string;
  lineItems: { description: string; amountCents: number; ndisItemCode?: string }[];
  actorUserId: string;
}) {
  const invited = await prisma.quoteRequestProvider.findUnique({
    where: {
      quoteRequestId_organisationId: {
        quoteRequestId: params.quoteRequestId,
        organisationId: params.organisationId,
      },
    },
  });
  if (!invited) throw new Error("NOT_INVITED");

  const response = await prisma.quoteResponse.create({
    data: {
      quoteRequestId: params.quoteRequestId,
      organisationId: params.organisationId,
      totalCents: params.totalCents,
      notes: params.notes,
      lineItems: {
        create: params.lineItems,
      },
    },
    include: { lineItems: true },
  });

  await prisma.quoteRequest.update({
    where: { id: params.quoteRequestId },
    data: { status: "responses_received" },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "quote_response.submitted",
    entityType: "QuoteResponse",
    entityId: response.id,
    organisationId: params.organisationId,
  });

  return response;
}
