"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Alert = {
  id: string;
  title: string;
  summary: string;
  severity: string;
  regionCode: string;
};

export default function DisasterAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [region, setRegion] = useState("NSW");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/emergency/alerts?regionCode=${region}`)
      .then((r) => r.json())
      .then((d) => setAlerts(d.alerts ?? []));
  }, [region]);

  async function subscribe() {
    const res = await fetch("/api/emergency/alerts/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ regionCode: region }),
    });
    setStatus(res.ok ? `Subscribed to ${region} alerts.` : "Subscribe failed");
  }

  return (
    <div className="space-y-6 max-w-xl">
      <Link href="/dashboard/emergency" className="text-sm text-primary underline">
        ← Emergency
      </Link>
      <h1 className="font-heading text-2xl font-bold">Disaster alerts</h1>
      <div className="flex gap-2 items-end">
        <div>
          <label htmlFor="region" className="block text-sm font-medium">
            Region code
          </label>
          <input
            id="region"
            value={region}
            onChange={(e) => setRegion(e.target.value.toUpperCase())}
            className="mt-1 min-h-10 rounded-lg border border-border px-3"
          />
        </div>
        <button
          type="button"
          onClick={subscribe}
          className="min-h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Subscribe
        </button>
      </div>
      {status ? (
        <p role="status" className="text-sm">
          {status}
        </p>
      ) : null}
      <ul className="space-y-3">
        {alerts.map((a) => (
          <li key={a.id} className="rounded-lg border border-border p-4">
            <p className="font-medium">
              {a.title} — {a.severity}
            </p>
            <p className="text-sm mt-1">{a.summary}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
