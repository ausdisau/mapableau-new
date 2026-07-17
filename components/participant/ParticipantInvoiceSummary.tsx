import React from "react";
import Link from "next/link";

import type { ParticipantInvoiceSummaryItem } from "@/types/participant-dashboard";

type ParticipantInvoiceSummaryProps = {
  invoices: ParticipantInvoiceSummaryItem[];
};

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(cents / 100);
}

export function ParticipantInvoiceSummary({
  invoices,
}: ParticipantInvoiceSummaryProps) {
  return (
    <section aria-labelledby="invoices-heading" className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2
          id="invoices-heading"
          className="font-heading text-lg font-semibold text-foreground"
        >
          Invoices needing attention
        </h2>
        <Link
          href="/dashboard/invoices"
          className="text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          All invoices
        </Link>
      </div>
      {invoices.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
          No invoices need your attention right now. When a provider sends an
          invoice, you can review and approve it here.
        </p>
      ) : (
        <ul className="space-y-2">
          {invoices.map((invoice) => (
            <li key={invoice.id}>
              <Link
                href={`/dashboard/invoices`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-card p-4 transition hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="text-sm font-medium text-foreground">
                  {invoice.invoiceNumber ?? `Invoice ${invoice.id.slice(0, 8)}`}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatMoney(invoice.totalCents)} ·{" "}
                  {invoice.status.replace(/_/g, " ")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
