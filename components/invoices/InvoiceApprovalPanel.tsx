"use client";

type Props = {
  claimableCents: number;
  participantGapCents: number;
  onApprove?: () => void;
};

function formatAud(cents: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(cents / 100);
}

export function InvoiceApprovalPanel({
  claimableCents,
  participantGapCents,
  onApprove,
}: Props) {
  return (
    <section
      className="rounded-lg border p-4"
      aria-labelledby="invoice-approval-heading"
    >
      <h2 id="invoice-approval-heading" className="font-heading text-lg font-semibold">
        Understand your invoice
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        These amounts are shown in plain language for your review. NDIS claimable
        amounts may still need confirmation from your plan manager. This is not
        legal or funding advice.
      </p>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt>May be claimable from NDIS plan</dt>
          <dd className="font-medium">{formatAud(claimableCents)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>You may need to pay (gap or private)</dt>
          <dd className="font-medium">{formatAud(participantGapCents)}</dd>
        </div>
      </dl>
      {onApprove ? (
        <button
          type="button"
          onClick={onApprove}
          className="mt-4 min-h-11 rounded bg-primary px-4 text-primary-foreground"
        >
          I have reviewed and approve this invoice
        </button>
      ) : null}
    </section>
  );
}
