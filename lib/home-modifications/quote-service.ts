import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { createNotificationEvent } from "@/lib/access/notification-event-service";
import { notifyUser } from "@/lib/notifications/notification-service";
import { prisma } from "@/lib/prisma";

export async function requestQuote(params: {
  requestId: string;
  providerId: string;
  organisationId?: string;
  title: string;
  participantId: string;
  actorUserId: string;
}) {
  const quote = await prisma.homeModificationQuote.create({
    data: {
      requestId: params.requestId,
      providerId: params.providerId,
      organisationId: params.organisationId,
      title: params.title,
      status: "requested",
    },
  });

  await prisma.homeModificationRequest.update({
    where: { id: params.requestId },
    data: { status: "quotes_requested" },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "home_modification.quote_requested",
    entityType: "HomeModificationQuote",
    entityId: quote.id,
    participantId: params.participantId,
  });

  await notifyUser(
    params.providerId,
    "provider",
    "Home modification quote request",
    `A participant has requested a quote: ${params.title}`
  );
  await createNotificationEvent({
    userId: params.providerId,
    category: "home_modification",
    eventType: "quote_requested",
    title: "Quote request",
    body: params.title,
    participantId: params.participantId,
    entityType: "HomeModificationQuote",
    entityId: quote.id,
  });

  return quote;
}

export async function submitQuote(params: {
  quoteId: string;
  totalCents: number;
  breakdown: { item: string; amountCents: number }[];
  validUntil?: Date;
}) {
  return prisma.homeModificationQuote.update({
    where: { id: params.quoteId },
    data: {
      status: "received",
      totalCents: params.totalCents,
      breakdownJson: params.breakdown,
      validUntil: params.validUntil,
    },
  });
}

export async function compareQuotes(requestId: string) {
  const quotes = await prisma.homeModificationQuote.findMany({
    where: { requestId, status: { in: ["received", "requested", "accepted"] } },
    orderBy: { totalCents: "asc" },
  });

  return quotes.map((q) => ({
    ...q,
    breakdown: q.breakdownJson,
    note: "Compare quotes with the participant. Costs are provider estimates only.",
  }));
}

export async function acceptQuote(params: {
  quoteId: string;
  participantId: string;
  actorUserId: string;
}) {
  const quote = await prisma.homeModificationQuote.findUnique({
    where: { id: params.quoteId },
  });
  if (!quote) throw new Error("NOT_FOUND");

  await prisma.homeModificationQuote.update({
    where: { id: params.quoteId },
    data: { status: "accepted" },
  });

  const project = await prisma.homeModificationProject.create({
    data: {
      requestId: quote.requestId,
      participantId: params.participantId,
      providerId: quote.providerId,
      title: quote.title,
      status: "approved",
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "home_modification.quote_accepted",
    entityType: "HomeModificationQuote",
    entityId: quote.id,
    participantId: params.participantId,
  });

  return project;
}
