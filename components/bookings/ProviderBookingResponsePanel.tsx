"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { AccessibleConfirmDialog } from "@/components/ui/AccessibleConfirmDialog";
import { Button } from "@/components/ui/button";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { fetchJson } from "@/lib/client/fetch-json";

export function ProviderBookingResponsePanel({
  bookingId,
  currentStatus,
}: {
  bookingId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [declineLoading, setDeclineLoading] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [message, setMessage] = useState<{
    variant: "success" | "error";
    text: string;
  } | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);

  if (currentStatus === "accepted" || currentStatus === "declined") {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Provider response: {currentStatus}
      </p>
    );
  }

  async function acceptBooking() {
    setAcceptLoading(true);
    setMessage(null);
    const result = await fetchJson(`/api/provider/bookings/${bookingId}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
    setAcceptLoading(false);
    if (!result.ok) {
      setMessage({ variant: "error", text: result.error });
      return;
    }
    setMessage({ variant: "success", text: "Booking accepted." });
    router.refresh();
  }

  async function declineBooking(declineNote: string) {
    setDeclineLoading(true);
    setDialogError(null);
    const result = await fetchJson(`/api/provider/bookings/${bookingId}/decline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: declineNote || note }),
    });
    setDeclineLoading(false);
    if (!result.ok) {
      setDialogError(result.error);
      return;
    }
    setDeclineOpen(false);
    setMessage({ variant: "success", text: "Booking declined. The participant will be notified." });
    router.refresh();
  }

  return (
    <section
      className="rounded-xl border border-border bg-card p-4"
      aria-labelledby="provider-booking-response-heading"
    >
      <h2 id="provider-booking-response-heading" className="font-semibold">
        Respond to booking request
      </h2>
      <p className="text-sm text-muted-foreground">
        Accept if you can deliver support. Decline if you cannot — the participant
        will be notified.
      </p>

      {message ? (
        <StatusMessage
          variant={message.variant === "error" ? "error" : "success"}
          message={message.text}
          className="mt-4"
          onDismiss={() => setMessage(null)}
        />
      ) : null}

      <AccessibleFormField
        id="provider-note"
        label="Note to participant (optional)"
        className="mt-3"
      >
        <textarea
          id="provider-note"
          className={formInputClass}
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </AccessibleFormField>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="default"
          size="default"
          loading={acceptLoading}
          disabled={declineLoading}
          onClick={() => void acceptBooking()}
        >
          Accept booking
        </Button>
        <Button
          type="button"
          variant="outline"
          size="default"
          disabled={acceptLoading || declineLoading}
          onClick={() => {
            setDialogError(null);
            setDeclineOpen(true);
          }}
        >
          Decline booking
        </Button>
      </div>

      <AccessibleConfirmDialog
        open={declineOpen}
        onOpenChange={setDeclineOpen}
        title="Decline this booking?"
        description="The participant will be notified that your organisation cannot deliver this support."
        confirmLabel="Decline booking"
        confirmVariant="destructive"
        loading={declineLoading}
        error={dialogError}
        inputLabel="Reason for declining (optional)"
        inputPlaceholder="Share a brief note for the participant or admin team"
        onConfirm={declineBooking}
      />
    </section>
  );
}
