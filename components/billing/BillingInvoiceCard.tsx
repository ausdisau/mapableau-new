"use client";

import type { BillingFundingSource, BillingInvoice } from "@prisma/client";
import { format } from "date-fns";

type InvoiceWithFunding = BillingInvoice & {
  fundingSource: BillingFundingSource | null;
};

function formatAud(cents: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(cents / 100);
}

export function BillingInvoiceCard({
  invoice,
  onPay,
  onPlanManager,
  onDownload,
  onStatus,
  busy,
}: {
  invoice: InvoiceWithFunding;
  onPay: () => void;
  onPlanManager: () => void;
  onDownload: () => void;
  onStatus: () => void;
  busy?: boolean;
}) {
  const planManaged = invoice.fundingSource?.type === "ndis_plan_managed";
  const canPay =
    !planManaged &&
    ["draft", "issued", "pending_payment", "failed"].includes(invoice.status);

  return (
    <article
      className="rounded-lg border border-border bg-card p-5 shadow-sm"
      aria-labelledby={`invoice-title-${invoice.id}`}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id={`invoice-title-${invoice.id}`}
            className="text-lg font-semibold capitalize"
          >
            {invoice.serviceType} invoice
          </h2>
          <p className="text-sm text-muted-foreground">
            <span className="sr-only">Status: </span>
            {invoice.status.replace(/_/g, " ")}
          </p>
        </div>
        <p className="text-xl font-bold" aria-label={`Total ${formatAud(invoice.totalCents)}`}>
          {formatAud(invoice.totalCents)}
        </p>
      </header>

      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-medium text-muted-foreground">Funding</dt>
          <dd>{invoice.fundingSource?.label ?? "Not set"}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Due</dt>
          <dd>
            {invoice.dueAt
              ? format(new Date(invoice.dueAt), "d MMM yyyy")
              : "—"}
          </dd>
        </div>
      </dl>

      <div
        className="mt-6 flex flex-wrap gap-3"
        role="group"
        aria-label={`Actions for ${invoice.serviceType} invoice`}
      >
        {canPay && (
          <button
            type="button"
            onClick={onPay}
            disabled={busy}
            className="min-h-11 min-w-[8rem] rounded-lg bg-primary px-5 py-3 text-base font-medium text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Pay now
          </button>
        )}
        {planManaged && (
          <button
            type="button"
            onClick={onPlanManager}
            disabled={busy}
            className="min-h-11 min-w-[8rem] rounded-lg border border-border bg-background px-5 py-3 text-base font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Send to plan manager
          </button>
        )}
        <button
          type="button"
          onClick={onDownload}
          disabled={busy}
          className="min-h-11 min-w-[8rem] rounded-lg border border-border bg-background px-5 py-3 text-base font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Download invoice
        </button>
        <button
          type="button"
          onClick={onStatus}
          className="min-h-11 min-w-[8rem] rounded-lg border border-border px-5 py-3 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          View payment status
        </button>
      </div>
    </article>
  );
}
