"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function ParticipantApprovalButtons({
  invoiceId,
  canApprove,
  consentConfirmed,
}: {
  invoiceId: string;
  canApprove: boolean;
  consentConfirmed: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [showReject, setShowReject] = useState(false);

  if (!canApprove) return null;

  async function handleApprove() {
    setLoading("approve");
    setError(null);
    try {
      const res = await fetch(`/api/abilitypay/invoices/${invoiceId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmHuman: true }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Approval failed");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Approval failed");
    } finally {
      setLoading(null);
    }
  }

  async function handleReject() {
    if (!rejectNotes.trim()) {
      setError("Please add a reason for rejecting this invoice.");
      return;
    }
    setLoading("reject");
    setError(null);
    try {
      const res = await fetch(`/api/abilitypay/invoices/${invoiceId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmHuman: true,
          notes: rejectNotes,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Rejection failed");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rejection failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3" aria-live="polite">
      <p className="text-sm font-medium">Your decision</p>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {!showReject ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="default"
            size="default"
            className="min-h-11"
            disabled={!consentConfirmed || loading !== null}
            onClick={handleApprove}
          >
            {loading === "approve" ? "Approving…" : "Approve invoice"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="default"
            className="min-h-11"
            disabled={loading !== null}
            onClick={() => setShowReject(true)}
          >
            Reject invoice
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <label htmlFor="reject-notes" className="text-sm font-medium">
            Reason for rejection
          </label>
          <textarea
            id="reject-notes"
            className="min-h-24 w-full rounded-lg border border-input bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            aria-describedby={error ? "reject-error" : undefined}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="destructive"
              size="default"
              className="min-h-11"
              disabled={loading !== null}
              onClick={handleReject}
            >
              {loading === "reject" ? "Rejecting…" : "Confirm rejection"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="default"
              className="min-h-11"
              onClick={() => setShowReject(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
