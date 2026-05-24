"use client";

import { useState } from "react";

export function HomeVisitRiskChecklist({
  appointmentId,
}: {
  appointmentId: string;
}) {
  const [accessClear, setAccessClear] = useState(false);
  const [petsDisclosed, setPetsDisclosed] = useState(false);
  const [supportPersonPresent, setSupportPersonPresent] = useState(false);
  const [hazardsNoted, setHazardsNoted] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function submit() {
    const res = await fetch(
      `/api/moves/appointments/${appointmentId}/risk-check`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessClear,
          petsDisclosed,
          supportPersonPresent,
          hazardsNoted: hazardsNoted || undefined,
        }),
      },
    );
    setStatus(res.ok ? "Risk checklist saved." : "Save failed.");
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">
      <h2 className="font-medium">Home visit risk checklist</h2>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={accessClear}
          onChange={(e) => setAccessClear(e.target.checked)}
        />
        Access path is clear
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={petsDisclosed}
          onChange={(e) => setPetsDisclosed(e.target.checked)}
        />
        Pets disclosed to therapist
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={supportPersonPresent}
          onChange={(e) => setSupportPersonPresent(e.target.checked)}
        />
        Support person will be present if needed
      </label>
      <div>
        <label htmlFor="hazards" className="block text-sm font-medium">
          Hazards noted
        </label>
        <textarea
          id="hazards"
          value={hazardsNoted}
          onChange={(e) => setHazardsNoted(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-lg border border-border px-3 py-2"
        />
      </div>
      <button
        type="button"
        onClick={submit}
        className="min-h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
      >
        Save checklist
      </button>
      {status ? (
        <p role="status" className="text-sm text-muted-foreground">
          {status}
        </p>
      ) : null}
    </section>
  );
}
