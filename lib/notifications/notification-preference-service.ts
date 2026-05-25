export const NOTIFICATION_CATEGORIES = [
  "messages",
  "booking_updates",
  "transport_updates",
  "invoice_alerts",
  "support_desk",
  "safety_critical",
  "telehealth_reminders",
  "provider_jobs",
  "worker_roster",
] as const;

export type NotificationCategoryKey =
  (typeof NOTIFICATION_CATEGORIES)[number];

export type NotificationPreferences = Record<
  NotificationCategoryKey,
  { inApp: boolean; push: boolean; email: boolean }
>;

export function defaultNotificationPreferences(): NotificationPreferences {
  return Object.fromEntries(
    NOTIFICATION_CATEGORIES.map((c) => [
      c,
      {
        inApp: true,
        push: true,
        email: c === "invoice_alerts" || c === "booking_updates",
      },
    ])
  ) as NotificationPreferences;
}
