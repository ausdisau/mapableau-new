"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ProviderInvoiceActions({
  invoiceId,
  bookingId,
  status,
}: {
  invoiceId: string;
  bookingId?: string | null;
  status: string;
}) {
  const [xeroJson, setXeroJson] = useState<string>("");

  async function issue() {
    const res = await fetch(`/api/invoices/${invoiceId}/issue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dueInDays: 14 }),
    });
    if (res.ok) window.location.reload();
  }

  async function markPaid() {
    const res = await fetch(`/api/invoices/${invoiceId}/mark-paid`, {
      method: "POST",
    });
    if (res.ok) window.location.reload();
  }

  async function loadXeroPreview() {
    const res = await fetch(`/api/invoices/${invoiceId}/xero-preview`);
    const data = await res.json();
    setXeroJson(JSON.stringify(data.xero ?? data, null, 2));
  }

  async function createFromBooking() {
    if (!bookingId) return;
    const res = await fetch(`/api/invoices/from-booking/${bookingId}`, {
      method: "POST",
    });
    if (res.ok) {
      const data = await res.json();
      window.location.href = `/provider/invoices/${data.invoice.id}`;
    }
  }

  return (
    <div className="space-y-3">
      {bookingId && status === "draft" && (
        <Button type="button" variant="default" size="default" onClick={createFromBooking}>
          Refresh from booking
        </Button>
      )}
      {status === "draft" && (
        <Button type="button" variant="default" size="default" onClick={issue}>
          Issue invoice
        </Button>
      )}
      {status !== "paid" && (
        <Button type="button" variant="outline" size="default" onClick={markPaid}>
          Mark as paid
        </Button>
      )}
      <Button type="button" variant="outline" size="default" onClick={loadXeroPreview}>
        Export Xero-ready JSON
      </Button>
      {xeroJson && (
        <pre className="max-h-64 overflow-auto rounded border bg-muted p-3 text-xs">
          {xeroJson}
        </pre>
      )}
    </div>
  );
}
