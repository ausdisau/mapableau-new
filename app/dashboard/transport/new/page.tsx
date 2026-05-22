"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
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
            vehicleRequirements: {
              requiresWheelchairAccessible:
                fd.get("wheelchair") === "on",
            },
          }),
        });
        setLoading(false);
        if (res.ok) {
          const d = await res.json();
          router.push(`/dashboard/transport/${d.booking.id}`);
        }
      }}
    >
      <h1 className="font-heading text-2xl font-bold">New transport booking</h1>
      <p className="text-sm text-muted-foreground">
        Live GPS tracking and route optimisation are not available in this pilot.
      </p>
      <label htmlFor="pickup" className="text-sm font-medium">
        Pickup address
      </label>
      <input id="pickup" name="pickup" className={formInputClass} required />
      <label htmlFor="dropoff" className="text-sm font-medium">
        Drop-off address
      </label>
      <input id="dropoff" name="dropoff" className={formInputClass} required />
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
        Request transport
      </Button>
    </form>
  );
}
