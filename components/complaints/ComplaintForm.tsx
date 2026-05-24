"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { COMPLAINT_TYPE_LABELS } from "@/lib/disputes/labels";
import { Button } from "@/components/ui/button";

export function ComplaintForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="max-w-2xl space-y-4"
      aria-labelledby="complaint-form-heading"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const fd = new FormData(e.currentTarget);
        const res = await fetch("/api/complaints", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: fd.get("type"),
            title: fd.get("title"),
            description: fd.get("description"),
            bookingId: fd.get("bookingId") || undefined,
          }),
        });
        setLoading(false);
        if (res.ok) {
          const { complaint } = await res.json();
          router.push(`/dashboard/complaints/${complaint.id}`);
        } else {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? "Could not submit complaint.");
        }
      }}
    >
      <h1 id="complaint-form-heading" className="font-heading text-2xl font-bold">
        Make a complaint
      </h1>
      <p className="text-sm text-muted-foreground">
        We take complaints seriously. Safety-related complaints may be escalated
        to our incident team. You can also{" "}
        <a href="/dashboard/incidents/new" className="text-primary underline">
          report an incident
        </a>{" "}
        if someone may be at risk. In an emergency, call 000.
      </p>

      {error ? (
        <div role="alert" className="rounded-md border border-destructive p-3 text-sm">
          {error}
        </div>
      ) : null}

      <label htmlFor="complaint-type" className="text-sm font-medium">
        Type of concern
      </label>
      <select id="complaint-type" name="type" className={formInputClass} required>
        {Object.entries(COMPLAINT_TYPE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <label htmlFor="complaint-title" className="text-sm font-medium">
        Short title
      </label>
      <input id="complaint-title" name="title" className={formInputClass} required />

      <label htmlFor="complaint-description" className="text-sm font-medium">
        Tell us what happened
      </label>
      <textarea
        id="complaint-description"
        name="description"
        className={formInputClass}
        rows={6}
        required
      />

      <label htmlFor="complaint-booking" className="text-sm font-medium">
        Booking ID (optional)
      </label>
      <input id="complaint-booking" name="bookingId" className={formInputClass} />

      <Button type="submit" variant="default" size="default" loading={loading}>
        Submit complaint
      </Button>
    </form>
  );
}
