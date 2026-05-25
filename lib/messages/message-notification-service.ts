import { notifyUser } from "@/lib/notifications/notification-service";
import type { ThreadType } from "@/types/messages";

function notificationCopy(threadType: ThreadType): { title: string; body: string } {
  switch (threadType) {
    case "booking":
      return {
        title: "Booking message",
        body: "A provider replied to your booking in MapAble.",
      };
    case "invoice":
      return {
        title: "Invoice message",
        body: "You have a new message about an invoice in MapAble.",
      };
    case "transport_trip":
      return {
        title: "Transport message",
        body: "You have a new transport update in MapAble.",
      };
    case "incident_safe_comms":
      return {
        title: "Safety message",
        body: "You have an important safety-related message in MapAble.",
      };
    default:
      return {
        title: "New message",
        body: "You have a new message in MapAble.",
      };
  }
}

export async function notifyThreadRecipients(params: {
  threadId: string;
  threadType: ThreadType;
  senderProfileId: string;
  recipientProfileIds: string[];
  includeMessageBodyInPush?: boolean;
  messagePreview?: string;
}) {
  const copy = notificationCopy(params.threadType);
  const body =
    params.includeMessageBodyInPush && params.messagePreview
      ? params.messagePreview.slice(0, 120)
      : copy.body;

  for (const profileId of params.recipientProfileIds) {
    if (profileId === params.senderProfileId) continue;
    await notifyUser(profileId, "support", copy.title, body, {
      actionPath: `/messages/threads/${params.threadId}`,
    });
  }
}
