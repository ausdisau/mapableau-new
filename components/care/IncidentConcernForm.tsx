"use client";

import { useState } from "react";

export function IncidentConcernForm({ shiftId }: { shiftId?: string }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const res = await fetch("/api/care/incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, shiftId, category: "safety" }),
    });
    setMessage(res.ok ? "Concern reported" : "Unable to report concern");
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border p-4">
      <input
        className="w-full rounded-lg border p-3"
        placeholder="Concern title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <textarea
        className="min-h-32 w-full rounded-lg border p-3"
        placeholder="What happened?"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />
      <button className="rounded-lg bg-primary px-4 py-3 text-primary-foreground" type="submit">
        Report concern
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

export function IncidentConcernForm({ shiftId }: { shiftId?: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setMessage(null);
        const form = new FormData(event.currentTarget);
        const response = await fetch("/api/care/incidents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            careShiftId: shiftId || undefined,
            category: form.get("category"),
            severity: form.get("severity"),
            title: form.get("title"),
            description: form.get("description"),
            safeguardingConcern: form.get("safeguardingConcern") === "on",
            immediateRiskPresent: form.get("immediateRiskPresent") === "on",
          }),
        });
        const data = await response.json();
        setMessage(response.ok ? "Concern submitted for review." : data.error);
        if (response.ok) router.refresh();
      }}
    >
      {message ? <p role="status" className="rounded-lg border p-3 text-sm">{message}</p> : null}
      <select name="category" className={formInputClass} defaultValue="unsafe_care">
        <option value="unsafe_care">Unsafe care</option>
        <option value="access_need_not_met">Access need not met</option>
        <option value="late_or_no_show">Late or no-show</option>
        <option value="safeguarding_concern">Safeguarding concern</option>
        <option value="other">Other</option>
      </select>
      <select name="severity" className={formInputClass} defaultValue="medium">
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="critical">Critical</option>
      </select>
      <input name="title" className={formInputClass} placeholder="Short title" required />
      <textarea name="description" className={formInputClass} rows={5} placeholder="What happened?" required />
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" name="safeguardingConcern" />
        Escalate as a quality and safeguards concern
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" name="immediateRiskPresent" />
        Immediate risk is present
      </label>
      <Button type="submit" variant="default" size="default">
        Submit concern
      </Button>
    </form>
  );
}
