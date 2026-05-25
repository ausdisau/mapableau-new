"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function InvoiceDisputePanel({ invoiceId }: { invoiceId: string }) {
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (reason.length < 10) {
      setMessage("Please describe the issue in at least 10 characters.");
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/invoices/${invoiceId}/dispute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    setMessage(res.ok ? "Dispute recorded. Your provider will review it." : data.error);
    setBusy(false);
  }

  return (
    <section className="rounded-md border border-amber-500/40 p-4" aria-labelledby="dispute-heading">
      <h2 id="dispute-heading" className="font-heading text-lg font-semibold">
        Dispute this invoice
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Use this if something looks wrong. This pauses payment while it is reviewed.
      </p>
      <label htmlFor="dispute-reason" className="mt-3 block text-sm font-medium">
        What is incorrect?
      </label>
      <textarea
        id="dispute-reason"
        required
        minLength={10}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
      <Button
        type="button"
        variant="outline"
        size="default"
        className="mt-3"
        disabled={busy}
        onClick={() => void submit()}
      >
        Submit dispute
      </Button>
      {message ? (
        <p className="mt-2 text-sm" role="status" aria-live="polite">
          {message}
        </p>
      ) : null}
    </section>
  );
}
