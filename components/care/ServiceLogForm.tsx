"use client";

import { useState } from "react";

export function ServiceLogForm({ shiftId }: { shiftId: string }) {
  const [workerNotes, setWorkerNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const res = await fetch("/api/care/service-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shiftId,
        tasksCompleted: [{ label: "Support tasks completed" }],
        workerNotes,
      }),
    });
    setMessage(res.ok ? "Service log submitted" : "Unable to submit service log");
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border p-4">
      <label className="block text-sm font-medium" htmlFor="worker-notes">
        Worker notes
      </label>
      <textarea
        id="worker-notes"
        className="min-h-32 w-full rounded-lg border p-3"
        value={workerNotes}
        onChange={(event) => setWorkerNotes(event.target.value)}
      />
      <button className="rounded-lg bg-primary px-4 py-3 text-primary-foreground" type="submit">
        Submit service log
      </button>
      {message ? <p className="text-sm">{message}</p> : null}
    </form>
  );
}
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

export function ServiceLogForm({ shiftId }: { shiftId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        const form = new FormData(event.currentTarget);
        const response = await fetch("/api/care/service-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shiftId,
            workerNotes: form.get("workerNotes") || undefined,
            tasksCompleted: [{ label: form.get("tasksCompleted") || "Support delivered" }],
          }),
        });
        if (!response.ok) {
          const data = await response.json();
          setError(data.error ?? "Could not submit service log");
          return;
        }
        router.push(`/worker/shifts/${shiftId}`);
        router.refresh();
      }}
    >
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      <label className="block space-y-2 text-sm font-medium">
        Tasks completed
        <input name="tasksCompleted" className={formInputClass} />
      </label>
      <label className="block space-y-2 text-sm font-medium">
        Worker notes
        <textarea name="workerNotes" rows={5} className={formInputClass} />
      </label>
      <Button type="submit" variant="default" size="default">
        Submit service log
      </Button>
    </form>
  );
}
