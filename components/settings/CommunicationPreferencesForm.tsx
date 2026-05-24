"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

type PrefRow = {
  channel: string;
  notificationType: string;
  enabled: boolean;
  consentStatus: string;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  accessibleCommunicationMode?: string | null;
};

const CHANNEL_LABELS: Record<string, string> = {
  sms: "SMS",
  voice: "Voice call",
  whatsapp: "WhatsApp (when available)",
  in_app: "In-app",
  email: "Email",
};

const NOTIFICATION_TYPES = [
  { id: "booking", label: "Bookings" },
  { id: "transport", label: "Transport" },
  { id: "billing", label: "Billing" },
  { id: "support", label: "Support" },
  { id: "urgent", label: "Urgent alerts" },
];

const ACCESSIBLE_MODES = [
  { value: "plain_language", label: "Plain language" },
  { value: "short_messages", label: "Short messages" },
  { value: "large_text_app", label: "Large text in app" },
  { value: "support_person_cc", label: "Copy support person (in app only)" },
];

export function CommunicationPreferencesForm({
  initial,
}: {
  initial: PrefRow[];
}) {
  const [prefs, setPrefs] = useState(initial);
  const [quietStart, setQuietStart] = useState(
    initial.find((p) => p.quietHoursStart)?.quietHoursStart ?? "22:00"
  );
  const [quietEnd, setQuietEnd] = useState(
    initial.find((p) => p.quietHoursEnd)?.quietHoursEnd ?? "07:00"
  );
  const [accessibleMode, setAccessibleMode] = useState(
    initial.find((p) => p.accessibleCommunicationMode)?.accessibleCommunicationMode ??
      "plain_language"
  );
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const channelRows = useMemo(() => {
    const channels = ["sms", "voice", "whatsapp", "in_app"] as const;
    return channels.map((channel) => ({
      channel,
      label: CHANNEL_LABELS[channel] ?? channel,
    }));
  }, []);

  function isEnabled(channel: string, notificationType: string) {
    return prefs.some(
      (p) =>
        p.channel === channel &&
        p.notificationType === notificationType &&
        p.enabled
    );
  }

  function toggle(channel: string, notificationType: string, enabled: boolean) {
    setPrefs((current) => {
      const idx = current.findIndex(
        (p) => p.channel === channel && p.notificationType === notificationType
      );
      if (idx >= 0) {
        const next = [...current];
        next[idx] = {
          ...next[idx],
          enabled,
          consentStatus: enabled ? "opted_in" : "opted_out",
        };
        return next;
      }
      return [
        ...current,
        {
          channel,
          notificationType,
          enabled,
          consentStatus: enabled ? "opted_in" : "opted_out",
        },
      ];
    });
  }

  return (
    <form
      className="max-w-2xl space-y-8"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        const payload = prefs.map((p) => ({
          ...p,
          quietHoursStart: quietStart,
          quietHoursEnd: quietEnd,
          accessibleCommunicationMode: accessibleMode,
        }));
        const res = await fetch("/api/communication-preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferences: payload }),
        });
        setLoading(false);
        setStatus(res.ok ? "Communication preferences saved." : "Could not save.");
      }}
    >
      <fieldset className="space-y-3">
        <legend className="font-heading text-lg font-semibold">
          Notification channels by type
        </legend>
        <p className="text-sm text-muted-foreground">
          Choose how we contact you. SMS and WhatsApp use short, non-clinical
          messages only. Reply STOP on SMS to opt out.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="p-2 text-left" scope="col">
                  Type
                </th>
                {channelRows.map((c) => (
                  <th key={c.channel} className="p-2 text-left" scope="col">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {NOTIFICATION_TYPES.map((nt) => (
                <tr key={nt.id} className="border-t border-border">
                  <th className="p-2 text-left font-medium" scope="row">
                    {nt.label}
                  </th>
                  {channelRows.map((c) => (
                    <td key={`${nt.id}-${c.channel}`} className="p-2">
                      <label className="flex min-h-11 items-center justify-center">
                        <span className="sr-only">
                          {nt.label} via {c.label}
                        </span>
                        <input
                          type="checkbox"
                          checked={isEnabled(c.channel, nt.id)}
                          onChange={(e) =>
                            toggle(c.channel, nt.id, e.target.checked)
                          }
                        />
                      </label>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="font-heading text-lg font-semibold">Quiet hours</legend>
        <p className="text-sm text-muted-foreground">
          We will not send SMS or WhatsApp during quiet hours (urgent safety alerts
          may still apply and are audited).
        </p>
        <div className="flex flex-wrap gap-4">
          <div>
            <label htmlFor="quiet-start" className="text-sm font-medium">
              From
            </label>
            <input
              id="quiet-start"
              type="time"
              className="mt-1 flex min-h-11 rounded-md border border-border px-3"
              value={quietStart}
              onChange={(e) => setQuietStart(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="quiet-end" className="text-sm font-medium">
              Until
            </label>
            <input
              id="quiet-end"
              type="time"
              className="mt-1 flex min-h-11 rounded-md border border-border px-3"
              value={quietEnd}
              onChange={(e) => setQuietEnd(e.target.value)}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="font-heading text-lg font-semibold">
          Accessible communication
        </legend>
        <label htmlFor="accessible-mode" className="text-sm font-medium">
          Preferred style
        </label>
        <select
          id="accessible-mode"
          className="flex min-h-11 w-full max-w-md rounded-md border border-border bg-background px-3 text-sm"
          value={accessibleMode ?? "plain_language"}
          onChange={(e) => setAccessibleMode(e.target.value)}
        >
          {ACCESSIBLE_MODES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </fieldset>

      {status ? (
        <p role="status" aria-live="polite" className="text-sm">
          {status}
        </p>
      ) : null}

      <Button type="submit" variant="default" size="default" loading={loading}>
        Save communication preferences
      </Button>
    </form>
  );
}
