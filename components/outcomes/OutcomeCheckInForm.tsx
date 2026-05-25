"use client";

import { useState } from "react";

export function OutcomeCheckInForm({ goalId }: { goalId: string }) {
  const [narrative, setNarrative] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/outcomes/goals/${goalId}/checkins`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ narrativeUpdate: narrative }),
    });
    setNarrative("");
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border p-4">
      <h2 className="font-heading text-lg font-semibold">Progress check-in</h2>
      <label className="block text-sm">
        What&apos;s changed? (optional rating skipped — your words matter most)
        <textarea
          value={narrative}
          onChange={(e) => setNarrative(e.target.value)}
          className="mt-1 min-h-28 w-full rounded-lg border px-3"
        />
      </label>
      <button type="submit" className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground">
        Save check-in
      </button>
    </form>
  );
}
