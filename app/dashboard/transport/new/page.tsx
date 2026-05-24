"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { AccessNeedsForm } from "@/components/transport-osm/AccessNeedsForm";
import { Button } from "@/components/ui/button";

export default function NewTransportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="max-w-2xl space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        const fd = new FormData(e.currentTarget);
        const res = await fetch("/api/transport/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pickupAddress: fd.get("pickup"),
            dropoffAddress: fd.get("dropoff"),
            pickupWindowStart: new Date(
              String(fd.get("pickupTime"))
            ).toISOString(),
            driverAssistanceRequired: fd.get("assistance") === "on",
            shareAccessibility: fd.get("shareAccessibility") === "on",
            shareAccessibilityConfirmed: fd.get("shareAccessibility") === "on",
            companionCount: Number(fd.get("companionCount") ?? 0),
            accessNeeds: {
              boardingAssistance: fd.get("boardingAssistance") === "on",
              transferAssistance: fd.get("transferAssistance") === "on",
              hoistRequired: fd.get("hoistRequired") === "on",
            },
            mobilityAidSnapshot: {
              other: String(fd.get("mobilityNotes") ?? ""),
            },
            communicationPreferences: {
              preferredMethod: String(fd.get("commsPref") ?? "in_app"),
              noUnexpectedCalls: fd.get("noUnexpectedCalls") === "on",
            },
            pickupNotes: String(fd.get("pickupNotes") ?? ""),
            vehicleRequirements: {
              requiresWheelchairAccessible:
                fd.get("wheelchair") === "on",
            },
            status: "draft",
          }),
        });
        setLoading(false);
        if (res.ok) {
          const d = await res.json();
          router.push(`/dashboard/transport/${d.booking.id}`);
        }
      }}
    >
      <h1 className="font-heading text-2xl font-bold">Book accessible transport</h1>
      <p className="text-sm text-muted-foreground">
        Addresses are stored securely in MapAble. Maps use OpenStreetMap for routing only.
      </p>
      <label htmlFor="pickup" className="text-sm font-medium">
        Pickup address
      </label>
      <input id="pickup" name="pickup" className={formInputClass} required autoComplete="street-address" />
      <label htmlFor="dropoff" className="text-sm font-medium">
        Drop-off address
      </label>
      <input id="dropoff" name="dropoff" className={formInputClass} required autoComplete="street-address" />
      <label htmlFor="pickupTime" className="text-sm font-medium">
        Pickup window start
      </label>
      <input
        id="pickupTime"
        name="pickupTime"
        type="datetime-local"
        className={formInputClass}
        required
      />
      <AccessNeedsForm />
      <label className="flex min-h-11 items-center gap-2">
        <input type="checkbox" name="wheelchair" />
        Wheelchair accessible vehicle required
      </label>
      <label className="flex min-h-11 items-center gap-2">
        <input type="checkbox" name="assistance" />
        Driver assistance required
      </label>
      <label className="flex min-h-11 items-center gap-2">
        <input type="checkbox" name="shareAccessibility" />
        Include accessibility profile details (requires consent)
      </label>
      <Button type="submit" variant="default" size="default" loading={loading}>
        Save and continue
      </Button>
    </form>
  );
}
