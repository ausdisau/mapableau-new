"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

const REQUEST_TYPES = [
  "personal_care",
  "domestic_assistance",
  "community_access",
  "appointment_support",
  "employment_support",
  "other",
] as const;

export default function NewCareRequestPage() {
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
        const res = await fetch("/api/care/requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestType: fd.get("requestType"),
            title: fd.get("title"),
            description: fd.get("description"),
            address: fd.get("address"),
            linkedTransportRequired: fd.get("linkedTransport") === "on",
            shareAccessibility: fd.get("shareAccessibility") === "on",
            shareAccessibilityConfirmed:
              fd.get("shareAccessibility") === "on",
            accessRequirementsSummary: fd.get("accessSummary") || undefined,
          }),
        });
        setLoading(false);
        if (!res.ok) {
          const d = await res.json();
          setError(d.error ?? "Could not create request");
          return;
        }
        const d = await res.json();
        router.push(`/dashboard/care/${d.request.id}`);
      }}
    >
      <h1 className="font-heading text-2xl font-bold">New care request</h1>
      {error ? (
        <div role="alert" className="rounded-lg border border-destructive p-3 text-sm">
          {error}
        </div>
      ) : null}
      <p className="text-sm text-muted-foreground">
        Only you, assigned providers, and MapAble admins can see full request
        details unless you share accessibility information with consent.
      </p>
      <label htmlFor="requestType" className="text-sm font-medium">
        Request type
      </label>
      <select id="requestType" name="requestType" className={formInputClass} required>
        {REQUEST_TYPES.map((t) => (
          <option key={t} value={t}>
            {t.replace(/_/g, " ")}
          </option>
        ))}
      </select>
      <label htmlFor="title" className="text-sm font-medium">
        Title
      </label>
      <input id="title" name="title" className={formInputClass} required />
      <label htmlFor="description" className="text-sm font-medium">
        Description
      </label>
      <textarea id="description" name="description" className={formInputClass} rows={4} required />
      <label htmlFor="address" className="text-sm font-medium">
        Address
      </label>
      <input id="address" name="address" className={formInputClass} />
      <label htmlFor="accessSummary" className="text-sm font-medium">
        Access requirements summary (optional)
      </label>
      <textarea id="accessSummary" name="accessSummary" className={formInputClass} rows={3} />
      <label className="flex min-h-11 items-center gap-2">
        <input type="checkbox" name="shareAccessibility" />
        Copy accessibility preferences into this request (requires consent)
      </label>
      <label className="flex min-h-11 items-center gap-2">
        <input type="checkbox" name="linkedTransport" />
        I need linked accessible transport for this care
      </label>
      <Button type="submit" variant="default" size="default" loading={loading}>
        Save draft
      </Button>
    </form>
  );
}
