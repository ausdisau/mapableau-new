"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

const ALERT_TYPES = [
  { value: "broken_lift", label: "Broken lift" },
  { value: "blocked_ramp", label: "Blocked ramp" },
  { value: "inaccessible_toilet", label: "Inaccessible toilet" },
  { value: "construction_barrier", label: "Construction barrier" },
  { value: "inaccessible_transport_stop", label: "Inaccessible transport stop" },
  { value: "temporary_closure", label: "Temporary closure" },
  { value: "crowding_sensory_risk", label: "Crowding or sensory overload risk" },
  { value: "urgent_hazard", label: "Urgent access hazard" },
] as const;

export function AccessAlertForm({
  placeId,
  placeName,
}: {
  placeId?: string;
  placeName?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);

    const res = await fetch("/api/access/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        placeId: placeId ?? fd.get("placeId") ?? undefined,
        alertType: fd.get("alertType"),
        title: fd.get("title"),
        description: fd.get("description") || undefined,
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const j = await res.json();
      setError(j.error ?? "Could not submit alert");
      return;
    }

    if (placeId) {
      router.push(`/access/places/${placeId}`);
    } else {
      router.push("/access");
    }
  }

  return (
    <form className="mx-auto max-w-xl space-y-4" onSubmit={onSubmit}>
      <p className="text-sm text-muted-foreground">
        Flag a temporary access issue. Alerts expire after 7 days unless updated.
      </p>

      {placeName ? (
        <p className="text-sm">
          Place: <strong>{placeName}</strong>
        </p>
      ) : (
        <AccessibleFormField id="placeId" label="Place ID" hint="Optional if reporting at a known place">
          <input id="placeId" name="placeId" className={formInputClass} />
        </AccessibleFormField>
      )}

      <AccessibleFormField id="alertType" label="Alert type" required>
        <select id="alertType" name="alertType" className={formInputClass} required>
          {ALERT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </AccessibleFormField>

      <AccessibleFormField id="title" label="Short title" required>
        <input id="title" name="title" className={formInputClass} required minLength={3} />
      </AccessibleFormField>

      <AccessibleFormField id="description" label="What did you observe?">
        <textarea id="description" name="description" rows={4} className={formInputClass} />
      </AccessibleFormField>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" variant="default" size="default" loading={loading}>
        Submit alert
      </Button>
    </form>
  );
}
