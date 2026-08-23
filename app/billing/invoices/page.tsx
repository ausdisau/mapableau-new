import Link from "next/link";

import { AccessibleDataTable } from "@/components/billing/AccessibleDataTable";
import { BillingPageHeader } from "@/components/billing/BillingPageChrome";
import { InvoiceStatusBadge } from "@/components/billing/InvoiceStatusBadge";
import { CheckoutReturnBanner } from "@/components/billing/portal/CheckoutReturnBanner";
import { ManagePaymentMethodsButton } from "@/components/billing/portal/ManagePaymentMethodsButton";
import { PayNowButton } from "@/components/billing/portal/PayNowButton";
import { requireAuth } from "@/lib/auth/guards";
import { listAccessibleBillingInvoices } from "@/lib/billing/core/invoice-service";
import { formatAud } from "@/lib/billing/money";
import {
  isInvoicePayable,
  isInvoiceSettled,
} from "@/lib/billing/portal-gating";
import type { BillingInvoiceState } from "@/types/billing";

export default async function BillingInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const user = await requireAuth();
  const { checkout } = await searchParams;

  const invoices = await listAccessibleBillingInvoices(user).catch(
    (): Awaited<ReturnType<typeof listAccessibleBillingInvoices>> => []
  );

  const outstanding = invoices.filter((inv) => !isInvoiceSettled(inv.status));
  const paid = invoices.filter((inv) => isInvoiceSettled(inv.status));

  return (
    <div className="space-y-6">
      <BillingPageHeader
        title="Invoices"
        description="Pay outstanding invoices with Stripe Checkout, or export plan-managed invoices. Paid status is confirmed by Stripe webhooks."
      >
        <ManagePaymentMethodsButton flow="payment_method_update" />
      </BillingPageHeader>

      <CheckoutReturnBanner checkout={checkout} />

      <InvoiceSection
        title="Outstanding"
        caption="Outstanding invoices"
        emptyMessage="No outstanding invoices."
        rows={outstanding}
      />
      <InvoiceSection
        title="Paid and settled"
        caption="Paid and settled invoices"
        emptyMessage="No paid invoices yet."
        rows={paid}
        hidePay
      />
    </div>
  );
}

function InvoiceSection({
  title,
  caption,
  emptyMessage,
  rows,
  hidePay,
}: {
  title: string;
  caption: string;
  emptyMessage: string;
  hidePay?: boolean;
  rows: Awaited<ReturnType<typeof listAccessibleBillingInvoices>>;
}) {
  return (
    <section className="space-y-3" aria-labelledby={`${caption}-heading`}>
      <h2 id={`${caption}-heading`} className="text-lg font-black text-[#0C1833]">
        {title}
      </h2>
      <AccessibleDataTable
        caption={caption}
        rows={rows.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber ?? inv.id.slice(0, 8),
          status: inv.status as BillingInvoiceState,
          totalCents: inv.totalCents,
          createdAt: inv.createdAt,
          fundingType: inv.fundingSource?.type ?? null,
          payable: isInvoicePayable(inv.status, inv.fundingSource?.type),
          planManaged: inv.fundingSource?.type === "ndis_plan_managed",
        }))}
        emptyMessage={emptyMessage}
        columns={[
          {
            id: "number",
            header: "Invoice",
            cell: (row) => (
              <Link
                href={`/billing/invoices/${row.id}`}
                className="font-semibold text-[#005B7F] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/40"
              >
                {row.invoiceNumber}
              </Link>
            ),
          },
          {
            id: "status",
            header: "Status",
            cell: (row) => (
              <InvoiceStatusBadge status={row.status} showDescription={false} />
            ),
          },
          {
            id: "total",
            header: "Total",
            align: "right",
            cell: (row) => formatAud(row.totalCents),
          },
          {
            id: "created",
            header: "Created",
            cell: (row) =>
              row.createdAt.toLocaleDateString("en-AU", { dateStyle: "medium" }),
          },
          {
            id: "actions",
            header: "Actions",
            cell: (row) =>
              hidePay ? (
                <span className="text-sm text-slate-500">View details</span>
              ) : row.payable || row.planManaged ? (
                <PayNowButton
                  invoiceId={row.id}
                  planManaged={row.planManaged}
                />
              ) : (
                <span className="text-sm text-slate-500">Not payable</span>
              ),
          },
        ]}
      />
    </section>
  );
}
