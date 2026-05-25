"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";

export function TransportBookingForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const pickupWindowStart = new Date(
      `${String(fd.get("pickupDate"))}T${String(fd.get("pickupTime"))}`
    ).toISOString();

    const res = await fetch("/api/transport-mvp/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pickupAddress: fd.get("pickupAddress"),
        dropoffAddress: fd.get("dropoffAddress"),
        pickupWindowStart,
        pickupNotes: fd.get("pickupNotes") || undefined,
        dropoffNotes: fd.get("dropoffNotes") || undefined,
        wheelchairRequired: fd.get("wheelchairRequired") === "on",
        assistedPickup: fd.get("assistedPickup") === "on",
        assistedDropoff: fd.get("assistedDropoff") === "on",
        driverAssistanceRequired: fd.get("driverAssistanceRequired") === "on",
        assistanceNotes: fd.get("assistanceNotes") || undefined,
        shareAccessibility: fd.get("shareAccessibility") === "on",
        shareAccessibilityConfirmed: fd.get("shareAccessibility") === "on",
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not submit request");
      return;
    }
    router.push("/transport/trips");
    router.refresh();
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().slice(0, 10);

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-6">
      {error ? (
        <p className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <label htmlFor="pickupAddress" className="block text-sm font-medium">
        Pickup address
      </label>
      <input id="pickupAddress" name="pickupAddress" className={formInputClass} required />

      <label htmlFor="dropoffAddress" className="block text-sm font-medium">
        Drop-off address
      </label>
      <input id="dropoffAddress" name="dropoffAddress" className={formInputClass} required />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="pickupDate" className="block text-sm font-medium">
            Pickup date
          </label>
          <input
            id="pickupDate"
            name="pickupDate"
            type="date"
            defaultValue={defaultDate}
            className={formInputClass}
            required
          />
        </div>
        <div>
          <label htmlFor="pickupTime" className="block text-sm font-medium">
            Pickup time
          </label>
          <input
            id="pickupTime"
            name="pickupTime"
            type="time"
            defaultValue="09:00"
            className={formInputClass}
            required
          />
        </div>
      </div>

      <label htmlFor="pickupNotes" className="block text-sm font-medium">
        Pickup notes
      </label>
      <input id="pickupNotes" name="pickupNotes" className={formInputClass} />

      <label htmlFor="dropoffNotes" className="block text-sm font-medium">
        Drop-off notes
      </label>
      <input id="dropoffNotes" name="dropoffNotes" className={formInputClass} />

      <fieldset className="space-y-3 rounded-xl border p-4">
        <legend className="px-1 font-semibold">Access needs</legend>
        <label className="flex min-h-11 items-center gap-2">
          <input type="checkbox" name="wheelchairRequired" className="h-5 w-5" />
          Wheelchair-accessible vehicle required
        </label>
        <label className="flex min-h-11 items-center gap-2">
          <input type="checkbox" name="assistedPickup" className="h-5 w-5" />
          Assisted pickup
        </label>
        <label className="flex min-h-11 items-center gap-2">
          <input type="checkbox" name="assistedDropoff" className="h-5 w-5" />
          Assisted drop-off
        </label>
        <label className="flex min-h-11 items-center gap-2">
          <input type="checkbox" name="driverAssistanceRequired" className="h-5 w-5" />
          Driver assistance during trip
        </label>
        <label htmlFor="assistanceNotes" className="block text-sm font-medium">
          Additional notes
        </label>
        <textarea
          id="assistanceNotes"
          name="assistanceNotes"
          className={`${formInputClass} min-h-20`}
        />
        <label className="flex min-h-11 items-start gap-2 text-sm">
          <input type="checkbox" name="shareAccessibility" className="mt-1 h-5 w-5" />
          Share access needs with my transport provider (requires active consent)
        </label>
      </fieldset>

      <p className="text-xs text-muted-foreground">
        This request does not constitute NDIS payment approval. Pricing is estimated separately.
      </p>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex min-h-11 items-center rounded-lg bg-primary px-6 font-semibold text-primary-foreground disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Request transport"}
      </button>
    </form>
  );
}
