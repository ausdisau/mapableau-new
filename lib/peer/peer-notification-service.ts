import { notifyUser } from "@/lib/notifications/notification-service";
import { prisma } from "@/lib/prisma";

export type PeerNotificationKind =
  | "circle_reply"
  | "question_answered"
  | "mentor_request_update"
  | "event_reminder"
  | "moderation_update"
  | "safety_message"
  | "resource_recommended";

const TEMPLATES: Record<
  PeerNotificationKind,
  { title: string; body: string }
> = {
  circle_reply: {
    title: "MapAble Peer",
    body: "Someone replied in your MapAble Peer circle.",
  },
  question_answered: {
    title: "MapAble Peer",
    body: "Someone responded to your peer question.",
  },
  mentor_request_update: {
    title: "MapAble Peer",
    body: "Your peer mentor request has an update.",
  },
  event_reminder: {
    title: "MapAble Peer",
    body: "A MapAble Peer event starts soon.",
  },
  moderation_update: {
    title: "MapAble Peer",
    body: "There is an update about content you shared in MapAble Peer.",
  },
  safety_message: {
    title: "MapAble Peer — support",
    body: "Please check in-app safety resources. We are here to help.",
  },
  resource_recommended: {
    title: "MapAble Peer",
    body: "A new community resource may be useful for you.",
  },
};

export async function notifyPeerUser(
  userId: string,
  kind: PeerNotificationKind,
  _meta?: Record<string, string>
) {
  const profile = await prisma.peerProfile.findUnique({
    where: { userId },
    include: { privacySettings: true },
  });
  if (profile?.privacySettings?.pauseCommunityNotifications) return null;

  const template = TEMPLATES[kind];
  return notifyUser(userId, "peer", template.title, template.body);
}

export async function ensurePeerNotificationPreferences(userId: string) {
  const channels = ["in_app", "email"] as const;
  for (const channel of channels) {
    await prisma.notificationPreference.upsert({
      where: {
        userId_category_channel: {
          userId,
          category: "peer",
          channel,
        },
      },
      create: { userId, category: "peer", channel, enabled: true },
      update: {},
    });
  }
}
