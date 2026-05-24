"use client";

import Link from "next/link";
import { useState } from "react";

export default function EmergencyTransportPage() {
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    const res = await fetch("/api/emergency/transport-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pickupAddress: pickup,
        dropoffAddress: dropoff,
        urgencyNotes: notes,
      }),
    });
    const data = await res.json();
    setStatus(
      res.ok
        ? "Transport escalation submitted. Check Bookings for status."
        : data.error ?? "Request failed",
    );
  }

  return (
    <div className="space-y-6 max-w-xl">
      <Link href="/dashboard/emergency" className="text-sm text-primary underline">
        ← Emergency
      </Link>
      <h1 className="font-heading text-2xl font-bold">Emergency transport</h1>
      <p className="text-sm text-muted-foreground">
        Creates a priority MapAble Transport booking. This does not replace
        ambulance services — call 000 if needed.
      </p>
      <form onSubmit={submit} className="space-y-4">
        <input
          required
          placeholder="Pickup address"
          value={pickup}
          onChange={(e) => setPickup(e.target.value)}
          className="w-full min-h-10 rounded-lg border border-border px-3"
        />
        <input
          required
          placeholder="Dropoff address"
          value={dropoff}
          onChange={(e) => setDropoff(e.target.value)}
          className="w-full min-h-10 rounded-lg border border-border px-3"
        />
        <textarea
          placeholder="Urgency notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-border px-3 py-2"
        />
        <button
          type="submit"
          className="min-h-11 rounded-lg bg-primary px-4 font-medium text-primary-foreground"
        >
          Request transport
        </button>
      </form>
      {status ? (
        <p role="status" className="text-sm">
          {status}
        </p>
      ) : null}
    </div>
  );
}
