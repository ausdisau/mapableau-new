import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications/notification-service";

export async function notifyParticipantRecoveryOptions(
  caseId: string,
  participantId: string,
  plainLanguageMessage: string
) {
  await prisma.recoveryNotificationLog.create({
    data: {
      caseId,
      recipientId: participantId,
      channel: "in_app",
      bodyPreview: plainLanguageMessage.slice(0, 200),
    },
  });

  await notifyUser(
    participantId,
    "booking",
    "Your support options are ready",
    plainLanguageMessage
  );
}
