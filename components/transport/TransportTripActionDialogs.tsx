"use client";

import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";
import type { TransportNextAction } from "@/types/transport";

type DialogKind = "cancel" | "dispute" | null;

export function TransportTripActionDialogs({
  tripId,
  actions,
  onComplete,
}: {
  tripId: string;
  actions: TransportNextAction[];
  onComplete: () => void;
}) {
  const [open, setOpen] = useState<DialogKind>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const participantActions = actions.filter((a) =>
    ["cancel", "confirm", "dispute"].includes(a.action)
  );
  if (participantActions.length === 0) return null;

  async function submit(action: TransportNextAction, body?: object) {
    if (!action.href) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(action.href, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : "That action could not be completed."
        );
        return;
      }
      setOpen(null);
      setReason("");
      onComplete();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-3" aria-labelledby={`trip-actions-${tripId}`}>
      <h2 id={`trip-actions-${tripId}`} className="font-semibold">
        Actions
      </h2>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <ul className="flex flex-wrap gap-2">
        {participantActions.map((action) => (
          <li key={action.action}>
            <Button
              type="button"
              variant={action.action === "cancel" ? "outline" : "default"}
              loading={loading}
              onClick={() => {
                if (action.action === "cancel") {
                  setOpen("cancel");
                  return;
                }
                if (action.action === "dispute") {
                  setOpen("dispute");
                  return;
                }
                void submit(action, { confirmed: true });
              }}
            >
              {action.label}
            </Button>
          </li>
        ))}
      </ul>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="trip-action-dialog-title"
          className="rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <h3 id="trip-action-dialog-title" className="font-semibold">
            {open === "cancel" ? "Cancel trip" : "Dispute trip"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {open === "cancel"
              ? "You can add an optional reason. This helps your provider understand what changed."
              : "Describe what went wrong so we can review your trip."}
          </p>
          <label className="mt-3 block text-sm font-medium" htmlFor="trip-action-reason">
            {open === "dispute" ? "Reason (required)" : "Reason (optional)"}
          </label>
          <textarea
            id="trip-action-reason"
            className={formInputClass}
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required={open === "dispute"}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="default"
              loading={loading}
              onClick={() => {
                const action = participantActions.find((a) => a.action === open);
                if (!action) return;
                if (open === "dispute" && reason.trim().length < 3) {
                  setError("Please enter at least a few words describing the issue.");
                  return;
                }
                void submit(
                  action,
                  open === "cancel"
                    ? { reason: reason.trim() || undefined }
                    : { reason: reason.trim() }
                );
              }}
            >
              Submit
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => {
                setOpen(null);
                setReason("");
                setError(null);
              }}
            >
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
