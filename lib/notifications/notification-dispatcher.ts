import type { NotificationCategory } from "@prisma/client";

import {
  isAgentMailConfigured,
  sendAgentMailEmail,
} from "@/lib/notifications/providers/agentmail-email";
import {
  isPusherBeamsConfigured,
  publishPusherBeamsToUser,
} from "@/lib/notifications/providers/pusher-beams";
import {
  isTwilioSmsConfigured,
  sendTwilioSms,
} from "@/lib/notifications/providers/twilio-sms";
import { prisma } from "@/lib/prisma";

export type NotificationDispatchOptions = {
  actionPath?: string;
};

function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

function buildExternalBody(body: string, actionPath?: string): {
  text: string;
  html: string;
} {
  const base = appBaseUrl();
  const link = actionPath ? `${base}${actionPath.startsWith("/") ? actionPath : `/${actionPath}`}` : base;
  const text = actionPath
    ? `${body}\n\nOpen MapAble: ${link}`
    : `${body}\n\nOpen MapAble: ${base}`;
  const html = actionPath
    ? `<p>${escapeHtml(body)}</p><p><a href="${escapeAttr(link)}">Open in MapAble</a></p>`
    : `<p>${escapeHtml(body)}</p><p><a href="${escapeAttr(base)}">Open MapAble</a></p>`;
  return { text, html };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

export function isExternalNotificationDispatchEnabled(): boolean {
  if (process.env.NOTIFICATION_DISPATCH_ENABLED === "false") return false;
  return (
    isAgentMailConfigured() ||
    isTwilioSmsConfigured() ||
    isPusherBeamsConfigured()
  );
}

async function isChannelEnabled(
  userId: string,
  category: NotificationCategory,
  channel: "email" | "sms" | "push"
): Promise<boolean> {
  const pref = await prisma.notificationPreference.findFirst({
    where: { userId, category, channel, enabled: true },
  });
  return Boolean(pref);
}

export async function dispatchExternalNotifications(params: {
  userId: string;
  category: NotificationCategory;
  title: string;
  body: string;
  options?: NotificationDispatchOptions;
}): Promise<{ email?: boolean; sms?: boolean; push?: boolean }> {
  if (!isExternalNotificationDispatchEnabled()) {
    return {};
  }

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { email: true, phone: true, name: true },
  });
  if (!user) return {};

  const { text, html } = buildExternalBody(params.body, params.options?.actionPath);
  const base = appBaseUrl();
  const deepLink = params.options?.actionPath
    ? `${base}${params.options.actionPath.startsWith("/") ? params.options.actionPath : `/${params.options.actionPath}`}`
    : base;
  const result: { email?: boolean; sms?: boolean; push?: boolean } = {};

  if (isAgentMailConfigured() && (await isChannelEnabled(params.userId, params.category, "email"))) {
    const emailResult = await sendAgentMailEmail({
      to: user.email,
      subject: params.title,
      text,
      html,
    });
    result.email = emailResult.ok;
    if (!emailResult.ok && process.env.NODE_ENV === "development") {
      console.warn("[notifications] AgentMail failed:", emailResult.error);
    }
  }

  if (
    isTwilioSmsConfigured() &&
    user.phone &&
    (await isChannelEnabled(params.userId, params.category, "sms"))
  ) {
    const smsResult = await sendTwilioSms({
      to: user.phone,
      body: `${params.title}: ${text}`,
    });
    result.sms = smsResult.ok;
    if (!smsResult.ok && process.env.NODE_ENV === "development") {
      console.warn("[notifications] Twilio SMS failed:", smsResult.error);
    }
  }

  if (isPusherBeamsConfigured() && (await isChannelEnabled(params.userId, params.category, "push"))) {
    const pushResult = await publishPusherBeamsToUser({
      userId: params.userId,
      title: params.title,
      body: params.body,
      deepLink,
    });
    result.push = pushResult.ok;
    if (!pushResult.ok && process.env.NODE_ENV === "development") {
      console.warn("[notifications] Pusher Beams failed:", pushResult.error);
    }
  }

  return result;
}
