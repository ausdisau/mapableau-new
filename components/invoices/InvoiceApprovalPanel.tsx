"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function InvoiceApprovalPanel({
  invoiceId,
  canApprove,
}: {
  invoiceId: string;
  canApprove: boolean;
}) {
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function approve() {
    setBusy(true);
    const res = await fetch(`/api/invoices/${invoiceId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    const data = await res.json();
    setMessage(
      res.ok
        ? "Thank you — invoice approved. You can pay any private amount when ready."
        : data.error ?? "Approval failed"
    );
    setBusy(false);
    if (res.ok) window.location.reload();
  }

  if (!canApprove) return null;

  return (
    <section className="rounded-md border p-4" aria-labelledby="approve-heading">
      <h2 id="approve-heading" className="font-heading text-lg font-semibold">
        Approve this invoice
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Check the line items match the support you received. Approval does not
        pay the invoice automatically.
      </p>
      <label htmlFor="approval-notes" className="mt-3 block text-sm font-medium">
        Notes (optional)
      </label>
      <textarea
        id="approval-notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
      <Button
        type="button"
        variant="default"
        size="default"
        className="mt-3"
        disabled={busy}
        onClick={() => void approve()}
      >
        Approve invoice
      </Button>
      {message ? (
        <p className="mt-2 text-sm" role="status" aria-live="polite">
          {message}
        </p>
      ) : null}
    </section>
  );
}
