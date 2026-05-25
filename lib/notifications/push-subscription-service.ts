/**
 * Push subscription storage — server-side persistence via API routes.
 * Client must not request permission until user opts in.
 */

export type PushSubscriptionRecord = {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: Date;
};

export function redactNotificationBody(
  category: string,
  raw: string
): string {
  const safe: Record<string, string> = {
    messages: "You have a new MapAble message.",
    booking_updates: "Your booking has been updated.",
    transport_updates: "Your transport trip has been updated.",
    invoice_alerts: "You have an invoice waiting for review.",
    support_desk: "You have a support desk update.",
    safety_critical: "Important safety notification from MapAble.",
    telehealth_reminders: "You have an upcoming telehealth session.",
    provider_jobs: "You have a provider job update.",
    worker_roster: "Your roster has been updated.",
  };
  if (safe[category]) return safe[category];

  const sensitive = [
    /ndis/i,
    /plan/i,
    /diagnos/i,
    /incident/i,
    /invoice.*\$/i,
    /\d+\s*(street|st|road|rd)/i,
  ];
  if (sensitive.some((r) => r.test(raw))) {
    return "You have a new MapAble notification.";
  }
  return raw.slice(0, 120);
}
