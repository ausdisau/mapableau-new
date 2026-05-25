"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function InvoiceApprovalPanel({
  invoiceId,
  canApprove,
}: {
  invoiceId: string;
  canApprove: boolean;
}) {
  const router = useRouter();
  const [disputeReason, setDisputeReason] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  if (!canApprove) {
    return (
      <p className="text-sm text-slate-600" role="status">
        This invoice is not waiting for your approval.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
      <h2 className="font-semibold">Your decision</h2>
      {error ? (
        <div role="alert" className="text-red-800 bg-red-50 border border-red-200 rounded p-3 text-sm">
          {error}
        </div>
      ) : null}
      <button
        type="button"
        className="min-h-11 w-full sm:w-auto px-4 rounded-md bg-blue-700 text-white font-medium"
        onClick={async () => {
          setError("");
          setStatus("Approving…");
          const res = await fetch(`/api/invoices/${invoiceId}/approve`, {
            method: "POST",
          });
          if (!res.ok) {
            setStatus("");
            setError("Could not approve invoice");
            return;
          }
          setStatus("Approved. Thank you.");
          router.refresh();
        }}
      >
        Approve invoice
      </button>
      <div>
        <label htmlFor="dispute" className="block text-sm font-medium mb-1">
          Dispute reason (optional)
        </label>
        <textarea
          id="dispute"
          rows={3}
          className="w-full border rounded-md px-3 py-2"
          value={disputeReason}
          onChange={(e) => setDisputeReason(e.target.value)}
        />
        <button
          type="button"
          className="mt-2 min-h-11 px-4 rounded-md border border-slate-300 font-medium"
          onClick={async () => {
            if (!disputeReason.trim()) {
              setError("Please add a reason to dispute");
              return;
            }
            setError("");
            setStatus("Submitting dispute…");
            const res = await fetch(`/api/invoices/${invoiceId}/dispute`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reason: disputeReason }),
            });
            if (!res.ok) {
              setStatus("");
              setError("Could not submit dispute");
              return;
            }
            setStatus("Dispute recorded. Support may contact you.");
            router.refresh();
          }}
        >
          Dispute invoice
        </button>
      </div>
      <p aria-live="polite" className="text-sm text-slate-600">
        {status}
      </p>
    </div>
  );
}
