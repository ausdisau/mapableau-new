"use client";

import { useState } from "react";

type Props = {
  initial?: {
    mobilitySummary?: string | null;
    communicationNeeds?: string | null;
    supportNeedsSummary?: string | null;
    defaultPickupAddress?: string | null;
    sharedWithCoordinator?: boolean;
  };
};

export function EmergencyProfileForm({ initial }: Props) {
  const [mobility, setMobility] = useState(initial?.mobilitySummary ?? "");
  const [communication, setCommunication] = useState(
    initial?.communicationNeeds ?? "",
  );
  const [support, setSupport] = useState(initial?.supportNeedsSummary ?? "");
  const [pickup, setPickup] = useState(initial?.defaultPickupAddress ?? "");
  const [shared, setShared] = useState(initial?.sharedWithCoordinator ?? false);
  const [status, setStatus] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/emergency/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mobilitySummary: mobility,
        communicationNeeds: communication,
        supportNeedsSummary: support,
        defaultPickupAddress: pickup,
        sharedWithCoordinator: shared,
      }),
    });
    setStatus(res.ok ? "Emergency profile saved." : "Save failed.");
  }

  return (
    <form onSubmit={save} className="space-y-4 max-w-xl">
      <div>
        <label htmlFor="mobility" className="block text-sm font-medium">
          Mobility and evacuation needs
        </label>
        <textarea
          id="mobility"
          value={mobility}
          onChange={(e) => setMobility(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-border px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="communication" className="block text-sm font-medium">
          Communication needs
        </label>
        <textarea
          id="communication"
          value={communication}
          onChange={(e) => setCommunication(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-lg border border-border px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="support" className="block text-sm font-medium">
          Support needs in a crisis
        </label>
        <textarea
          id="support"
          value={support}
          onChange={(e) => setSupport(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-lg border border-border px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="pickup" className="block text-sm font-medium">
          Default pickup address (transport escalation)
        </label>
        <input
          id="pickup"
          value={pickup}
          onChange={(e) => setPickup(e.target.value)}
          className="mt-1 w-full min-h-10 rounded-lg border border-border px-3"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={shared}
          onChange={(e) => setShared(e.target.checked)}
        />
        Share emergency plan summary with my support coordinator (when enabled)
      </label>
      <button
        type="submit"
        className="min-h-11 rounded-lg bg-primary px-4 font-medium text-primary-foreground"
      >
        Save profile
      </button>
      {status ? (
        <p role="status" className="text-sm text-muted-foreground">
          {status}
        </p>
      ) : null}
    </form>
  );
}
