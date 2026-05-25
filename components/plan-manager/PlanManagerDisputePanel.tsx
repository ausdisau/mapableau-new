"use client";

import { useState } from "react";

import { MapAbleCard } from "@/components/shared/MapAbleModuleUi";

export function PlanManagerDisputePanel({ invoiceId }: { invoiceId: string }) {
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function handleDispute(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/plan-manager/invoices/${invoiceId}/dispute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    setMessage(res.ok ? "Dispute flagged for review." : data.error);
  }

  return (
    <MapAbleCard title="Dispute flagging">
      <form onSubmit={handleDispute} className="space-y-3">
        {message ? (
          <p role="status" aria-live="polite" className="text-sm">
            {message}
          </p>
        ) : null}
        <label htmlFor="dispute-reason" className="block text-sm font-medium">
          Reason for dispute
        </label>
        <textarea
          id="dispute-reason"
          required
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full rounded-lg border px-3 py-2"
        />
        <button
          type="submit"
          className="min-h-11 rounded-lg border border-red-300 px-4 py-2 text-red-900"
        >
          Flag dispute
        </button>
      </form>
    </MapAbleCard>
  );
}
