import { getRealtimeAdapter } from "@/lib/realtime/realtime-adapter";
import { prisma } from "@/lib/prisma";

export async function markDelivered(messageId: string, profileId: string) {
  await prisma.communicationMessageReceipt.upsert({
    where: { messageId_profileId: { messageId, profileId } },
    create: { messageId, profileId, deliveredAt: new Date() },
    update: { deliveredAt: new Date() },
  });
}

export async function markThreadRead(threadId: string, profileId: string) {
  const messages = await prisma.communicationMessage.findMany({
    where: {
      threadId,
      deletedAt: null,
      senderProfileId: { not: profileId },
    },
    select: { id: true },
  });

  const now = new Date();
  for (const m of messages) {
    await prisma.communicationMessageReceipt.upsert({
      where: { messageId_profileId: { messageId: m.id, profileId } },
      create: {
        messageId: m.id,
        profileId,
        deliveredAt: now,
        readAt: now,
      },
      update: { deliveredAt: now, readAt: now },
    });

    try {
      const adapter = getRealtimeAdapter();
      await adapter.publishReadReceipt(threadId, m.id, profileId);
    } catch {
      // best-effort
    }
  }
}
