"use client";

import { useState } from "react";

import { MapAbleCard } from "@/components/shared/MapAbleModuleUi";

export function PaymentStatusUpdater({ invoiceId }: { invoiceId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function updateStatus(action: "processing" | "paid") {
    setLoading(true);
    setMessage(null);
    const path =
      action === "processing"
        ? `/api/plan-manager/invoices/${invoiceId}/mark-processing`
        : `/api/plan-manager/invoices/${invoiceId}/mark-paid`;
    const res = await fetch(path, { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setMessage(`Payment status updated to ${action}.`);
    } else {
      setMessage(data.error ?? "Could not update status");
    }
  }

  return (
    <MapAbleCard title="Payment processing status">
      {message ? (
        <p role="status" aria-live="polite" className="mb-4 text-sm">
          {message}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={() => updateStatus("processing")}
          className="min-h-11 rounded-lg border px-4 py-2 disabled:opacity-50"
        >
          Mark processing
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => updateStatus("paid")}
          className="min-h-11 rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
        >
          Mark paid
        </button>
      </div>
    </MapAbleCard>
  );
}
