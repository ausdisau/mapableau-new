"use client";

import { useState } from "react";

export function CapacityDeclarationForm() {
  const [serviceType, setServiceType] = useState("community_access");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/provider/capacity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceType,
        acceptingNewParticipants: true,
      }),
    });
  }

  return (
    <form onSubmit={submit} className="max-w-md space-y-3 rounded-xl border p-4">
      <h2 className="font-heading text-lg font-semibold">Declare capacity</h2>
      <label className="block text-sm">
        Service type
        <input
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value)}
          className="mt-1 min-h-11 w-full rounded-lg border px-3"
        />
      </label>
      <button type="submit" className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground">
        Save capacity
      </button>
    </form>
  );
}
