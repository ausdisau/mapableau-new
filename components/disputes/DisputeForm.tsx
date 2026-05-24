"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { DISPUTE_TYPE_LABELS } from "@/lib/disputes/labels";
import { Button } from "@/components/ui/button";

export function DisputeForm({
  bookingId,
  invoiceId,
  timesheetId,
}: {
  bookingId?: string;
  invoiceId?: string;
  timesheetId?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="max-w-2xl space-y-4"
      aria-labelledby="dispute-form-heading"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const fd = new FormData(e.currentTarget);
        const res = await fetch("/api/disputes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: fd.get("type"),
            title: fd.get("title"),
            description: fd.get("description"),
            desiredOutcome: fd.get("desiredOutcome") || undefined,
            bookingId: bookingId || fd.get("bookingId") || undefined,
            invoiceId: invoiceId || fd.get("invoiceId") || undefined,
            timesheetId: timesheetId || fd.get("timesheetId") || undefined,
          }),
        });
        setLoading(false);
        if (res.ok) {
          const { dispute } = await res.json();
          router.push(`/dashboard/disputes/${dispute.id}`);
        } else {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? "Could not submit dispute.");
        }
      }}
    >
      <h1 id="dispute-form-heading" className="font-heading text-2xl font-bold">
        Raise a dispute
      </h1>
      <p className="text-sm text-muted-foreground">
        Use this form when something went wrong with a booking, invoice or
        support record. We will review and keep you updated. This is not legal
        advice. If you are in immediate danger, call 000.
      </p>

      {error ? (
        <div role="alert" className="rounded-md border border-destructive p-3 text-sm">
          {error}
        </div>
      ) : null}

      <label htmlFor="dispute-type" className="text-sm font-medium">
        What is this about?
      </label>
      <select id="dispute-type" name="type" className={formInputClass} required>
        {Object.entries(DISPUTE_TYPE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <label htmlFor="dispute-title" className="text-sm font-medium">
        Short title
      </label>
      <input id="dispute-title" name="title" className={formInputClass} required />

      <label htmlFor="dispute-description" className="text-sm font-medium">
        What happened?
      </label>
      <textarea
        id="dispute-description"
        name="description"
        className={formInputClass}
        rows={5}
        required
        aria-describedby="dispute-description-hint"
      />
      <p id="dispute-description-hint" className="text-xs text-muted-foreground">
        Share facts in your own words. You do not need to include medical or NDIS
        plan details.
      </p>

      <label htmlFor="dispute-outcome" className="text-sm font-medium">
        What would help resolve this? (optional)
      </label>
      <textarea
        id="dispute-outcome"
        name="desiredOutcome"
        className={formInputClass}
        rows={3}
      />

      {!bookingId ? (
        <>
          <label htmlFor="dispute-booking" className="text-sm font-medium">
            Booking ID (optional)
          </label>
          <input id="dispute-booking" name="bookingId" className={formInputClass} />
        </>
      ) : null}
      {!invoiceId ? (
        <>
          <label htmlFor="dispute-invoice" className="text-sm font-medium">
            Invoice ID (optional)
          </label>
          <input id="dispute-invoice" name="invoiceId" className={formInputClass} />
        </>
      ) : null}

      <Button type="submit" variant="default" size="default" loading={loading}>
        Submit dispute
      </Button>
    </form>
  );
}
