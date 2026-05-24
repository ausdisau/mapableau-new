import { prisma } from "@/lib/prisma";

export async function createNotificationEvent(params: {
  userId: string;
  category: string;
  eventType: string;
  title: string;
  body: string;
  entityType?: string;
  entityId?: string;
  participantId?: string;
}) {
  return prisma.notificationEvent.create({ data: params });
}
