"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SafetyReportForm({ tripId }: { tripId?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/transport-mvp/safety-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tripId: tripId || undefined,
        title: fd.get("title"),
        description: fd.get("description"),
        severity: fd.get("severity"),
        immediateRiskPresent: fd.get("immediateRisk") === "on",
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not submit report");
      return;
    }
    setDone(true);
    router.refresh();
  }

  if (done) {
    return (
      <p className="rounded-lg border border-green-600/40 bg-green-50 p-4 dark:bg-green-950/20" role="status">
        Safety report submitted. Critical issues are escalated to the support desk for review.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4">
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <label className="block text-sm font-medium">
        Title
        <input name="title" required minLength={3} className="mt-1 min-h-11 w-full rounded-lg border px-3" />
      </label>
      <label className="block text-sm font-medium">
        Description
        <textarea
          name="description"
          required
          minLength={10}
          className="mt-1 min-h-32 w-full rounded-lg border px-3 py-2"
        />
      </label>
      <label className="block text-sm font-medium">
        Severity
        <select name="severity" className="mt-1 min-h-11 w-full rounded-lg border px-3" required>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical - immediate escalation</option>
        </select>
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" name="immediateRisk" className="h-5 w-5" />
        Immediate risk present
      </label>
      <p className="text-xs text-muted-foreground">
        Reports may be linked to incidents for quality review. This does not submit claims to
        the NDIS.
      </p>
      <button
        type="submit"
        disabled={loading}
        className="min-h-11 rounded-lg bg-primary px-6 font-semibold text-primary-foreground"
      >
        Submit safety report
      </button>
    </form>
  );
}
