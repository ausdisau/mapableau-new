"use client";

import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { disputeParticipantLabel } from "@/lib/disputes/access";
import { Button } from "@/components/ui/button";

export function ProviderResponsePanel({
  disputeId,
  participantName,
  canRespond,
}: {
  disputeId: string;
  participantName: string;
  canRespond: boolean;
}) {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  if (!canRespond) return null;

  return (
    <section
      aria-labelledby="provider-response-heading"
      className="space-y-3 rounded-lg border p-4"
    >
      <h2 id="provider-response-heading" className="font-heading text-lg font-semibold">
        Provider response
      </h2>
      <p className="text-sm text-muted-foreground">
        Responding to {disputeParticipantLabel(participantName)}. Do not share
        this response outside your organisation.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          const fd = new FormData(e.currentTarget);
          const res = await fetch(`/api/disputes/${disputeId}/respond`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ body: fd.get("body") }),
          });
          setLoading(false);
          setStatus(res.ok ? "Response sent." : "Could not send response.");
          if (res.ok) window.location.reload();
        }}
      >
        <label htmlFor="provider-response-body" className="text-sm font-medium">
          Your response
        </label>
        <textarea
          id="provider-response-body"
          name="body"
          className={formInputClass}
          rows={4}
          required
        />
        {status ? (
          <p className="text-sm" role="status" aria-live="polite">
            {status}
          </p>
        ) : null}
        <Button type="submit" variant="default" size="default" loading={loading}>
          Send response
        </Button>
      </form>
    </section>
  );
}
