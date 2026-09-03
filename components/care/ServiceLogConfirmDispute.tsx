"use client";

import { useState } from "react";

import { PostServiceCsatPrompt } from "@/components/engagement/PostServiceCsatPrompt";
import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

export function ServiceLogConfirmDispute({
  logId,
  careShiftId,
  status,
  organisationId,
}: {
  logId: string;
  careShiftId?: string | null;
  status: string;
  organisationId?: string;
}) {
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<
    "approve" | "concern" | null
  >(null);
  const [showCsat, setShowCsat] = useState(false);
  const feedbackContextId = careShiftId ?? logId;
  const reasonId = `disputeReason-${logId}`;
  const reasonHintId = `${reasonId}-hint`;

  async function approveRecord() {
    setMsg(null);
    setPendingAction("approve");
    try {
      const response = await fetch(
        `/api/care/service-logs/${logId}/confirm`,
        { method: "POST" }
      );
      if (!response.ok) {
        setMsg("We could not approve this record. Please try again.");
        return;
      }
      setShowCsat(true);
    } catch {
      setMsg("We could not approve this record. Check your connection and try again.");
    } finally {
      setPendingAction(null);
    }
  }

  async function raiseConcern() {
    const trimmedReason = reason.trim();
    setMsg(null);
    if (trimmedReason.length < 3) {
      setMsg("Tell us what needs correcting so the team can review the record.");
      document.getElementById(reasonId)?.focus();
      return;
    }

    setPendingAction("concern");
    try {
      const response = await fetch(
        `/api/care/service-logs/${logId}/dispute`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ disputeReason: trimmedReason }),
        }
      );
      if (!response.ok) {
        setMsg("We could not send your concern. Please try again.");
        return;
      }
      window.location.reload();
    } catch {
      setMsg("We could not send your concern. Check your connection and try again.");
    } finally {
      setPendingAction(null);
    }
  }

  if (status === "confirmed") {
    return (
      <div className="space-y-3 rounded-xl border border-[#9CCFC0] bg-[#F1FAF7] p-4">
        <p className="text-sm font-medium text-[#006A4E]">
          You approved this support record.
        </p>
        <PostServiceCsatPrompt
          contextType="care_shift"
          contextId={feedbackContextId}
          organisationId={organisationId}
          label="How was this care session?"
        />
      </div>
    );
  }

  if (showCsat) {
    return (
      <PostServiceCsatPrompt
        contextType="care_shift"
        contextId={feedbackContextId}
        organisationId={organisationId}
        label="How was this care session?"
        onSubmitted={() => window.location.reload()}
      />
    );
  }

  if (status === "disputed") {
    return (
      <div className="rounded-xl border border-[#E0B000] bg-[#FFF9E8] p-4">
        <p className="text-sm font-medium text-[#6A4E00]">
          Your concern has been sent for human review.
        </p>
      </div>
    );
  }

  if (status !== "submitted") {
    return (
      <p className="text-sm leading-6 text-muted-foreground">
        This record is still being prepared. Review actions will appear after
        it is submitted.
      </p>
    );
  }

  return (
    <section
      aria-labelledby={`support-record-actions-${logId}`}
      className="space-y-4 rounded-xl border-2 border-[#005B7F] bg-card p-4 sm:p-5"
    >
      <div className="space-y-2">
        <h3
          id={`support-record-actions-${logId}`}
          className="font-heading text-lg font-bold text-[#0C1833]"
        >
          Is this record accurate?
        </h3>
        <p className="text-sm leading-6 text-muted-foreground">
          Approving verifies that the record reflects the support delivered. It
          does not approve NDIS funding, payment or a future booking.
        </p>
      </div>

      <Button
        type="button"
        size="lg"
        disabled={pendingAction !== null}
        onClick={() => void approveRecord()}
      >
        {pendingAction === "approve" ? "Approving…" : "Approve record"}
      </Button>

      <div className="border-t border-border/70 pt-4">
        <label htmlFor={reasonId} className="text-sm font-semibold">
          Something needs correcting
        </label>
        <p id={reasonHintId} className="mt-1 text-sm text-muted-foreground">
          Describe what is missing or incorrect. A person will review your
          concern.
        </p>
        <textarea
          id={reasonId}
          className={`${formInputClass} mt-2`}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={3}
          minLength={3}
          maxLength={2000}
          aria-describedby={reasonHintId}
          disabled={pendingAction !== null}
        />
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="mt-3"
          disabled={pendingAction !== null}
          onClick={() => void raiseConcern()}
        >
          {pendingAction === "concern" ? "Sending…" : "Raise a concern"}
        </Button>
      </div>

      <div aria-live="polite">
        {msg ? (
          <p role="alert" className="text-sm text-destructive">
            {msg}
          </p>
        ) : null}
      </div>
    </section>
  );
}
