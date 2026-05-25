"use client";

import { useState } from "react";

import {
  NOTIFICATION_CATEGORIES,
  defaultNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/notifications/notification-preference-service";

const LABELS: Record<string, string> = {
  messages: "Messages",
  booking_updates: "Booking updates",
  transport_updates: "Transport",
  invoice_alerts: "Invoices",
  support_desk: "Support desk",
  safety_critical: "Safety (important)",
  telehealth_reminders: "Telehealth",
  provider_jobs: "Provider jobs",
  worker_roster: "Worker roster",
};

export function NotificationPreferencesPanel() {
  const [prefs, setPrefs] = useState<NotificationPreferences>(
    defaultNotificationPreferences()
  );

  return (
    <fieldset className="space-y-4">
      <legend className="font-heading text-lg font-bold">
        Notification channels
      </legend>
      {NOTIFICATION_CATEGORIES.map((cat) => (
        <div
          key={cat}
          className="rounded-xl border border-border p-4"
        >
          <p className="font-medium">{LABELS[cat] ?? cat}</p>
          <div className="mt-2 flex flex-wrap gap-4">
            {(["inApp", "push", "email"] as const).map((channel) => (
              <label
                key={channel}
                className="flex min-h-11 items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={prefs[cat][channel]}
                  onChange={(e) =>
                    setPrefs((p) => ({
                      ...p,
                      [cat]: { ...p[cat], [channel]: e.target.checked },
                    }))
                  }
                  className="h-5 w-5"
                />
                {channel === "inApp"
                  ? "In app"
                  : channel === "push"
                    ? "Push"
                    : "Email"}
              </label>
            ))}
          </div>
        </div>
      ))}
    </fieldset>
  );
}
