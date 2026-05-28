"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type Props = {
  agreementId: string;
  canSendForReview?: boolean;
  canParticipantSign?: boolean;
  canProviderSign?: boolean;
  canActivate?: boolean;
  canCancel?: boolean;
  canAddRevision?: boolean;
};

export function AgreementLifecycleActions({
  agreementId,
  canSendForReview,
  canParticipantSign,
  canProviderSign,
  canActivate,
  canCancel,
  canAddRevision,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function post(path: string, body?: object) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error ?? "Action failed");
        return;
      }
      setMessage("Updated.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function addRevision() {
    const summary = window.prompt("Revision summary");
    if (!summary || summary.trim().length < 3) return;
    await post(`/api/service-agreements/${agreementId}/revisions`, {
      summary: summary.trim(),
      changeSetJson: { source: "manual_ui" },
    });
  }

  async function cancelAgreement() {
    const reason = window.prompt("Optional cancellation reason");
    await post(`/api/service-agreements/${agreementId}/cancel`, {
      reason: reason?.trim() || undefined,
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {canSendForReview ? (
          <Button
            type="button"
            variant="outline"
            size="default"
            disabled={busy}
            onClick={() =>
              post(`/api/service-agreements/${agreementId}/send-for-review`)
            }
          >
            Send for review
          </Button>
        ) : null}
        {canParticipantSign ? (
          <Button
            type="button"
            variant="default"
            size="default"
            disabled={busy}
            onClick={() =>
              post(`/api/service-agreements/${agreementId}/sign`, {
                role: "participant",
              })
            }
          >
            Participant sign
          </Button>
        ) : null}
        {canProviderSign ? (
          <Button
            type="button"
            variant="default"
            size="default"
            disabled={busy}
            onClick={() =>
              post(`/api/service-agreements/${agreementId}/sign`, {
                role: "provider",
              })
            }
          >
            Provider sign
          </Button>
        ) : null}
        {canActivate ? (
          <Button
            type="button"
            variant="secondary"
            size="default"
            disabled={busy}
            onClick={() =>
              post(`/api/service-agreements/${agreementId}/activate`)
            }
          >
            Activate
          </Button>
        ) : null}
        {canAddRevision ? (
          <Button
            type="button"
            variant="outline"
            size="default"
            disabled={busy}
            onClick={() => void addRevision()}
          >
            Add revision
          </Button>
        ) : null}
        {canCancel ? (
          <Button
            type="button"
            variant="outline"
            size="default"
            disabled={busy}
            onClick={() => void cancelAgreement()}
          >
            Cancel
          </Button>
        ) : null}
      </div>
      {message ? (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      ) : null}
    </div>
  );
}
