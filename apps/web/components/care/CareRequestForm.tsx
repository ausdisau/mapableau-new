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

export function CareRequestForm({ redirectBase = "/care" }: { redirectBase?: string }) {
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
        const tasksRaw = fd.get("tasks") as string;
        let tasks: { name: string; intensity?: string }[] = [];
        try {
          if (tasksRaw?.trim()) tasks = JSON.parse(tasksRaw);
        } catch {
          tasks = [{ name: tasksRaw || "General support", intensity: "standard" }];
        }

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
            shareAccessibilityConfirmed: fd.get("shareAccessibility") === "on",
            accessRequirementsSummary: fd.get("accessSummary") || undefined,
            tasks,
          }),
        });
        setLoading(false);
        if (!res.ok) {
          const d = await res.json();
          setError(d.error ?? "Could not create request");
          return;
        }
        const d = await res.json();
        const id = d.request?.id;
        if (id) {
          await fetch(`/api/care/requests/${id}/submit`, { method: "POST" });
        }
        router.push(`${redirectBase}/bookings`);
      }}
    >
      {error ? (
        <div role="alert" className="rounded-lg border border-destructive p-3 text-sm">
          {error}
        </div>
      ) : null}
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
      <label htmlFor="tasks" className="text-sm font-medium">
        Support tasks (JSON array or plain text)
      </label>
      <textarea
        id="tasks"
        name="tasks"
        className={formInputClass}
        rows={2}
        placeholder='[{"name":"Personal care","intensity":"standard"}]'
      />
      <label htmlFor="accessSummary" className="text-sm font-medium">
        Access needs summary
      </label>
      <textarea id="accessSummary" name="accessSummary" className={formInputClass} rows={2} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="shareAccessibility" />
        Share accessibility needs with assigned provider (requires consent)
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="linkedTransport" />
        Link transport if needed
      </label>
      <Button type="submit" variant="default" size="default" disabled={loading}>
        {loading ? "Submitting…" : "Submit care request"}
      </Button>
    </form>
  );
}
