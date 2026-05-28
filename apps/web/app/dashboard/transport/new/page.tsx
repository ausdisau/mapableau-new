"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

export default function NewTransportTripPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="max-w-2xl space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const fd = new FormData(e.currentTarget);
        const scheduledStart = new Date(String(fd.get("scheduledStart"))).toISOString();
        const scheduledEndRaw = fd.get("scheduledEnd");
        const scheduledEnd =
          scheduledEndRaw && String(scheduledEndRaw)
            ? new Date(String(scheduledEndRaw)).toISOString()
            : undefined;

        const mobilityRequirements: Record<string, unknown> = {};
        if (fd.get("wheelchair") === "on") {
          mobilityRequirements.requiresWheelchairAccessible = true;
        }
        if (fd.get("assistance") === "on") {
          mobilityRequirements.driverAssistanceRequired = true;
        }

        const res = await fetch("/api/transport/trips", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pickupAddress: fd.get("pickupAddress"),
            pickupSuburb: fd.get("pickupSuburb") || undefined,
            dropoffAddress: fd.get("dropoffAddress"),
            dropoffSuburb: fd.get("dropoffSuburb") || undefined,
            scheduledStart,
            scheduledEnd,
            accessNotes: fd.get("accessNotes") || undefined,
            mobilityRequirements:
              Object.keys(mobilityRequirements).length > 0
                ? mobilityRequirements
                : undefined,
          }),
        });
        setLoading(false);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(
            typeof data.error === "string"
              ? data.error
              : "Could not create the trip. Please check your details and try again."
          );
          return;
        }
        const tripId = data.trip?.id;
        if (tripId) {
          router.push(`/dashboard/transport/${tripId}`);
        } else {
          router.push("/dashboard/transport");
        }
      }}
    >
      <h1 className="font-heading text-2xl font-bold">New transport trip</h1>
      <p className="text-sm text-muted-foreground">
        Route estimates are advisory and are not a guarantee of timing or NDIS
        payment approval. Live GPS tracking is not available in this pilot.
      </p>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <label htmlFor="pickupAddress" className="text-sm font-medium">
        Pickup address
      </label>
      <input
        id="pickupAddress"
        name="pickupAddress"
        className={formInputClass}
        required
        minLength={3}
      />
      <label htmlFor="pickupSuburb" className="text-sm font-medium">
        Pickup suburb (optional)
      </label>
      <input id="pickupSuburb" name="pickupSuburb" className={formInputClass} />
      <label htmlFor="dropoffAddress" className="text-sm font-medium">
        Drop-off address
      </label>
      <input
        id="dropoffAddress"
        name="dropoffAddress"
        className={formInputClass}
        required
        minLength={3}
      />
      <label htmlFor="dropoffSuburb" className="text-sm font-medium">
        Drop-off suburb (optional)
      </label>
      <input id="dropoffSuburb" name="dropoffSuburb" className={formInputClass} />
      <label htmlFor="scheduledStart" className="text-sm font-medium">
        Scheduled start
      </label>
      <input
        id="scheduledStart"
        name="scheduledStart"
        type="datetime-local"
        className={formInputClass}
        required
      />
      <label htmlFor="scheduledEnd" className="text-sm font-medium">
        Scheduled end (optional)
      </label>
      <input
        id="scheduledEnd"
        name="scheduledEnd"
        type="datetime-local"
        className={formInputClass}
      />
      <label htmlFor="accessNotes" className="text-sm font-medium">
        Access notes (optional)
      </label>
      <textarea
        id="accessNotes"
        name="accessNotes"
        className={formInputClass}
        rows={3}
        maxLength={2000}
      />
      <label className="flex min-h-11 items-center gap-2">
        <input type="checkbox" name="wheelchair" />
        Wheelchair accessible vehicle required
      </label>
      <label className="flex min-h-11 items-center gap-2">
        <input type="checkbox" name="assistance" />
        Driver assistance required
      </label>
      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" variant="default" size="default" loading={loading}>
          Request transport trip
        </Button>
        <Link
          href="/dashboard/transport"
          className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
