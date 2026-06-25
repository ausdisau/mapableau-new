"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AddAccessAlertForm({ placeId }: { placeId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link href={`/access/places/${placeId}`} className="text-sm underline">
        ← Back to place
      </Link>
      <h1 className="text-2xl font-bold">Flag an access alert</h1>
      <p className="text-sm text-muted-foreground">
        Report temporary access issues such as broken lifts or blocked ramps.
        Describe what you observed.
      </p>

      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          const fd = new FormData(e.currentTarget);
          const res = await fetch(`/api/access/places/${placeId}/alerts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              alertType: fd.get("alertType"),
              title: fd.get("title"),
              description: fd.get("description") || undefined,
            }),
          });
          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            setError(
              typeof j.error === "string" ? j.error : "Could not create alert"
            );
            return;
          }
          router.push(`/access/places/${placeId}`);
        }}
      >
        <label className="block text-sm">
          Alert type
          <select
            name="alertType"
            className="mt-1 block w-full min-h-11 rounded border px-3"
            required
          >
            <option value="broken_lift">Broken lift</option>
            <option value="blocked_ramp">Blocked ramp</option>
            <option value="inaccessible_toilet">Inaccessible toilet</option>
            <option value="construction_barrier">Construction barrier</option>
            <option value="temporary_closure">Temporary closure</option>
            <option value="crowding_risk">Crowding risk</option>
            <option value="sensory_overload">Sensory overload risk</option>
            <option value="urgent_hazard">Urgent access hazard</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="block text-sm">
          Title
          <input
            name="title"
            required
            maxLength={200}
            className="mt-1 block w-full min-h-11 rounded border px-3"
            placeholder="e.g. Side ramp blocked by delivery van"
          />
        </label>
        <label className="block text-sm">
          Details (optional)
          <textarea
            name="description"
            rows={4}
            className="mt-1 block w-full rounded border px-3 py-2"
            placeholder="When did you see this? What was blocked?"
          />
        </label>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground"
        >
          Submit alert
        </button>
      </form>
    </div>
  );
}
