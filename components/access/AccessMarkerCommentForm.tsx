"use client";

import { useState } from "react";

import { AccessMarkerModal } from "@/components/access/AccessMarkerModal";
import { AccessibleFormField, formInputClass } from "@/components/forms/AccessibleFormField";
import type { AccessMarkerCommentType } from "@/lib/access-markers/types";

const COMMENT_TYPES: { value: AccessMarkerCommentType; label: string }[] = [
  { value: "general", label: "General" },
  { value: "mobility", label: "Mobility" },
  { value: "toilet", label: "Toilet" },
  { value: "parking", label: "Parking" },
  { value: "sensory", label: "Sensory" },
  { value: "communication", label: "Communication" },
  { value: "staff_service", label: "Staff / service" },
  { value: "temporary_alert", label: "Temporary alert" },
  { value: "transport_dropoff", label: "Transport / drop-off" },
  { value: "correction", label: "Correction" },
];

type AccessMarkerCommentFormProps = {
  placeId: string;
  placeName: string;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export function AccessMarkerCommentForm({
  placeId,
  placeName,
  open,
  onClose,
  onSaved,
}: AccessMarkerCommentFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);

    if (fd.get("privacyConfirmed") !== "on") {
      setError(
        "Please confirm you have not included private information or photos of people without consent."
      );
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`/api/access/places/${placeId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentType: fd.get("commentType"),
          body: fd.get("body"),
          privacyConfirmed: true,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j.error ?? "Could not save comment. Sign in and try again.");
        return;
      }
      if (j.needsReview) {
        setInfo(
          "Thanks — your comment was sent for review before it appears publicly."
        );
      }
      onSaved();
      if (!j.needsReview) onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AccessMarkerModal
      open={open}
      title={`Comment — ${placeName}`}
      onClose={onClose}
    >
      <form className="space-y-5" onSubmit={onSubmit} noValidate>
        <p className="text-sm text-muted-foreground">
          Good example: “The entrance had one 80mm step on 14 July 2026.” Avoid
          legal declarations such as “This venue illegally discriminates.”
        </p>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {info ? (
          <p role="status" className="text-sm text-[#005B7F]">
            {info}
          </p>
        ) : null}

        <AccessibleFormField id="commentType" label="Comment type" required>
          <select
            id="commentType"
            name="commentType"
            required
            className={formInputClass}
            defaultValue="general"
          >
            {COMMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </AccessibleFormField>

        <AccessibleFormField
          id="commentBody"
          label="Your observation"
          required
          hint="Plain language. No private contact details."
        >
          <textarea
            id="commentBody"
            name="body"
            required
            minLength={10}
            rows={5}
            className={formInputClass}
          />
        </AccessibleFormField>

        <label className="flex min-h-12 items-start gap-3">
          <input
            type="checkbox"
            name="privacyConfirmed"
            required
            className="mt-1 h-5 w-5"
          />
          <span className="text-sm">
            I have not included private information or photos of people without
            consent.
          </span>
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="min-h-12 rounded-xl bg-[#005B7F] px-5 font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Sending…" : "Post comment"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 rounded-xl border border-border px-5 font-semibold"
          >
            Cancel
          </button>
        </div>
      </form>
    </AccessMarkerModal>
  );
}
