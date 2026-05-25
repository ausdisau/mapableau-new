import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { requireModuleEnabled } from "@/lib/feature-flags/require-module";

export async function createQuoteRequest(params: {
  participantId: string;
  quoteType: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdById?: string;
  providerIds?: string[];
}) {
  await requireModuleEnabled("quote_marketplace_enabled");

  const quote = await prisma.quoteRequest.create({
    data: {
      participantId: params.participantId,
      quoteType: params.quoteType as never,
      title: params.title,
      description: params.description,
      metadata: params.metadata as never,
      createdById: params.createdById,
      status: "draft",
      providers: params.providerIds?.length
        ? {
            create: params.providerIds.map((organisationId) => ({
              organisationId,
            })),
          }
        : undefined,
    },
    include: { providers: true },
  });

  await prisma.quoteEvent.create({
    data: {
      quoteRequestId: quote.id,
      eventType: "created",
      actorUserId: params.createdById,
    },
  });

  await createAuditEvent({
    actorUserId: params.createdById,
    action: "quote_request.created",
    entityType: "QuoteRequest",
    entityId: quote.id,
    participantId: params.participantId,
  });

  return quote;
}

export async function listQuoteRequests(participantId: string) {
  return prisma.quoteRequest.findMany({
    where: { participantId },
    orderBy: { createdAt: "desc" },
    include: { responses: true, providers: true },
  });
}

export async function getQuoteRequest(id: string) {
  return prisma.quoteRequest.findUnique({
    where: { id },
    include: {
      providers: true,
      responses: { include: { lineItems: true } },
      events: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function sendQuoteToProviders(id: string, actorUserId: string) {
  const quote = await prisma.quoteRequest.update({
    where: { id },
    data: { status: "sent" },
  });
  await prisma.quoteEvent.create({
    data: {
      quoteRequestId: id,
      eventType: "sent_to_providers",
      actorUserId,
    },
  });
  return quote;
}
