"use client";

import { useState } from "react";

export function AccessibleRoutePlanner() {
  const [result, setResult] = useState<{
    warnings: string[];
    confidence: string;
    durationSeconds: number;
  } | null>(null);

  async function plan(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/routes/accessible-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin: { lat: Number(form.get("olat")), lng: Number(form.get("olng")) },
        destination: {
          lat: Number(form.get("dlat")),
          lng: Number(form.get("dlng")),
        },
        wheelchairPreferred: true,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setResult(data.plan);
    }
  }

  return (
    <form onSubmit={plan} className="space-y-4">
      <fieldset>
        <legend className="font-medium">Origin coordinates (demo)</legend>
        <input name="olat" defaultValue="-33.87" className="mr-2 min-h-11 rounded border px-2" aria-label="Origin latitude" />
        <input name="olng" defaultValue="151.21" className="min-h-11 rounded border px-2" aria-label="Origin longitude" />
      </fieldset>
      <fieldset>
        <legend className="font-medium">Destination coordinates (demo)</legend>
        <input name="dlat" defaultValue="-33.89" className="mr-2 min-h-11 rounded border px-2" aria-label="Destination latitude" />
        <input name="dlng" defaultValue="151.25" className="min-h-11 rounded border px-2" aria-label="Destination longitude" />
      </fieldset>
      <button type="submit" className="min-h-11 rounded bg-primary px-4 text-primary-foreground">
        Plan route
      </button>
      {result ? (
        <div className="rounded border p-4" role="status">
          <p>Confidence: {result.confidence}</p>
          <p>About {Math.round(result.durationSeconds / 60)} minutes</p>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {result.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </form>
  );
}
