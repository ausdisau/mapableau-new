"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ParticipantInvoiceActions({
  invoiceId,
  participantGapCents,
  status,
}: {
  invoiceId: string;
  participantGapCents: number;
  status: string;
}) {
  const [message, setMessage] = useState("");

  async function approve() {
    if (
      !window.confirm(
        "Approve this invoice? This confirms the charges look correct before plan manager or payment steps."
      )
    ) {
      return;
    }
    const res = await fetch(`/api/invoices/${invoiceId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approvedByRole: "participant" }),
    });
    setMessage(res.ok ? "Invoice approved." : "Approval failed.");
    if (res.ok) window.location.reload();
  }

  async function payGap() {
    const res = await fetch(
      `/api/invoices/${invoiceId}/stripe-payment-intent`,
      { method: "POST" }
    );
    const data = await res.json();
    if (data.clientSecret) {
      setMessage("Payment started. Complete payment in the checkout flow.");
    } else {
      setMessage(data.error ?? "Payment could not start.");
    }
  }

  async function dispute() {
    const res = await fetch(`/api/invoices/${invoiceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "disputed" }),
    });
    setMessage(res.ok ? "Dispute recorded." : "Could not open dispute.");
    if (res.ok) window.location.reload();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {(status === "issued" ||
        status === "awaiting_participant_approval") && (
        <Button type="button" variant="default" size="default" onClick={approve}>
          Approve invoice
        </Button>
      )}
      {participantGapCents > 0 && status !== "paid" && (
        <Button type="button" variant="outline" size="default" onClick={payGap}>
          Pay your portion ({(participantGapCents / 100).toFixed(2)} AUD)
        </Button>
      )}
      <Button type="button" variant="outline" size="default" onClick={dispute}>
        Dispute invoice
      </Button>
      {message && (
        <p className="w-full text-sm" role="status" aria-live="polite">
          {message}
        </p>
      )}
    </div>
  );
}
