import type { NotificationTemplateKey } from "@prisma/client";

/** Plain-language SMS/WhatsApp bodies — no sensitive health or NDIS details. */
const TEMPLATE_BODIES: Record<NotificationTemplateKey, (ctx: TemplateContext) => string> = {
  booking_confirmed: (ctx) =>
    `MapAble: Your booking is confirmed for ${ctx.dateLabel ?? "the scheduled time"}. Reply HELP for help or STOP to opt out.`,
  booking_reminder_24h: (ctx) =>
    `MapAble: Reminder — you have a booking in about 24 hours (${ctx.dateLabel ?? "see your dashboard"}). Reply HELP or STOP.`,
  booking_reminder_2h: (ctx) =>
    `MapAble: Reminder — your booking starts in about 2 hours. Reply HELP or STOP.`,
  transport_driver_assigned: () =>
    `MapAble: A driver has been assigned to your transport trip. Open the app for details. Reply HELP or STOP.`,
  transport_arriving: () =>
    `MapAble: Your driver is on the way. Open the app for live updates. Reply HELP or STOP.`,
  trip_completed: () =>
    `MapAble: Your trip is complete. Thank you for travelling with MapAble. Reply HELP or STOP.`,
  invoice_issued: (ctx) =>
    `MapAble: A new invoice (${ctx.invoiceRef ?? "see dashboard"}) is ready to view in your account. Reply HELP or STOP.`,
  invoice_overdue: (ctx) =>
    `MapAble: Invoice ${ctx.invoiceRef ?? ""} is overdue. Please check your dashboard. Reply HELP or STOP.`,
  support_message_received: () =>
    `MapAble: You have a new support message. Sign in to read it. Reply HELP or STOP.`,
  urgent_provider_alert: () =>
    `MapAble: Important update about your service. Please check the app or call support. Reply HELP or STOP.`,
};

export type TemplateContext = {
  dateLabel?: string;
  invoiceRef?: string;
  bookingRef?: string;
};

const SENSITIVE_PATTERNS = [
  /\bndis\b/i,
  /\bdiagnos/i,
  /\bmedical\b/i,
  /\bdisability\b/i,
  /\bsupport\s+plan\b/i,
  /\bplan\s+manager\b/i,
  /\bwheelchair\b/i,
  /\baccessibility\s+summary\b/i,
  /\bparticipant\s+notes\b/i,
];

export function renderNotificationTemplate(
  templateKey: NotificationTemplateKey,
  context: TemplateContext = {}
): string {
  const render = TEMPLATE_BODIES[templateKey];
  const body = render(context).replace(/\s+/g, " ").trim();
  assertNoSensitiveContent(body);
  return body;
}

export function assertNoSensitiveContent(text: string): void {
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error("SENSITIVE_CONTENT_IN_SMS");
    }
  }
}

export function redactMessageBody(body: string, maxLen = 160): string {
  return body.slice(0, maxLen);
}
